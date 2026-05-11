import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
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
    router.push('/')
  }

  const handleGoogleCallback = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const user = urlParams.get('user')
    
    if (token && user) {
      setToken(token)
      setUser(JSON.parse(decodeURIComponent(user)))
      setAdmin(false) // Usuários do Google não são admin por padrão
      router.push('/client')
      return true
    }
    return false
  }

  return {
    token,
    user,
    isAdmin,
    isLoggedIn,
    setToken,
    setUser,
    setAdmin,
    logout,
    handleGoogleCallback
  }
})