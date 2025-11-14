<script setup>
import { ref } from 'vue'

const title = ref('')
const description = ref('')
const message = ref('')

const createListing = () => {
  message.value = ''

  fetch('/listings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title.value,
      description: description.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        message.value = data.error
      } else {
        message.value = 'Listing created with id ' + data.id
        title.value = ''
        description.value = ''
      }
    })
    .catch(() => {
      message.value = 'Failed to create listing'
    })
}
</script>

<template>
  <div>
    <h1>Create Listing</h1>

    <div>
      <label>Title</label>
      <input v-model="title" type="text" />
    </div>

    <div>
      <label>Description</label>
      <textarea v-model="description" />
    </div>

    <button @click="createListing">Create</button>

    <p v-if="message">
      {{ message }}
    </p>
  </div>
</template>
