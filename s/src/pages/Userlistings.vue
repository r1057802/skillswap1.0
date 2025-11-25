<!-- Simple listings page for SkillSwap -->
<script setup>
import { ref, onMounted } from 'vue'

const listings = ref([])
const message = ref('')
const submitting = ref(false)
const categories = ref([])
const fileInput = ref(null)
const slotDate = ref('')
const slotTime = ref('')
const availabilitySlots = ref([])

// Minimal form fields matching backend requirements
const form = ref({
  title: '',
  categoryId: '',
  type: '',
  description: '',
  country: '',
  city: '',
  address: '',
})

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`)
    const data = await res.json()
    if (Array.isArray(data)) {
      categories.value = data
    }
  } catch (e) {
    // ignore
  }
}

const addSlot = () => {
  message.value = ''
  if (!slotDate.value || !slotTime.value) {
    message.value = 'Kies datum en tijdslot.'
    return
  }
  const dt = new Date(`${slotDate.value}T${slotTime.value}`)
  if (Number.isNaN(dt.getTime())) {
    message.value = 'Ongeldig tijdslot.'
    return
  }
  const iso = dt.toISOString()
  if (!availabilitySlots.value.includes(iso)) {
    availabilitySlots.value = [...availabilitySlots.value, iso].sort()
  }
  slotDate.value = ''
  slotTime.value = ''
}

const removeSlot = (iso) => {
  availabilitySlots.value = availabilitySlots.value.filter((s) => s !== iso)
}

const loadListings = () => {
  message.value = ''

  fetch(`${API_BASE}/listings`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        listings.value = data
      } else if (data.error) {
        message.value = data.error
      }
    })
    .catch(() => {
      message.value = 'Failed to load listings'
    })
}

const createListing = async () => {
  message.value = ''
  if (!form.value.title || !form.value.categoryId || !form.value.type || !form.value.address) {
    message.value = 'Titel, categoryId, type en adres zijn verplicht.'
    return
  }
  submitting.value = true
  try {
    let finalImageUrl = ''
    const file = fileInput.value?.files?.[0]
    if (file) {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || uploadData.error || !uploadData.url) {
        message.value = uploadData.error || 'Upload mislukt'
        submitting.value = false
        return
      }
      finalImageUrl = uploadData.url
    }

    const res = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: form.value.title,
        categoryId: Number(form.value.categoryId),
        type: form.value.type,
        description: form.value.description || undefined,
        availability: availabilitySlots.value.length ? availabilitySlots.value : undefined,
        imageUrl: finalImageUrl || undefined,
        country: form.value.country || undefined,
        city: form.value.city || undefined,
        address: form.value.address || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Serverfout (${res.status})`
      return
    }
    message.value = 'Listing aangemaakt.'
    form.value = {
      title: '',
      categoryId: '',
      type: '',
      description: '',
      country: '',
      city: '',
      address: '',
    }
    availabilitySlots.value = []
    if (fileInput.value) fileInput.value.value = ''
    loadListings()
  } catch (e) {
    message.value = 'Aanmaken mislukt.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadListings()
})
</script>

<template>
  <div class="page">
    <h1>Mijn listings</h1>

    <section class="card">
      <h2>Nieuwe listing</h2>
      <div class="form-grid">
        <label>
          Titel
          <input v-model="form.title" type="text" placeholder="Bijv. Gitaarles voor beginners" />
        </label>
        <label>
          Categorie
          <select v-model="form.categoryId">
            <option value="" disabled>Selecteer categorie</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.id }})
            </option>
          </select>
        </label>
        <label>
          Type
          <input v-model="form.type" type="text" placeholder="service / product" />
        </label>
        <label class="full">
          Beschrijving
          <textarea v-model="form.description" rows="3" placeholder="Optioneel"></textarea>
        </label>
        <div class="full slot-builder">
          <div class="slot-inputs">
            <label>
              Datum
              <input v-model="slotDate" type="date" />
            </label>
            <label>
              Tijd
              <input v-model="slotTime" type="time" step="1800" />
            </label>
            <button type="button" class="secondary" @click="addSlot">Slot toevoegen</button>
          </div>
          <div v-if="availabilitySlots.length" class="slots-list">
            <span v-for="slot in availabilitySlots" :key="slot" class="pill">
              {{ new Date(slot).toLocaleString() }}
              <button type="button" class="pill-remove" @click="removeSlot(slot)">x</button>
            </span>
          </div>
        </div>
      </div>
      <div class="form-grid">
        <label>
          Upload bestand
          <input ref="fileInput" type="file" accept="image/*" />
        </label>
      </div>
      <div class="form-grid location-grid">
        <label>
          Land
          <input v-model="form.country" type="text" placeholder="bijv. Belgie" />
        </label>
        <label>
          Stad
          <input v-model="form.city" type="text" placeholder="bijv. Antwerpen" />
        </label>
        <label>
          Adres
          <input v-model="form.address" type="text" placeholder="Straat 1, postcode" />
        </label>
      </div>
      <button :disabled="submitting" class="primary" @click="createListing">
        {{ submitting ? 'Bezig...' : 'Listing aanmaken' }}
      </button>
    </section>

    <section class="card">
      <h2>Alle listings</h2>
      <p v-if="message">{{ message }}</p>

      <ul v-if="listings.length > 0" class="list">
        <li v-for="listing in listings" :key="listing.id">
          <strong>{{ listing.title }}</strong>
          <span v-if="listing.category"> - {{ listing.category.name }}</span>
          <span v-if="listing.owner"> (by {{ listing.owner.username }})</span>
        </li>
      </ul>

      <p v-else>No listings yet.</p>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.location-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #0f172a;
}

input,
textarea,
select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 14px;
}

.full {
  grid-column: 1 / -1;
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

.primary[disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}

.secondary {
  margin-top: 22px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #0f172a;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  font-weight: 700;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-builder {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slot-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  align-items: end;
}

.slots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
}

.pill-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 800;
  color: #0f172a;
}
</style>
