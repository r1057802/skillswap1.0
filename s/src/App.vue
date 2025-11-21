<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { user, fetchMe, logout } from './auth'

const router = useRouter()

onMounted(() => {
  fetchMe()
})

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="logo">SkillSwap</div>
      <nav class="nav">
        <RouterLink v-if="!user" to="/login">Login</RouterLink>
        <RouterLink v-if="!user" to="/register">Register</RouterLink>
        <RouterLink v-if="user" to="/dashboard">Dashboard</RouterLink>
        <RouterLink v-if="user?.role === 'admin'" to="/admin">Admin</RouterLink>
        <button v-if="user" class="logout" @click="handleLogout">Logout</button>
      </nav>
    </header>

    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
  color: #0f172a;
  background: #f8fafc;
}

body {
  margin: 0;
  background: #f8fafc;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #0f172a;
  color: #e2e8f0;
}

.logo {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.nav {
  display: flex;
  gap: 14px;
}

.nav a {
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.logout {
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #e2e8f0;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.logout:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.nav a:hover {
  background: #1e293b;
}

.nav a.router-link-active {
  background: #e2e8f0;
  color: #0f172a;
}

.page {
  max-width: 760px;
  margin: 32px auto;
  padding: 0 16px;
}
</style>
