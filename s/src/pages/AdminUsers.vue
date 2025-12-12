<!-- Admin user management list -->
<script setup>
import { ref, computed, onMounted } from 'vue'

const users = ref([])
const message = ref('')
const loading = ref(false)
const searching = ref(false)
const search = ref('')
const deleting = ref(new Set())

const API_BASE = import.meta.env.VITE_API_BASE || ''

const filtered = computed(() => {
  if (!search.value.trim()) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
  )
})

const loadUsers = async () => {
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/users`, { credentials: 'include' })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon gebruikers niet laden (${res.status})`
      return
    }
    users.value = Array.isArray(data) ? data : []
  } catch (e) {
    message.value = 'Laden mislukt.'
  } finally {
    loading.value = false
  }
}

const removeUser = async (id) => {
  if (!id || deleting.value.has(id)) return
  if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return
  deleting.value = new Set(deleting.value.add(id))
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      message.value = data.error || `Verwijderen mislukt (${res.status})`
      return
    }
    users.value = users.value.filter((u) => u.id !== id)
  } catch (e) {
    message.value = 'Verwijderen mislukt.'
  } finally {
    const copy = new Set(deleting.value)
    copy.delete(id)
    deleting.value = copy
  }
}

onMounted(loadUsers)
</script>

<template>
  <main class="admin-users">
    <h1>Gebruikersbeheer</h1>

    <div class="toolbar">
      <input
        v-model="search"
        class="search"
        type="search"
        placeholder="Zoek op username of email"
        @input="searching = true; setTimeout(() => (searching = false), 150)"
      />
      <button class="refresh" :disabled="loading" @click="loadUsers">
        {{ loading ? 'Laden...' : 'Ververs' }}
      </button>
    </div>

    <p v-if="message" class="status">{{ message }}</p>
    <p v-if="loading && !users.length">Laden...</p>

    <table v-if="filtered.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in filtered" :key="u.id">
          <td>#{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.email || '—' }}</td>
          <td>{{ u.role }}</td>
          <td class="actions">
            <button
              class="delete"
              :disabled="deleting.has(u.id)"
              @click="removeUser(u.id)"
            >
              {{ deleting.has(u.id) ? '...' : 'Verwijder' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">Geen gebruikers gevonden.</p>
  </main>
</template>

<style scoped>
.admin-users {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search {
  flex: 1;
  min-width: 220px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 14px;
}

.refresh {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #0f172a;
  color: #e2e8f0;
  cursor: pointer;
  font-weight: 700;
}

.status {
  font-weight: 600;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

th {
  background: #f8fafc;
  font-weight: 700;
}

.actions {
  text-align: right;
}

.delete {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ef4444;
  background: #fff1f2;
  color: #b91c1c;
  cursor: pointer;
  font-weight: 700;
}

.delete[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
