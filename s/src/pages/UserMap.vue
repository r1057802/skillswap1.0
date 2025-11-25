<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const listings = ref([])
const loading = ref(false)
const message = ref('')
const mapRefreshing = ref(false)
const mapUrl = ref(`${API_BASE}/map?ts=${Date.now()}`)

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
    message.value = 'Laden mislukt.'
  } finally {
    loading.value = false
  }
}

const refreshMap = async () => {
  mapRefreshing.value = true
  mapUrl.value = `${API_BASE}/map?regenerate=1&ts=${Date.now()}`
  try {
    await loadListings()
  } finally {
    mapRefreshing.value = false
  }
}

onMounted(loadListings)
</script>

<template>
  <main class="map-shell">
    <header class="top">
      <div>
        <h1>Kaart</h1>
        <p>Bekijk de Folium kaart die door de backend wordt gegenereerd.</p>
      </div>
      <button class="primary" :disabled="loading || mapRefreshing" @click="refreshMap">
        {{ mapRefreshing ? 'Kaart bouwen...' : 'Genereer kaart opnieuw' }}
      </button>
    </header>

    <p v-if="message" class="status">{{ message }}</p>
    <p v-else-if="loading">Laden...</p>

    <section class="map-frame" v-if="mapUrl">
      <iframe
        :key="mapUrl"
        :src="mapUrl"
        title="SkillSwap kaart"
        loading="lazy"
        referrerpolicy="no-referrer"
      ></iframe>
    </section>

    <section v-if="listings.length" class="cards">
      <article v-for="l in listings" :key="l.id" class="card">
        <div class="meta">
          <p class="pill">#{{ l.id }}</p>
          <p class="pill type">{{ l.type }}</p>
          <p class="pill cat">{{ l.category?.name || 'Onbekend' }}</p>
        </div>
        <h3>{{ l.title }}</h3>
        <p class="loc">
          {{ l.city || 'Onbekende stad' }}, {{ l.country || 'Onbekend land' }}
        </p>
        <div class="actions">
          <RouterLink class="ghost" :to="`/listings/${l.id}`">Bekijk listing</RouterLink>
        </div>
      </article>
    </section>

    <p v-else-if="!loading">Geen listings gevonden.</p>
  </main>
</template>

<style scoped>
.map-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  font-weight: 700;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.map-frame {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  min-height: 420px;
}

.map-frame iframe {
  width: 100%;
  height: 520px;
  border: none;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  padding: 4px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
}

.type {
  background: #ecfdf3;
  color: #166534;
}

.cat {
  background: #eff6ff;
  color: #1d4ed8;
}

.loc {
  color: #475569;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ghost {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  background: #fff;
}

a.primary {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
