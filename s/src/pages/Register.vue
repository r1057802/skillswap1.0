<!-- Simple register page for SkillSwap -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { user } from '@/auth'

const username = ref('')
const email = ref('')
const password = ref('')
const message = ref('')
const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE || ''

const register = async () => {
  message.value = ''

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Registratie mislukt (${res.status})`
      return
    }

    user.value = data
    message.value = 'Geregistreerd als ' + data.username
    router.push('/dashboard')
  } catch (err) {
    message.value = 'Registration failed'
  }
}
</script>

<template>
  <div>
    <h1>Register</h1>

    <div>
      <label>Username</label>
      <input v-model="username" type="text" />
    </div>

    <div>
      <label>Email</label>
      <input v-model="email" type="email" />
    </div>

    <div>
      <label>Password</label>
      <input v-model="password" type="password" />
    </div>

    <button @click="register">Register</button>

    <p v-if="message">
      {{ message }}
    </p>
  </div>
</template>
