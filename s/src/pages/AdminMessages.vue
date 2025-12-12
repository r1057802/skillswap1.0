<!-- Admin tool to send notifications to users -->
<script setup>
import { ref } from 'vue'

const users = ref([])
const username = ref('')
const type = ref('info')
const payload = ref('')
const message = ref('')
const loadingUsers = ref(false)
const sending = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadUsers = async () => {
  loadingUsers.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/users`, { credentials: 'include' })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon users niet laden (${res.status})`
      return
    }
    if (Array.isArray(data)) {
      users.value = data
    } else {
      message.value = 'Onverwacht antwoord'
    }
  } catch (e) {
    message.value = 'Laden mislukt.'
  } finally {
    loadingUsers.value = false
  }
}

const sendNotification = async () => {
  message.value = ''
  if (!username.value || !type.value) {
    message.value = 'username en type zijn verplicht.'
    return
  }
  sending.value = true
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: username.value,
        type: type.value,
        payload: payload.value || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Fout (${res.status})`
      return
    }
    message.value = `Notificatie verstuurd naar ${data.userId ? `user #${data.userId}` : 'gebruiker'}`
    payload.value = ''
  } catch (e) {
    message.value = 'Versturen mislukt.'
  } finally {
    sending.value = false
  }
}

loadUsers()
</script>

<template>
  <main class="admin-messages">
    <h1>Stuur notificatie naar gebruiker</h1>

    <div class="form">
      <label class="full">
        Kies gebruiker
        <div class="user-list">
          <button
            v-for="u in users"
            :key="u.id"
            type="button"
            :class="['pill', username === u.username ? 'active' : '']"
            @click="username = u.username"
          >
            {{ u.username }} <span class="muted">#{{ u.id }}</span>
          </button>
          <span v-if="!users.length && !loadingUsers" class="muted">Geen gebruikers gevonden</span>
          <span v-if="loadingUsers" class="muted">Laden...</span>
        </div>
      </label>

      <label>
        Of handmatig username
        <input v-model="username" type="text" placeholder="bv. janedoe" />
      </label>

      <label>
        Type
        <input v-model="type" type="text" placeholder="bijv. info / alert" />
      </label>

      <label class="full">
        Bericht (payload)
        <textarea v-model="payload" rows="3" placeholder="Tekst voor de notificatie"></textarea>
      </label>

      <button :disabled="sending" @click="sendNotification">
        {{ sending ? 'Bezig...' : 'Verstuur notificatie' }}
      </button>
    </div>

    <p v-if="message" class="status">{{ message }}</p>
  </main>
</template>

<style scoped>
.admin-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #0f172a;
}

input,
textarea {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 14px;
}

.full {
  grid-column: 1 / -1;
}

button {
  grid-column: 1 / -1;
  justify-self: start;
  padding: 10px 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

button[disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}

.status {
  font-weight: 600;
}

.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.pill.active {
  background: #0f172a;
  color: #e2e8f0;
  border-color: #0f172a;
}

.muted {
  color: #64748b;
  font-weight: 500;
  margin-left: 4px;
}
</style>
