<!-- Admin view to review and delete bookings -->
<script setup>
import { ref, onMounted } from 'vue'

const bookings = ref([])
const message = ref('')
const loading = ref(false)
const deleting = ref(new Set())

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadBookings = async () => {
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/bookings`, { credentials: 'include' })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon bookings niet laden (${res.status})`
      return
    }
    bookings.value = Array.isArray(data) ? data : []
  } catch (e) {
    message.value = 'Laden mislukt.'
  } finally {
    loading.value = false
  }
}

const removeBooking = async (id) => {
  if (!id || deleting.value.has(id)) return
  if (!confirm('Weet je zeker dat je deze booking wilt verwijderen?')) return
  deleting.value = new Set(deleting.value.add(id))
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      message.value = data.error || `Verwijderen mislukt (${res.status})`
      return
    }
    bookings.value = bookings.value.filter((b) => b.id !== id)
  } catch (e) {
    message.value = 'Verwijderen mislukt.'
  } finally {
    const copy = new Set(deleting.value)
    copy.delete(id)
    deleting.value = copy
  }
}

onMounted(loadBookings)
</script>

<template>
  <main class="admin-bookings">
    <h1>Bookingsbeheer</h1>

    <div class="toolbar">
      <button class="refresh" :disabled="loading" @click="loadBookings">
        {{ loading ? 'Laden...' : 'Ververs' }}
      </button>
    </div>

    <p v-if="message" class="status">{{ message }}</p>
    <p v-if="loading && !bookings.length">Laden...</p>

    <table v-if="bookings.length" class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Listing</th>
          <th>Requester</th>
          <th>Owner</th>
          <th>Status</th>
          <th>Datum</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in bookings" :key="b.id">
          <td>#{{ b.id }}</td>
          <td>{{ b.listing?.title || '-' }}</td>
          <td>{{ b.requester?.username || '-' }}</td>
          <td>{{ b.owner?.username || '-' }}</td>
          <td>{{ b.status }}</td>
          <td>{{ b.date ? new Date(b.date).toLocaleString() : '-' }}</td>
          <td class="actions">
            <button
              class="delete"
              :disabled="deleting.has(b.id)"
              @click="removeBooking(b.id)"
            >
              {{ deleting.has(b.id) ? '...' : 'Verwijder' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">Geen bookings gevonden.</p>
  </main>
</template>

<style scoped>
.admin-bookings {
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
