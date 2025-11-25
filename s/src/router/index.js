// ------ Import
import { createRouter, createWebHistory } from 'vue-router'

// ------ Pages
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Home from '@/pages/Home.vue'
import AdminMain from '@/pages/AdminMain.vue'
import AdminListings from '@/pages/AdminListings.vue'
import AdminUsers from '@/pages/AdminUsers.vue'
import AdminBookings from '@/pages/AdminBookings.vue'
import AdminMessages from '@/pages/AdminMessages.vue'
import AdminSettings from '@/pages/AdminSettings.vue'
import Listings from '@/pages/Listings.vue'
import ListingDetail from '@/pages/ListingDetail.vue'
import UserAccount from '@/pages/UserAccount.vue'
import UserNotifications from '@/pages/UserNotifications.vue'
import UserListings from '@/pages/Userlistings.vue'
import UserMain from '@/pages/UserMain.vue'
import UserMap from '@/pages/UserMap.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import ResetPassword from '@/pages/ResetPassword.vue'
import { fetchMe, user } from '@/auth'

// ------ Config of routes
const routes = [
  {
    path: '/',
    name: 'root',
    redirect: '/register',
  },
  {
    path: '/home',
    name: 'home',
    component: Home,
  },
  {
    path: '/listings',
    name: 'listings',
    component: Listings,
  },
  {
    path: '/listings/:id',
    name: 'listing-detail',
    component: ListingDetail,
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
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPassword,
  },
  {
    path: '/admin',
    name: 'admin-home',
    component: AdminMain,
  },
  {
    path: '/admin/listings',
    name: 'admin-listings',
    component: AdminListings,
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsers,
  },
  {
    path: '/admin/bookings',
    name: 'admin-bookings',
    component: AdminBookings,
  },
  {
    path: '/admin/messages',
    name: 'admin-messages',
    component: AdminMessages,
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: AdminSettings,
  },
  {
    path: '/dashboard',
    name: 'user-dashboard',
    component: UserMain,
  },
  {
    path: '/account',
    name: 'user-account',
    component: UserAccount,
  },
  {
    path: '/notifications',
    name: 'user-notifications',
    component: UserNotifications,
  },
  {
    path: '/my-listings',
    name: 'user-listings',
    component: UserListings,
  },
  {
    path: '/kaart',
    name: 'user-map',
    component: UserMap,
  },
]

// Export to use in main.js
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Basic auth guard
const protectedPrefixes = ['/admin', '/dashboard', '/account', '/notifications', '/my-listings']

router.beforeEach(async (to, _from, next) => {
  // Landing route: decide based on session
  if (to.path === '/') {
    if (!user.value) {
      await fetchMe()
    }
    if (user.value) {
      return next(user.value.role === 'admin' ? '/admin' : '/dashboard')
    }
    return next('/register')
  }

  // Public routes stay open
  const needsAuth = protectedPrefixes.some((p) => to.path.startsWith(p))
  if (!needsAuth) {
    return next()
  }

  if (!user.value) {
    await fetchMe()
  }

  // No session? go to login
  if (!user.value) {
    return next({ path: '/login' })
  }

  // Admin-only
  const isAdminRoute = to.path.startsWith('/admin')
  if (isAdminRoute && user.value.role !== 'admin') {
    return next({ path: '/dashboard' })
  }

  return next()
})
