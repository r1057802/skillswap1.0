<script setup>
import { ref, onMounted } from 'vue'

const listings = ref([])
const loading = ref(false)
const searching = ref(false)
const message = ref('')
const searchTerm = ref('')
const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadListings = async () => {
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API_BASE}/listings`)
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Kon listings niet laden (${res.status})`
      return
    }
    listings.value = Array.isArray(data) ? data : []
    if (!listings.value.length) {
      message.value = 'Geen listings gevonden.'
    }
  } catch (e) {
    message.value = 'Laden mislukt.'
  } finally {
    loading.value = false
  }
}

const searchListings = async () => {
  if (!searchTerm.value.trim()) {
    return loadListings()
  }
  searching.value = true
  message.value = ''
  try {
    const res = await fetch(
      `${API_BASE}/search?query=${encodeURIComponent(searchTerm.value.trim())}`,
      { credentials: 'include' }
    )
    const data = await res.json()
    if (!res.ok || data.error) {
      message.value = data.error || `Zoeken mislukt (${res.status})`
      return
    }
    const results = Array.isArray(data.results) ? data.results : []
    listings.value = results
    message.value = results.length ? '' : `Geen resultaten voor "${searchTerm.value.trim()}"`
  } catch (e) {
    message.value = 'Zoeken mislukt.'
  } finally {
    searching.value = false
  }
}

const resetSearch = () => {
  searchTerm.value = ''
  loadListings()
}

onMounted(loadListings)
</script>

<template>
  <main class="listings">
    <h1>Listings overzicht</h1>

    <form class="search-bar" @submit.prevent="searchListings">
      <input
        v-model="searchTerm"
        type="search"
        placeholder="Zoek op titel, beschrijving, stad, land..."
      />
      <button type="submit" :disabled="loading || searching">
        {{ searching ? 'Zoeken...' : 'Zoek' }}
      </button>
      <button type="button" class="ghost" :disabled="loading" @click="resetSearch">Reset</button>
    </form>

    <p v-if="loading">Laden...</p>
    <p v-else-if="message">{{ message }}</p>

    <div v-else class="cards">
      <article v-for="l in listings" :key="l.id" class="card">
        <header>
          <h2>{{ l.title }}</h2>
          <span class="type">{{ l.type }}</span>
        </header>

        <img v-if="l.imageUrl" :src="l.imageUrl" alt="" class="thumb" />

        <p class="meta">
          <span v-if="l.category">{{ l.category.name }}</span>
          <span v-if="l.owner">· door {{ l.owner.username }}</span>
          <span v-if="l.city || l.country">· {{ l.city }}<span v-if="l.city && l.country">, </span>{{ l.country }}</span>
        </p>
        <p class="desc">{{ l.description || 'Geen beschrijving' }}</p>

        <RouterLink class="detail-link" :to="`/listings/${l.id}`">Meer info / boeken</RouterLink>
      </article>
    </div>
  </main>
</template>

<style scoped>
.listings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.search-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search-bar input {
  flex: 1;
  min-width: 220px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.search-bar button {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #0f172a;
  background: #0f172a;
  color: #e2e8f0;
  cursor: pointer;
  font-weight: 700;
}

.search-bar button.ghost {
  background: #fff;
  color: #0f172a;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

.type {
  padding: 4px 8px;
  border-radius: 8px;
  background: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.meta {
  color: #64748b;
  font-size: 13px;
  margin: 6px 0;
}

.desc {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
}

.thumb {
  margin-top: 10px;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  object-fit: cover;
}

.detail-link {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 700;
}
</style>
