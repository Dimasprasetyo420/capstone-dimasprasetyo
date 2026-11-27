<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './supabase'

const router = useRouter()
const session = ref(null)

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  session.value = data.session

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    if (!newSession) router.push('/login')
  })
})

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <!-- Navbar tampil hanya jika sudah login -->
    <header v-if="session" class="navbar">
      <div class="nav-container">
        <div class="brand">
          <strong>SIPANDA</strong>
          <span>Sistem Informasi Pemantauan Data Pemilih</span>
        </div>

        <nav class="nav-links">
          <router-link to="/dashboard" active-class="active">Dashboard Statistik</router-link>
          <router-link to="/validasi" active-class="active">Cek & Validasi Nama</router-link>
        </nav>

        <div class="user-actions">
          <span class="user-email">{{ session.user.email }}</span>
          <button class="btn-logout" @click="handleLogout">Keluar</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #f4f7f6;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}
.navbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e6ed;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.brand { display: flex; flex-direction: column; }
.brand strong { color: #0056b3; font-size: 1.1em; }
.brand span { font-size: 0.78em; color: #666; }
.nav-links { display: flex; gap: 8px; }
.nav-links a {
  text-decoration: none;
  color: #555;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.92em;
  transition: all 0.2s;
}
.nav-links a:hover { background-color: #f0f4f8; color: #0056b3; }
.nav-links a.active { background-color: #0056b3; color: #ffffff; }
.user-actions { display: flex; align-items: center; gap: 10px; }
.user-email { font-size: 0.85em; color: #555; }
.btn-logout {
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
}
.btn-logout:hover { background-color: #b02a37; }
.main-content {
  max-width: 1000px;
  margin: 28px auto;
  padding: 0 20px;
}
</style>