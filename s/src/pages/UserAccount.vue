<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref(null)
const message = ref('')
const pwdMessage = ref('')
const changing = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '' })

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadMe = () => {
  message.value = ''
  fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        message.value = data.error
      } else {
        user.value = data
      }
    })
    .catch(() => {
      message.value = 'Kon accountgegevens niet laden.'
    })
}

const logout = () => {
  fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
    .then(() => {
      router.push('/login')
    })
    .catch(() => {
      message.value = 'Kon niet uitloggen.'
    })
}

const deleteAccount = () => {
  if (!user.value) return
  if (!confirm('Wil je je account echt verwijderen?')) return

  fetch(`${API_BASE}/users/${user.value.id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
    .then(() => {
      router.push('/register')
    })
    .catch(() => {
      message.value = 'Kon account niet verwijderen.'
    })
}

const changePassword = async () => {
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    pwdMessage.value = 'Vul oud en nieuw wachtwoord in.'
    return
  }
  changing.value = true
  pwdMessage.value = ''
  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        oldPassword: pwdForm.value.oldPassword,
        newPassword: pwdForm.value.newPassword,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      pwdMessage.value = data.error || `Wijzigen mislukt (${res.status})`
      return
    }
    pwdMessage.value = 'Wachtwoord gewijzigd.'
    pwdForm.value = { oldPassword: '', newPassword: '' }
  } catch (e) {
    pwdMessage.value = 'Wijzigen mislukt.'
  } finally {
    changing.value = false
  }
}

onMounted(loadMe)
</script>

<template>
  <div class="account">
    <h1>Mijn account</h1>

    <p v-if="message" class="status">{{ message }}</p>

    <template v-if="user">
      <div class="card">
        <p><strong>Gebruikersnaam:</strong> {{ user.username }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Rol:</strong> {{ user.role }}</p>

        <div class="actions">
          <button class="primary" @click="logout">Uitloggen</button>
          <button class="danger" @click="deleteAccount">Account verwijderen</button>
        </div>
      </div>

      <div class="card">
        <h2>Wachtwoord wijzigen</h2>
        <p v-if="pwdMessage" class="status">{{ pwdMessage }}</p>
        <div class="form-grid">
          <label>
            Oud wachtwoord
            <input v-model="pwdForm.oldPassword" type="password" placeholder="Huidig wachtwoord" />
          </label>
          <label>
            Nieuw wachtwoord
            <input v-model="pwdForm.newPassword" type="password" placeholder="Nieuw wachtwoord" />
          </label>
        </div>
        <button class="primary" :disabled="changing" @click="changePassword">
          {{ changing ? 'Bezig...' : 'Opslaan' }}
        </button>
      </div>
    </template>

    <p v-else-if="!message">Geen account info beschikbaar.</p>
  </div>
</template>

<style scoped>
.account {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.primary {
  padding: 10px 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.danger {
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff1f2;
  color: #b91c1c;
  border: 1px solid #ef4444;
  cursor: pointer;
  font-weight: 700;
}

.status {
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 12px 0;
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
</style>
