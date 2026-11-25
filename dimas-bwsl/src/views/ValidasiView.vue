<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ambilDaftarWilayah,
  cariDataValidasi,
  tambahPemilihBaru,
  ubahDataPemilih
} from '../lib/api'

const wilayahList = ref([])
const filterKecamatan = ref('')
const filterDesa = ref('')
const kataKunciNama = ref('')

const hasilData = ref([])
const loading = ref(false)
const errorMsg = ref('')
const suksesMsg = ref('')

// Modal Input Pemilih Baru (17 Tahun)
const showCreateModal = ref(false)
const savingCreate = ref(false)
const formBaru = ref({
  Nama: '',
  Jenis_Kelamin: 'L',
  Kecamatan: '',
  Desa: '',
  Dusun: '',
  Rt: '',
  Rw: '',
  Keterangan: 'Pemilih Pemula (17 Tahun)'
})

// Modal Ubah Data
const editingRow = ref(null)
const savingEdit = ref(false)
const formEdit = ref({
  Nama: '',
  Jenis_Kelamin: 'L',
  Kecamatan: '',
  Desa: '',
  Dusun: '',
  Rt: '',
  Rw: '',
  Keterangan: ''
})

const daftarKecamatan = computed(() => {
  const setKec = new Set(wilayahList.value.map(w => w.Kecamatan).filter(Boolean))
  return Array.from(setKec).sort()
})

const daftarDesaFilter = computed(() => {
  if (!filterKecamatan.value) return []
  const setDesa = new Set(
    wilayahList.value
      .filter(w => w.Kecamatan === filterKecamatan.value)
      .map(w => w.Desa)
      .filter(Boolean)
  )
  return Array.from(setDesa).sort()
})

const daftarDesaModal = computed(() => {
  if (!formBaru.value.Kecamatan) return []
  const setDesa = new Set(
    wilayahList.value
      .filter(w => w.Kecamatan === formBaru.value.Kecamatan)
      .map(w => w.Desa)
      .filter(Boolean)
  )
  return Array.from(setDesa).sort()
})

onMounted(async () => {
  try {
    wilayahList.value = await ambilDaftarWilayah()
  } catch (err) {
    errorMsg.value = err.message
  }
})

function onKecamatanChange() {
  filterDesa.value = ''
}

async function handleCari() {
  errorMsg.value = ''
  suksesMsg.value = ''
  if (!kataKunciNama.value.trim()) {
    errorMsg.value = 'Masukkan nama pemilih terlebih dahulu.'
    return
  }

  loading.value = true
  try {
    hasilData.value = await cariDataValidasi({
      nama: kataKunciNama.value,
      kecamatan: filterKecamatan.value,
      desa: filterDesa.value
    })

    if (hasilData.value.length === 0) {
      errorMsg.value = `Data dengan nama "${kataKunciNama.value.trim()}" tidak ditemukan di database.`
    }
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

function bukaModalTambah() {
  errorMsg.value = ''
  suksesMsg.value = ''
  formBaru.value = {
    Nama: '',
    Jenis_Kelamin: 'L',
    Kecamatan: filterKecamatan.value || '',
    Desa: filterDesa.value || '',
    Dusun: '',
    Rt: '',
    Rw: '',
    Keterangan: 'Pemilih Pemula (17 Tahun)'
  }
  showCreateModal.value = true
}

async function simpanPemilihBaru() {
  savingCreate.value = true
  errorMsg.value = ''
  try {
    const res = await tambahPemilihBaru(formBaru.value)
    suksesMsg.value = res.message || 'Pemilih baru berhasil ditambahkan.'
    showCreateModal.value = false
    if (kataKunciNama.value.trim()) {
      await handleCari()
    }
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    savingCreate.value = false
  }
}

function bukaModalEdit(row) {
  errorMsg.value = ''
  suksesMsg.value = ''
  editingRow.value = row
  formEdit.value = {
    Nama: row.Nama || '',
    Jenis_Kelamin: row.Jenis_Kelamin || 'L',
    Kecamatan: row.Kecamatan || '',
    Desa: row.Desa || '',
    Dusun: row.Dusun || '',
    Rt: row.Rt || '',
    Rw: row.Rw || '',
    Keterangan: row.Keterangan || ''
  }
}

async function simpanPerubahan() {
  if (!editingRow.value?.No) {
    errorMsg.value = 'Nomor (No) pada data tidak ditemukan.'
    return
  }
  savingEdit.value = true
  errorMsg.value = ''
  try {
    const res = await ubahDataPemilih(editingRow.value.No, formEdit.value)
    suksesMsg.value = res.message || 'Data pemilih berhasil diperbarui.'
    editingRow.value = null
    await handleCari()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    savingEdit.value = false
  }
}
</script>

<template>
  <div class="page-wrap">
    <div class="top-bar">
      <div>
        <h2>Cek &amp; Validasi Nama Pemilih</h2>
        <p class="subtitle">Pencarian data Berdasarkan Data Pleno PDPB TW III oleh KPU Kabupaten Pasuruan</p>
      </div>
      <button type="button" class="btn-primary" @click="bukaModalTambah">
        + Pemilih Baru (17 Th)
      </button>
    </div>

    <form class="filter-box" @submit.prevent="handleCari">
      <input
        v-model="kataKunciNama"
        type="text"
        placeholder="Cari nama pemilih..."
        class="input"
      />
      <select v-model="filterKecamatan" @change="onKecamatanChange" class="input">
        <option value="">-- Semua Kecamatan --</option>
        <option v-for="kec in daftarKecamatan" :key="kec" :value="kec">{{ kec }}</option>
      </select>
      <select v-model="filterDesa" :disabled="!filterKecamatan" class="input">
        <option value="">-- Semua Desa --</option>
        <option v-for="desa in daftarDesaFilter" :key="desa" :value="desa">{{ desa }}</option>
      </select>
      <button type="submit" class="btn-secondary" :disabled="loading">
        {{ loading ? 'Mencari...' : 'Cari' }}
      </button>
    </form>

    <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>
    <div v-if="suksesMsg" class="alert-success">{{ suksesMsg }}</div>

    <div class="table-wrap" v-if="hasilData.length">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>JK</th>
            <th>Kecamatan</th>
            <th>Desa</th>
            <th>Dusun / RT / RW</th>
            <th>Keterangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in hasilData" :key="item.No || idx">
            <td><strong>{{ item.No }}</strong></td>
            <td>{{ item.Nama }}</td>
            <td>{{ item.Jenis_Kelamin }}</td>
            <td>{{ item.Kecamatan }}</td>
            <td>{{ item.Desa }}</td>
            <td>{{ item.Dusun || '-' }} ({{ item.Rt || '-' }}/{{ item.Rw || '-' }})</td>
            <td>{{ item.Keterangan || 'Berhak Memilih' }}</td>
            <td>
              <button type="button" class="btn-edit" @click="bukaModalEdit(item)">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Input Pemilih Baru (17 Tahun) -->
    <div v-if="showCreateModal" class="modal-backdrop">
      <div class="modal-card">
        <h3>Input Pemilih Baru (17 Tahun)</h3>
        <form @submit.prevent="simpanPemilihBaru" class="modal-form">
          <label>Nama Lengkap</label>
          <input v-model="formBaru.Nama" type="text" required class="input" />

          <div class="grid-2">
            <div>
              <label>Jenis Kelamin</label>
              <select v-model="formBaru.Jenis_Kelamin" class="input">
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label>Keterangan</label>
              <input v-model="formBaru.Keterangan" type="text" class="input" />
            </div>
          </div>

          <div class="grid-2">
            <div>
              <label>Kecamatan</label>
              <select
                v-model="formBaru.Kecamatan"
                @change="formBaru.Desa = ''"
                required
                class="input"
              >
                <option value="">-- Pilih Kecamatan --</option>
                <option v-for="kec in daftarKecamatan" :key="kec" :value="kec">{{ kec }}</option>
              </select>
            </div>
            <div>
              <label>Desa / Kelurahan</label>
              <select v-model="formBaru.Desa" :disabled="!formBaru.Kecamatan" required class="input">
                <option value="">-- Pilih Desa --</option>
                <option v-for="desa in daftarDesaModal" :key="desa" :value="desa">{{ desa }}</option>
              </select>
            </div>
          </div>

          <div class="grid-3">
            <div>
              <label>Dusun</label>
              <input v-model="formBaru.Dusun" type="text" class="input" />
            </div>
            <div>
              <label>RT</label>
              <input v-model="formBaru.Rt" type="text" placeholder="001" class="input" />
            </div>
            <div>
              <label>RW</label>
              <input v-model="formBaru.Rw" type="text" placeholder="002" class="input" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="showCreateModal = false">Batal</button>
            <button type="submit" class="btn-primary" :disabled="savingCreate">
              {{ savingCreate ? 'Menyimpan...' : 'Simpan Data' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Ubah Data Pemilih -->
    <div v-if="editingRow" class="modal-backdrop">
      <div class="modal-card">
        <h3>Ubah Data Pemilih</h3>
        <form @submit.prevent="simpanPerubahan" class="modal-form">
          <label>Nama Lengkap</label>
          <input v-model="formEdit.Nama" type="text" required class="input" />

          <div class="grid-2">
            <div>
              <label>Jenis Kelamin</label>
              <select v-model="formEdit.Jenis_Kelamin" class="input">
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label>Keterangan</label>
              <input
                v-model="formEdit.Keterangan"
                type="text"
                placeholder="Kosongkan = Berhak Memilih, atau isi Meninggal / Pindah Memilih"
                class="input"
              />
            </div>
          </div>

          <div class="grid-3">
            <div>
              <label>Dusun</label>
              <input v-model="formEdit.Dusun" type="text" class="input" />
            </div>
            <div>
              <label>RT</label>
              <input v-model="formEdit.Rt" type="text" class="input" />
            </div>
            <div>
              <label>RW</label>
              <input v-model="formEdit.Rw" type="text" class="input" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="editingRow = null">Batal</button>
            <button type="submit" class="btn-primary" :disabled="savingEdit">
              {{ savingEdit ? 'Mengupdate...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
.subtitle { color: #64748b; font-size: 0.9rem; margin-top: 4px; }
.filter-box { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 16px; }
.input { padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; width: 100%; }
.btn-primary { background: #1d4ed8; color: #fff; border: none; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-secondary { background: #0f172a; color: #fff; border: none; padding: 9px 16px; border-radius: 8px; cursor: pointer; }
.btn-edit { background: #e2e8f0; color: #0f172a; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
.btn-ghost { background: transparent; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
.alert-error { background: #fef2f2; color: #b91c1c; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; }
.alert-success { background: #f0fdf4; color: #15803d; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal-card { background: #fff; border-radius: 12px; padding: 20px; width: 100%; max-width: 540px; }
.modal-form { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
@media (max-width: 768px) {
  .filter-box, .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .top-bar { flex-direction: column; align-items: flex-start; }
}
</style>