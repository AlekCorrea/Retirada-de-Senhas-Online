import { useAuthStore } from '../stores/auth'

export const setupGuards = (router) => {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    // Se a rota requer autenticação e o usuário não está logado, redireciona para login
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      next('/login')
      return
    }
    
    // Se a rota é de admin ou atendente e o usuário é do Google, redireciona para cliente
    if ((to.path === '/admin' || to.path === '/atendente') && authStore.isGoogleUser) {
      next('/client')
      return
    }

    // Garantir que a rota do atendente só seja acessada a partir da tela de login
    if (to.path === '/atendente' && from.path !== '/login') {
      // Redireciona para a tela de login se a navegação não veio da página de login
      next('/login')
      return
    }
    
    next()
  })
}