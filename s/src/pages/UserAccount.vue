<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref(null)
const message = ref('')

const loadMe = () => {
  message.value = ''
  fetch('/auth/me')
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        message.value = data.error
      } else {
        user.value = data
      }
    })
    .catch(() => {
      message.value = 'Kon accountgegevens niet laden.'
    })
}

const logout = () => {
  fetch('/auth/logout', { method: 'POST' })
    .then(() => {
      try {
        localStorage.removeItem('currentUser')
      } catch (e) {}
      router.push('/login')
    })
    .catch(() => {
      message.value = 'Kon niet uitloggen.'
    })
}

const deleteAccount = () => {
  if (!user.value) return
  if (!confirm('Wil je je account echt verwijderen?')) return

  fetch('/users/' + user.value.id, {
    method: 'DELETE',
  })
    .then(() => {
      try {
        localStorage.removeItem('currentUser')
      } catch (e) {}
      router.push('/register')
    })
    .catch(() => {
      message.value = 'Kon account niet verwijderen.'
    })
}

onMounted(() => {
  loadMe()
})
</script>

<template>
  <div>
    <h1>Mijn account</h1>

    <p v-if="message">
      {{ message }}
    </p>

    <div v-if="user">
      <p>Gebruikersnaam: {{ user.username }}</p>
      <p>Email: {{ user.email }}</p>
      <p>Rol: {{ user.role }}</p>

      <button @click="logout">Uitloggen</button>
      <button @click="deleteAccount" style="margin-left: 0.5rem;">
        Account verwijderen
      </button>
    </div>

    <p v-else-if="!message">
      Geen account info beschikbaar.
    </p>
  </div>
</template>
