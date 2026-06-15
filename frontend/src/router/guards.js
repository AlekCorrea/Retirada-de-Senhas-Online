import { useAuthStore } from '../stores/auth'

export const setupGuards = (router) => {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      next('/login')
      return
    }

    if ((to.path === '/admin' || to.path === '/atendente') && authStore.isGoogleUser) {
      next('/client')
      return
    }

    next()
  })
}
