<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const message = ref('')
const busy = ref(false)
const API_BASE = import.meta.env.VITE_API_BASE || ''

onMounted(() => {
  const t = route.query.token
  if (typeof t === 'string') token.value = t
})

const submit = async () => {
  if (!token.value || !password.value) {
    message.value = 'Token en nieuw wachtwoord zijn verplicht.'
    return
  }
  busy.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value, password: password.value }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Reset mislukt (${res.status})`
      return
    }
    message.value = 'Wachtwoord gereset. Je kunt nu inloggen.'
    password.value = ''
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    message.value = 'Reset mislukt.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="form-shell">
    <h1>Wachtwoord resetten</h1>
    <p>Plak je token (of volg de link uit de email) en kies een nieuw wachtwoord.</p>

    <p v-if="message" class="status">{{ message }}</p>

    <div class="form-grid">
      <label>
        Token
        <input v-model="token" type="text" placeholder="Reset token" />
      </label>
      <label>
        Nieuw wachtwoord
        <input v-model="password" type="password" placeholder="Nieuw wachtwoord" />
      </label>
    </div>

    <button class="primary" :disabled="busy" @click="submit">
      {{ busy ? 'Bezig...' : 'Reset wachtwoord' }}
    </button>
  </main>
</template>

<style scoped>
.form-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 520px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
}

input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.primary {
  padding: 10px 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  border: none;
  cursor: pointer;
  font-weight: 700;
  max-width: 220px;
}

.primary[disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}

.status {
  font-weight: 700;
}
</style>
