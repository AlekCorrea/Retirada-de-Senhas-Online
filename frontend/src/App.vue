<template>
  <div id="app" class="app-container">
    <nav v-if="!isPainelRoute" class="navbar">
  <div class="navbar-brand">
    <h1>🎫 Senhas Online</h1>
  </div>
  <div class="navbar-menu">
  </div>
    </nav>

    <main class="main-content" :class="{ 'painel-content': isPainelRoute }">
      <router-view />
    </main>

    <footer v-if="!isPainelRoute" class="footer">
      <p>&copy; 2026 Sistema de Senhas Online para Atendimento</p>
    </footer>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()
    const route = useRoute()

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const isAdmin = computed(() => authStore.isAdmin)
    const isPainelRoute = computed(() => route.name === 'Painel' || route.path === '/painel')

    const logout = () => {
      authStore.logout()
      window.location.href = '/'
    }

    return {
      isLoggedIn,
      isAdmin,
      isPainelRoute,
      logout
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f6fc;
}

.navbar {
  background-color: #263A4D;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
}

.navbar-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
}

.btn-logout {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: #b91c1c;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 90%;
}

.main-content.painel-content {
  max-width: none;
  width: 100%;
  margin: 0;
}

.footer {
  background-color: #263A4D;
  color: white;
  text-align: center;
  padding: 1rem;
}
</style>
