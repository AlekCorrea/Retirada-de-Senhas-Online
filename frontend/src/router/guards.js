import { useAuthStore } from '../stores/auth'

export const setupGuards = (router) => {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    // Se a rota requer autenticação
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      next('/')
      return
    }
    
    // Se a rota é de admin ou atendente e o usuário é do Google
    if ((to.path === '/admin' || to.path === '/atendente') && authStore.isGoogleUser) {
      next('/client')
      return
    }
    
    next()
  })
}