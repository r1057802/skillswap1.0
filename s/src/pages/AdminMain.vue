<script setup>
// Simple admin hub with links to sections
</script>

<template>
  <main class="admin-shell">
    <h1>Admin dashboard</h1>
    <div class="admin-grid">
      <RouterLink class="admin-card" to="/admin/listings">Listings</RouterLink>
      <RouterLink class="admin-card" to="/admin/users">Users</RouterLink>
      <RouterLink class="admin-card" to="/admin/bookings">Bookings</RouterLink>
      <RouterLink class="admin-card" to="/admin/messages">Messages</RouterLink>
      <RouterLink class="admin-card" to="/admin/settings">Extra settings</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.admin-shell {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  text-align: center;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 640px;
}

.admin-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 18px 12px;
  background: #fff;
  color: #0f172a;
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
}
</style>
