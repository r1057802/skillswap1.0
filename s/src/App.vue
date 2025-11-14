<script setup>
</script>

<template>
  <div>
    <!-- Navigation -->
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/listings">Listings</RouterLink>
      <RouterLink to="/login">Login</RouterLink>
      <RouterLink to="/register">Register</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>
