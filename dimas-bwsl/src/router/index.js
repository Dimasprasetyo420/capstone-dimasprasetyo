import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ValidasiView from '../views/ValidasiView.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: LoginView, meta: { guestOnly: true } },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/validasi', name: 'Validasi', component: ValidasiView, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard: Cegah akses halaman internal jika belum login
router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (to.meta.requiresAuth && !session) {
    return '/login'
  }
  if (to.meta.guestOnly && session) {
    return '/dashboard'
  }
})

export default router