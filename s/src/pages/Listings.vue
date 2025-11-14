<!-- Simple listings page for SkillSwap -->
<script setup>
import { ref, onMounted } from 'vue'

const listings = ref([])
const message = ref('')

const loadListings = () => {
  message.value = ''

  fetch('/listings')
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

onMounted(() => {
  loadListings()
})
</script>

<template>
  <div>
    <h1>Listings</h1>

    <p v-if="message">
      {{ message }}
    </p>

    <ul v-if="listings.length > 0">
      <li v-for="listing in listings" :key="listing.id">
        <strong>{{ listing.title }}</strong>
        <span v-if="listing.category"> - {{ listing.category.name }}</span>
        <span v-if="listing.owner"> (by {{ listing.owner.username }})</span>
      </li>
    </ul>

    <p v-else>
      No listings yet.
    </p>
  </div>
</template>
