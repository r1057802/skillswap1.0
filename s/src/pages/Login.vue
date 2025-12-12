<!-- Login page for users and admins -->
<template>
  <div class="login-page">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin" novalidate>
      <label>Email
        <input v-model="email" type="text" required />
      </label>
      <label>Password
        <input v-model="password" type="password" required />
      </label>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Login' }}
      </button>
      <RouterLink class="forgot" to="/forgot-password">Forgot password?</RouterLink>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { user } from '@/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE || ''

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      error.value = data.error || `Login failed (${res.status})`
      return
    }

    user.value = data
    const target = data.role === 'admin' ? '/admin' : '/dashboard'
    router.push(target)
  } catch (e) {
    error.value = 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  max-width: 420px;
  margin: 72px auto;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}
form {
  display: grid;
  gap: 16px;
}
label {
  display: grid;
  gap: 6px;
  font-weight: 600;
}
input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}
button {
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-weight: 700;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.forgot {
  font-size: 14px;
  color: #2563eb;
  font-weight: 600;
  justify-self: start;
}
.error {
  color: #b91c1c;
  font-weight: 600;
}
</style>
