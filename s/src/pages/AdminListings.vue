<!-- Admin page to manage all listings -->
<script setup>
import { ref, onMounted } from 'vue'

const listings = ref([])
const message = ref('')
const loading = ref(false)
const deleting = ref(new Set())

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadListings = async () => {
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/listings`, { credentials: 'include' })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon listings niet laden (${res.status})`
      return
    }
    listings.value = Array.isArray(data) ? data : []
  } catch (e) {
    message.value = 'Kon listings niet laden.'
  } finally {
    loading.value = false
  }
}

const removeListing = async (id) => {
  if (!id || deleting.value.has(id)) return
  if (!confirm('Weet je zeker dat je deze listing wilt verwijderen?')) return
  deleting.value = new Set(deleting.value.add(id))
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      message.value = data.error || `Verwijderen mislukt (${res.status})`
      return
    }
    listings.value = listings.value.filter((l) => l.id !== id)
  } catch (e) {
    message.value = 'Verwijderen mislukt.'
  } finally {
    const copy = new Set(deleting.value)
    copy.delete(id)
    deleting.value = copy
  }
}

onMounted(loadListings)
</script>

<template>
  <main class="admin-listings">
    <h1>Listingsbeheer</h1>

    <div class="toolbar">
      <button class="refresh" :disabled="loading" @click="loadListings">
        {{ loading ? 'Laden...' : 'Ververs' }}
      </button>
    </div>

    <p v-if="message" class="status">{{ message }}</p>
    <p v-if="loading && !listings.length">Laden...</p>

    <table v-if="listings.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Titel</th>
          <th>Type</th>
          <th>Categorie</th>
          <th>Owner</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in listings" :key="l.id">
          <td>#{{ l.id }}</td>
          <td>{{ l.title }}</td>
          <td>{{ l.type }}</td>
          <td>{{ l.category?.name || '-' }}</td>
          <td>{{ l.owner?.username || '-' }}</td>
          <td class="actions">
            <button
              class="delete"
              :disabled="deleting.has(l.id)"
              @click="removeListing(l.id)"
            >
              {{ deleting.has(l.id) ? '...' : 'Verwijder' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">Geen listings gevonden.</p>
  </main>
</template>

<style scoped>
.admin-listings {
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
