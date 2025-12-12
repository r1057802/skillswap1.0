<!-- Public page to request a password reset email -->
<script setup>
import { ref } from 'vue'

const email = ref('')
const message = ref('')
const busy = ref(false)
const API_BASE = import.meta.env.VITE_API_BASE || ''

const submit = async () => {
  if (!email.value.trim()) {
    message.value = 'Email is verplicht.'
    return
  }
  busy.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Verzoek mislukt (${res.status})`
      return
    }
    message.value = 'Als dit emailadres bestaat, is er een reset-link verstuurd.'
    email.value = ''
  } catch (e) {
    message.value = 'Verzoek mislukt.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="form-shell">
    <h1>Wachtwoord vergeten</h1>
    <p>Voer je email in. We sturen een link om je wachtwoord te resetten.</p>

    <p v-if="message" class="status">{{ message }}</p>

    <div class="form-grid">
      <label>
        Email
        <input v-model="email" type="email" placeholder="you@example.com" />
      </label>
    </div>

    <button class="primary" :disabled="busy" @click="submit">
      {{ busy ? 'Bezig...' : 'Stuur reset-link' }}
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
