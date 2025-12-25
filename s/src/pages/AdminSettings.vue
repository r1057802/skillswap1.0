<!-- Admin page for creating admins and categories -->
<script setup>
import { ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const adminForm = ref({ username: '', email: '', password: '' })
const adminMessage = ref('')
const adminBusy = ref(false)

const categoryForm = ref({ name: '' })
const categoryMessage = ref('')
const categoryBusy = ref(false)

const slugify = (text) =>
  String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const createAdmin = async () => {
  if (adminBusy.value) return
  adminMessage.value = ''
  const { username, email, password } = adminForm.value
  if (!username || !email || !password) {
    adminMessage.value = 'Alle velden zijn verplicht.'
    return
  }

  adminBusy.value = true
  try {
    const res = await fetch(`${API_BASE}/users/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.error) {
      adminMessage.value = data.error || `Mislukt (${res.status})`
      return
    }
    adminMessage.value = `Admin aangemaakt: ${data.username || data.email || 'ok'}`
    adminForm.value = { username: '', email: '', password: '' }
  } catch (e) {
    adminMessage.value = 'Kon geen admin aanmaken.'
  } finally {
    adminBusy.value = false
  }
}

const createCategory = async () => {
  if (categoryBusy.value) return
  categoryMessage.value = ''
  const { name } = categoryForm.value
  if (!name) {
    categoryMessage.value = 'Naam is verplicht.'
    return
  }

  const slug = slugify(name)
  categoryBusy.value = true
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, slug }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.error) {
      categoryMessage.value = data.error || `Mislukt (${res.status})`
      return
    }
    categoryMessage.value = `Categorie aangemaakt: ${data.name}`
    categoryForm.value = { name: '' }
  } catch (e) {
    categoryMessage.value = 'Kon geen categorie aanmaken.'
  } finally {
    categoryBusy.value = false
  }
}
</script>

<template>
  <main class="settings">
    <h1>Extra settings</h1>

    <section class="card">
      <div class="card-head">
      <div>
        <h2>Nieuwe admin</h2>
      </div>
        <button class="primary" :disabled="adminBusy" @click="createAdmin">
          {{ adminBusy ? 'Bezig...' : 'Aanmaken' }}
        </button>
      </div>

      <div class="form-grid">
        <label>
          Username
          <input v-model="adminForm.username" type="text" placeholder="admin2" />
        </label>
        <label>
          Email
          <input v-model="adminForm.email" type="email" placeholder="admin@example.com" />
        </label>
        <label>
          Wachtwoord
          <input v-model="adminForm.password" type="password" placeholder="••••••••" />
        </label>
      </div>
      <p v-if="adminMessage" class="status">{{ adminMessage }}</p>
    </section>

    <section class="card">
      <div class="card-head">
      <div>
        <h2>Nieuwe categorie</h2>
      </div>
        <button class="primary" :disabled="categoryBusy" @click="createCategory">
          {{ categoryBusy ? 'Bezig...' : 'Aanmaken' }}
        </button>
      </div>

      <div class="form-grid single">
        <label>
          Naam
          <input v-model="categoryForm.name" type="text" placeholder="Bijv. Design" />
        </label>
      </div>
      <p v-if="categoryMessage" class="status">{{ categoryMessage }}</p>
    </section>
  </main>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card h2 {
  margin: 0;
}

.card p {
  margin: 4px 0 0;
  color: #475569;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.form-grid.single {
  grid-template-columns: 1fr;
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
  border: 1px solid #0f172a;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.primary[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  font-weight: 600;
  color: #0f172a;
}
</style>
