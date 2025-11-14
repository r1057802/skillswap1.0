<!-- Simple login page for SkillSwap -->
<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const message = ref('')

const login = () => {
  message.value = ''

  fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        message.value = data.error
      } else {
        message.value = 'Logged in as ' + data.username
      }
    })
    .catch(() => {
      message.value = 'Login failed'
    })
}
</script>

<template>
  <div>
    <h1>Login</h1>

    <div>
      <label>Email</label>
      <input v-model="email" type="email" />
    </div>

    <div>
      <label>Password</label>
      <input v-model="password" type="password" />
    </div>

    <button @click="login">Login</button>

    <p v-if="message">
      {{ message }}
    </p>
  </div>
</template>
