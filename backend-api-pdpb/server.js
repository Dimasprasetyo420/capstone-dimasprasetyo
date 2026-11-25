import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { error: 'Terlalu banyak permintaan. Silakan tunggu 1 menit.' }
})

async function verifikasiPetugas(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token login tidak ditemukan.' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

  if (error || !user) {
    console.error('[AUTH ERROR]', error?.message)
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa.' })
  }

  req.user = user
  next()
}

app.get('/api/wilayah', apiLimiter, verifikasiPetugas, async (req, res) => {
  const { data, error } = await supabaseAdmin.rpc('get_wilayah_unik')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

app.get('/api/statistik', apiLimiter, verifikasiPetugas, async (req, res) => {
  const { kecamatan, desa } = req.query
  const { data, error } = await supabaseAdmin.rpc('get_statistik_lengkap', {
    p_kecamatan: kecamatan || null,
    p_desa: desa || null
  })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

app.get('/api/validasi', apiLimiter, verifikasiPetugas, async (req, res) => {
  const { nama, kecamatan, desa } = req.query

  if (!nama || !nama.trim()) {
    return res.status(400).json({ error: 'Parameter nama wajib diisi.' })
  }

  const kataKunci = nama.trim().replace(/\s+/g, ' ')

  let query = supabaseAdmin
    .from('users')
    .select('No, Nama, Jenis_Kelamin, Dusun, Rt, Rw, Desa, Kecamatan, Keterangan')
    .ilike('Nama', `%${kataKunci}%`)

  if (kecamatan) query = query.ilike('Kecamatan', kecamatan.trim())
  if (desa) query = query.ilike('Desa', desa.trim())

  const { data, error } = await query
    .order('Kecamatan', { ascending: true })
    .order('Desa', { ascending: true })
    .limit(25)

  if (error) return res.status(500).json({ error: error.message })

  console.log(`[AUDIT] ${req.user.email} mencari "${kataKunci}" (${data.length} hasil)`)

  res.json({ data })
})

app.post('/api/pemilih', apiLimiter, verifikasiPetugas, async (req, res) => {
  const { No, Nama, Jenis_Kelamin, Dusun, Rt, Rw, Desa, Kecamatan, Keterangan } = req.body

  if (!Nama || !Jenis_Kelamin || !Desa || !Kecamatan) {
    return res.status(400).json({ error: 'Nama, Jenis Kelamin, Kecamatan, dan Desa wajib diisi.' })
  }

  let nomorBaru = No
  if (!nomorBaru) {
    const { data: lastRow } = await supabaseAdmin
      .from('users')
      .select('No')
      .order('No', { ascending: false })
      .limit(1)
      .maybeSingle()

    nomorBaru = lastRow?.No ? Number(lastRow.No) + 1 : 1
  }

  const dataBaru = {
    No: nomorBaru,
    Nama: Nama.trim(),
    Jenis_Kelamin: Jenis_Kelamin.trim(),
    Dusun: Dusun ? Dusun.trim() : '',
    Rt: Rt ? String(Rt).trim() : '',
    Rw: Rw ? String(Rw).trim() : '',
    Desa: Desa.trim(),
    Kecamatan: Kecamatan.trim(),
    Keterangan: Keterangan ? Keterangan.trim() : 'Pemilih Pemula (17 Tahun)'
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([dataBaru])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  console.log(`[AUDIT INSERT] ${req.user.email} menambah pemilih baru No #${data.No}: "${dataBaru.Nama}"`)
  res.status(201).json({ message: 'Data pemilih baru berhasil ditambahkan.', data })
})

app.put('/api/pemilih/:no', apiLimiter, verifikasiPetugas, async (req, res) => {
  const { no } = req.params
  const { Nama, Jenis_Kelamin, Dusun, Rt, Rw, Desa, Kecamatan, Keterangan } = req.body

  if (!no) {
    return res.status(400).json({ error: 'Nomor (No) pemilih tidak valid.' })
  }

  const dataUpdate = {
    ...(Nama !== undefined && { Nama: Nama.trim() }),
    ...(Jenis_Kelamin !== undefined && { Jenis_Kelamin: Jenis_Kelamin.trim() }),
    ...(Dusun !== undefined && { Dusun: Dusun.trim() }),
    ...(Rt !== undefined && { Rt: String(Rt).trim() }),
    ...(Rw !== undefined && { Rw: String(Rw).trim() }),
    ...(Desa !== undefined && { Desa: Desa.trim() }),
    ...(Kecamatan !== undefined && { Kecamatan: Kecamatan.trim() }),
    ...(Keterangan !== undefined && { Keterangan: Keterangan.trim() })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(dataUpdate)
    .eq('No', no)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  console.log(`[AUDIT UPDATE] ${req.user.email} mengubah data No #${no} (${data.Nama}) -> Keterangan: "${data.Keterangan}"`)
  res.json({ message: 'Data pemilih berhasil diperbarui.', data })
})

app.listen(PORT, () => {
  console.log(`Backend API PDPB berjalan di http://localhost:${PORT}`)
})