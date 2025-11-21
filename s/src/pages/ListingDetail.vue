<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const listing = ref(null)
const loading = ref(false)
const message = ref('')

const bookingMessage = ref('')
const bookingDate = ref('')
const bookingTime = ref('')
const bookingNote = ref('')
const availableSlots = ref([])

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadListing = async () => {
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/listings/${route.params.id}`)
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon listing niet laden (${res.status})`
      return
    }
    listing.value = data

    // Parse availability: allow JSON array or comma-separated strings
    if (data.availability) {
      let slots = []
      try {
        const parsed = JSON.parse(data.availability)
        if (Array.isArray(parsed)) slots = parsed
      } catch {
        slots = String(data.availability)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
      availableSlots.value = slots
    }
  } catch (e) {
    message.value = 'Laden mislukt.'
  } finally {
    loading.value = false
  }
}

const book = async () => {
  bookingMessage.value = ''
  let scheduledAtIso = ''

  if (availableSlots.value.length) {
    if (!bookingDate.value) {
      bookingMessage.value = 'Kies een beschikbaar slot.'
      return
    }
    const parsed = new Date(bookingDate.value)
    if (Number.isNaN(parsed.getTime())) {
      bookingMessage.value = 'Ongeldig slot.'
      return
    }
    scheduledAtIso = parsed.toISOString()
  } else {
    if (!bookingDate.value || !bookingTime.value) {
      bookingMessage.value = 'Kies datum en tijd.'
      return
    }
    const combined = new Date(`${bookingDate.value}T${bookingTime.value}`)
    if (Number.isNaN(combined.getTime())) {
      bookingMessage.value = 'Ongeldige datum/tijd.'
      return
    }
    scheduledAtIso = combined.toISOString()
  }

  try {
    const res = await fetch(`${API_BASE}/listings/${route.params.id}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        scheduledAt: scheduledAtIso,
        message: bookingNote.value || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      bookingMessage.value = data.error || `Boeken mislukt (${res.status})`
      return
    }
    bookingMessage.value = 'Boeking aangemaakt (pending).'
    bookingNote.value = ''
    bookingDate.value = ''
    bookingTime.value = ''
  } catch (e) {
    bookingMessage.value = 'Boeken mislukt.'
  }
}

onMounted(loadListing)
</script>

<template>
  <main class="detail">
    <p v-if="loading">Laden...</p>
    <p v-else-if="message">{{ message }}</p>

    <article v-else-if="listing" class="card">
      <header>
        <div>
          <p class="eyebrow">{{ listing.type }}</p>
          <h1>{{ listing.title }}</h1>
          <p class="meta">
            <span v-if="listing.category">{{ listing.category.name }}</span>
            <span v-if="listing.owner">- door {{ listing.owner.username }}</span>
            <span v-if="listing.city || listing.country">- {{ listing.city }}<span v-if="listing.city && listing.country">, </span>{{ listing.country }}</span>
          </p>
        </div>
        <img v-if="listing.imageUrl" :src="listing.imageUrl" alt="" class="hero" />
      </header>

      <p class="desc">{{ listing.description || 'Geen beschrijving' }}</p>

      <section class="book">
        <h2>Boek deze listing</h2>
        <template v-if="availableSlots.length">
          <label>
            Kies slot
            <select v-model="bookingDate">
              <option value="" disabled>Selecteer een slot</option>
              <option v-for="slot in availableSlots" :key="slot" :value="slot">
                {{ new Date(slot).toLocaleString() }}
              </option>
            </select>
          </label>
        </template>
        <template v-else>
          <label>
            Datum
            <input v-model="bookingDate" type="date" />
          </label>
          <label>
            Tijd
            <input v-model="bookingTime" type="time" step="1800" />
          </label>
        </template>
        <label>
          Bericht (optioneel)
          <textarea v-model="bookingNote" rows="3" placeholder="Jouw bericht"></textarea>
        </label>
        <button @click="book">Boek</button>
        <p v-if="bookingMessage" class="status">{{ bookingMessage }}</p>
      </section>
    </article>
  </main>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 700;
  color: #475569;
}

h1 {
  margin: 4px 0;
}

.meta {
  color: #64748b;
  font-size: 13px;
}

.hero {
  max-width: 320px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  object-fit: cover;
}

.desc {
  color: #0f172a;
  line-height: 1.5;
}

.book {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
}

input,
textarea,
select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

button {
  align-self: flex-start;
  padding: 10px 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.status {
  font-weight: 600;
}
</style>
