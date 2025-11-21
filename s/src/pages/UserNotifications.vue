<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])
const loading = ref(false)
const message = ref('')
const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadNotifications = async () => {
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/notifications`, { credentials: 'include' })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon notificaties niet laden (${res.status})`
      return
    }
    if (Array.isArray(data)) {
      items.value = data
    } else {
      message.value = 'Onverwacht antwoord'
    }
  } catch (e) {
    message.value = 'Laden mislukt.'
  } finally {
    loading.value = false
  }
}

onMounted(loadNotifications)
</script>

<template>
  <main class="notifications">
    <h1>Mijn notificaties</h1>

    <p v-if="loading">Laden...</p>
    <p v-else-if="message">{{ message }}</p>

    <ul v-else-if="items.length" class="list">
      <li v-for="n in items" :key="n.id" :class="{ unread: !n.isRead }">
        <div class="top">
          <span class="type">{{ n.type }}</span>
          <span class="time">#{{ n.id }}</span>
        </div>
        <p class="payload">{{ n.payload || 'Geen bericht' }}</p>
      </li>
    </ul>

    <p v-else>Geen notificaties.</p>
  </main>
</template>

<style scoped>
.notifications {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

li {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

li.unread {
  border-color: #0f172a;
}

.top {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  color: #0f172a;
}

.type {
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.time {
  color: #64748b;
  font-size: 12px;
}

.payload {
  margin: 8px 0 0;
  color: #0f172a;
}
</style>
