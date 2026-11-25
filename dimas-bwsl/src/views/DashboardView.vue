<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { fetchApi } from '../lib/api'

const daftarWilayah = ref([])
const pilihKecamatan = ref('')
const pilihDesa = ref('')
const statistikRaw = ref([])
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  try {
    daftarWilayah.value = await fetchApi('/wilayah')
    await muatStatistik()
  } catch (err) {
    errorMsg.value = err.message
  }
})

async function muatStatistik() {
  loading.value = true
  errorMsg.value = ''
  try {
    statistikRaw.value = await fetchApi('/statistik', {
      kecamatan: pilihKecamatan.value,
      desa: pilihDesa.value
    })
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

const listKecamatan = computed(() => [...new Set(daftarWilayah.value.map(w => w.Kecamatan))])
const listDesa = computed(() => {
  if (!pilihKecamatan.value) return []
  return daftarWilayah.value.filter(w => w.Kecamatan === pilihKecamatan.value).map(w => w.Desa)
})

watch(pilihKecamatan, () => {
  pilihDesa.value = ''
  muatStatistik()
})
watch(pilihDesa, () => muatStatistik())

const statStatus = computed(() => statistikRaw.value.filter(i => i.kategori === 'status'))
const statGender = computed(() => statistikRaw.value.filter(i => i.kategori === 'gender'))
const totalPemilih = computed(() => statStatus.value.reduce((acc, i) => acc + Number(i.jumlah), 0))

function formatGender(label) {
  const l = label.toUpperCase()
  if (l === 'L' || l.includes('LAKI')) return 'Laki-laki'
  if (l === 'P' || l.includes('PEREMPUAN')) return 'Perempuan'
  return label
}
</script>

<template>
  <div class="card-panel">
    <div class="panel-header">
      <div>
        <h2>Dashboard Rekapitulasi Pemilih</h2>
        <p class="subtitle">Data Pleno PDPB TW III — KPU Kabupaten Pasuruan</p>
      </div>
    </div>

    <!-- Filter Wilayah -->
    <div class="filter-bar">
      <div class="filter-item">
        <label>Filter Kecamatan:</label>
        <select v-model="pilihKecamatan">
          <option value="">-- Seluruh Kabupaten Pasuruan --</option>
          <option v-for="kec in listKecamatan" :key="kec" :value="kec">{{ kec }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>Filter Desa / Kelurahan:</label>
        <select v-model="pilihDesa" :disabled="!pilihKecamatan">
          <option value="">{{ pilihKecamatan ? '-- Semua Desa di Kec. ' + pilihKecamatan + ' --' : '-- Pilih Kecamatan Dulu --' }}</option>
          <option v-for="desa in listDesa" :key="desa" :value="desa">{{ desa }}</option>
        </select>
      </div>
    </div>

    <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

    <!-- Grid Kartu Statistik -->
    <div class="kpi-grid">
      <!-- Kartu Total -->
      <div class="kpi-card primary">
        <span class="kpi-title">Total Pemilih Terdaftar</span>
        <div class="kpi-value">{{ loading ? '...' : totalPemilih.toLocaleString('id-ID') }}</div>
        <span class="kpi-sub">
          {{ pilihDesa ? `Desa ${pilihDesa}, Kec. ${pilihKecamatan}` : pilihKecamatan ? `Kecamatan ${pilihKecamatan}` : 'Kabupaten Pasuruan' }}
        </span>
      </div>

      <!-- Kartu Jenis Kelamin -->
      <div class="kpi-card">
        <span class="kpi-title">Rincian Jenis Kelamin</span>
        <div v-if="loading" class="kpi-loading">Memuat...</div>
        <div v-else class="list-metric">
          <div v-for="g in statGender" :key="g.label" class="metric-row">
            <span>{{ formatGender(g.label) }}</span>
            <strong>{{ Number(g.jumlah).toLocaleString('id-ID') }}</strong>
          </div>
        </div>
      </div>

      <!-- Kartu Status Data -->
      <div class="kpi-card">
        <span class="kpi-title">Rincian Keterangan Pemilih</span>
        <div v-if="loading" class="kpi-loading">Memuat...</div>
        <div v-else class="list-metric">
          <div v-for="st in statStatus" :key="st.label" class="metric-row">
            <span>{{ st.label }}</span>
            <strong>{{ Number(st.jumlah).toLocaleString('id-ID') }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-panel {
  background: #fff;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
h2 { margin: 0 0 4px; }
.subtitle { margin: 0 0 20px; color: #666; font-size: 0.92em; }
.filter-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}
@media (max-width: 600px) { .filter-bar { grid-template-columns: 1fr; } }
label { display: block; font-size: 0.85em; font-weight: 600; margin-bottom: 6px; color: #475569; }
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}
select:disabled { background: #f1f5f9; color: #94a3b8; }
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 768px) { .kpi-grid { grid-template-columns: 1fr; } }
.kpi-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  background: #ffffff;
}
.kpi-card.primary {
  background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
  color: #ffffff;
  border: none;
}
.kpi-title { display: block; font-size: 0.85em; font-weight: 600; opacity: 0.85; margin-bottom: 10px; }
.kpi-value { font-size: 2em; font-weight: 700; margin-bottom: 6px; }
.kpi-sub { font-size: 0.82em; opacity: 0.9; }
.list-metric { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.metric-row {
  display: flex;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 0.95em;
}
.metric-row:last-child { border-bottom: none; padding-bottom: 0; }
.alert-error { background: #fce8e6; color: #842029; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
</style>