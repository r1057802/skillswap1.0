// ------ Import
import { createRouter, createWebHistory } from 'vue-router'

// ------ Pages
import Home from '@/pages/Home.vue'
import Listings from '@/pages/Listings.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'

// ------ Config of routes
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/listings',
    name: 'listings',
    component: Listings,
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
  },
]

// Export to use in main.js
export const router = createRouter({
  history: createWebHistory(),
  routes,
})
