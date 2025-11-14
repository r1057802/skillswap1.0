<!-- Simple register page for SkillSwap -->
<script setup>
import { ref } from 'vue'

const username = ref('')
const email = ref('')
const password = ref('')
const message = ref('')

const register = () => {
  message.value = ''

  fetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        message.value = data.error
      } else {
        message.value = 'Registered as ' + data.username
      }
    })
    .catch(() => {
      message.value = 'Registration failed'
    })
}
</script>

<template>
  <div>
    <h1>Register</h1>

    <div>
      <label>Username</label>
      <input v-model="username" type="text" />
    </div>

    <div>
      <label>Email</label>
      <input v-model="email" type="email" />
    </div>

    <div>
      <label>Password</label>
      <input v-model="password" type="password" />
    </div>

    <button @click="register">Register</button>

    <p v-if="message">
      {{ message }}
    </p>
  </div>
</template>
