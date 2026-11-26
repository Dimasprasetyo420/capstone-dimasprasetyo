<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const emailInput = ref('')
const passwordInput = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true

  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value
  })

  if (error) {
    errorMsg.value = 'Login gagal: Email atau password salah.'
  } else {
    router.push('/dashboard')
  }
  loading.value = false
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>Login Petugas</h2>
      <p class="subtitle">Masuk untuk mengakses Dashboard & Validasi Data Pemilih 2026</p>

      <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email Petugas</label>
          <input v-model="emailInput" type="email" placeholder="user@domain.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="passwordInput" type="password" placeholder="••••••••" required />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Memverifikasi...' : 'Masuk ke Sistem' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.login-card {
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}
h2 { margin: 0 0 8px; text-align: center; }
.subtitle { text-align: center; color: #666; font-size: 0.9em; margin-bottom: 22px; }
.form-group { margin-bottom: 16px; }
label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9em; }
input {
  width: 100%;
  padding: 11px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 15px;
}
button {
  width: 100%;
  padding: 12px;
  background: #0056b3;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
button:disabled { background: #8ab4f8; }
.alert-error {
  background: #fce8e6;
  color: #842029;
  border: 1px solid #f5c2c7;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 0.9em;
}
</style>