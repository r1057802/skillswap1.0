<!-- Simple login page for SkillSwap -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { user } from '@/auth'

const email = ref('')
const password = ref('')
const message = ref('')
const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE || ''

const login = async () => {
  message.value = ''

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Login mislukt (${res.status})`
      return
    }

    user.value = data
    const target = data.role === 'admin' ? '/admin' : '/dashboard'
    message.value = `Ingelogd als ${data.username}`
    router.push(target)
  } catch (err) {
    message.value = 'Login failed'
  }
}
</script>

<template>
  <div>
    <h1>Login</h1>

    <div>
      <label>Email</label>
      <input v-model="email" type="email" />
    </div>

    <div>
      <label>Password</label>
      <input v-model="password" type="password" />
    </div>

    <button @click="login">Login</button>

    <p v-if="message">
      {{ message }}
    </p>
  </div>
</template>
