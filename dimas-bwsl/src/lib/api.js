import { supabase } from '../supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.')
  }
  return {
    Authorization: `Bearer ${session.access_token}`
  }
}

export async function fetchApi(endpoint, options = {}) {
  const headers = await getAuthHeaders()
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan pada server API.')
  return json.data !== undefined ? json.data : json
}

export async function ambilDaftarWilayah() {
  return (await fetchApi('/wilayah')) || []
}

export async function ambilStatistikLengkap(kecamatan = '', desa = '') {
  const params = new URLSearchParams()
  if (kecamatan) params.set('kecamatan', kecamatan)
  if (desa) params.set('desa', desa)

  const query = params.toString() ? `?${params.toString()}` : ''
  return (await fetchApi(`/statistik${query}`)) || []
}

export async function cariDataValidasi({ nama, kecamatan = '', desa = '' }) {
  const params = new URLSearchParams({ nama })
  if (kecamatan) params.set('kecamatan', kecamatan)
  if (desa) params.set('desa', desa)

  return (await fetchApi(`/validasi?${params.toString()}`)) || []
}

export async function tambahPemilihBaru(payload) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE_URL}/pemilih`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data pemilih baru.')
  return json
}

export async function ubahDataPemilih(id, payload) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE_URL}/pemilih/${id}`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Gagal memperbarui data pemilih.')
  return json
}