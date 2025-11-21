<script setup>
import { ref, computed, onMounted } from 'vue'
import { user } from '@/auth'

const bookings = ref([])
const message = ref('')
const loading = ref(false)
const updating = ref(new Set())

const API_BASE = import.meta.env.VITE_API_BASE || ''

const incoming = computed(() => {
  if (!user.value) return []
  return bookings.value.filter((b) => b.ownerId === user.value.id)
})

const outgoing = computed(() => {
  if (!user.value) return []
  return bookings.value.filter((b) => b.userId === user.value.id)
})

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

const updateStatus = async (booking, status) => {
  if (!booking || updating.value.has(booking.id)) return
  updating.value = new Set(updating.value.add(booking.id))
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Status wijzigen mislukt (${res.status})`
      return
    }
    bookings.value = bookings.value.map((b) => (b.id === booking.id ? { ...b, status } : b))
  } catch (e) {
    message.value = 'Status wijzigen mislukt.'
  } finally {
    const copy = new Set(updating.value)
    copy.delete(booking.id)
    updating.value = copy
  }
}

onMounted(loadBookings)
</script>

<template>
  <main class="user-shell">
    <h1>Gebruikersdashboard</h1>

    <div class="user-grid">
      <RouterLink class="user-card" to="/account">Account</RouterLink>
      <RouterLink class="user-card" to="/notifications">Notificaties</RouterLink>
      <RouterLink class="user-card" to="/my-listings">Mijn listings / toevoegen</RouterLink>
      <RouterLink class="user-card" to="/listings">Alle listings</RouterLink>
    </div>

    <section class="card">
      <h2>Boekingen op mijn listings</h2>
      <p v-if="loading">Laden...</p>
      <p v-else-if="message">{{ message }}</p>
      <template v-else>
        <table v-if="incoming.length" class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Listing</th>
              <th>Aanvrager</th>
              <th>Status</th>
              <th>Datum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in incoming" :key="b.id">
              <td>#{{ b.id }}</td>
              <td>{{ b.listing?.title || '-' }}</td>
              <td>{{ b.requester?.username || '-' }}</td>
              <td>{{ b.status }}</td>
              <td>{{ b.date ? new Date(b.date).toLocaleString() : '-' }}</td>
              <td class="actions">
                <button
                  v-if="b.status === 'pending'"
                  class="approve"
                  :disabled="updating.has(b.id)"
                  @click="updateStatus(b, 'accepted')"
                >
                  {{ updating.has(b.id) ? '...' : 'Accepteer' }}
                </button>
                <button
                  v-if="b.status === 'pending'"
                  class="reject"
                  :disabled="updating.has(b.id)"
                  @click="updateStatus(b, 'rejected')"
                >
                  {{ updating.has(b.id) ? '...' : 'Weiger' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>Geen boekingen op jouw listings.</p>
      </template>
    </section>

    <section class="card">
      <h2>Mijn boekingen</h2>
      <table v-if="outgoing.length" class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Listing</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Datum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in outgoing" :key="b.id">
            <td>#{{ b.id }}</td>
            <td>{{ b.listing?.title || '-' }}</td>
            <td>{{ b.owner?.username || '-' }}</td>
            <td>{{ b.status }}</td>
            <td>{{ b.date ? new Date(b.date).toLocaleString() : '-' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>Geen boekingen verstuurd.</p>
    </section>
  </main>
</template>

<style scoped>
.user-shell {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 800px;
}

.user-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 18px 12px;
  background: #fff;
  color: #0f172a;
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

th {
  background: #f8fafc;
}

.actions {
  display: flex;
  gap: 6px;
}

.approve,
.reject {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
  font-weight: 700;
}

.approve {
  border-color: #16a34a;
  color: #166534;
  background: #ecfdf3;
}

.reject {
  border-color: #ef4444;
  color: #b91c1c;
  background: #fff1f2;
}

.approve[disabled],
.reject[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
