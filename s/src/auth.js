// Shared auth state and helpers to fetch the current user and handle logout
import { ref } from 'vue'

const user = ref(null)
const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function fetchMe() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
    if (!res.ok) {
      user.value = null
      return null
    }
    const data = await res.json()
    if (data?.error) {
      user.value = null
      return null
    }
    user.value = data
    return user.value
  } catch {
    user.value = null
    return null
  }
}

export function clearUser() {
  user.value = null
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
  } catch (e) {
    // ignore
  }
  user.value = null
}

export { user }
