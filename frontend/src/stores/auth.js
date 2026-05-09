import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isAdmin = ref(localStorage.getItem('isAdmin') === 'true')

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (newUser) => {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const setAdmin = (admin) => {
    isAdmin.value = admin
    localStorage.setItem('isAdmin', admin)
  }

  const logout = () => {
    token.value = null
    user.value = null
    isAdmin.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
  }

  return {
    token,
    user,
    isAdmin,
    isLoggedIn,
    setToken,
    setUser,
    setAdmin,
    logout
  }
})
