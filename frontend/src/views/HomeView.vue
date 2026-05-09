<template>
  <div class="home-container">
    <div class="hero">
      <h1>🎫 Sistema de Senhas Online</h1>
      <p>Retirada de senhas de forma rápida e fácil</p>
      
      <div v-if="!authStore.isLoggedIn" class="login-section">
        <button @click="loginWithGoogle" class="btn btn-primary btn-lg">
          🔐 Fazer Login com Google
        </button>
      </div>

      <div v-else class="user-section">
        <div class="user-info">
          <h2>Bem-vindo, {{ authStore.user?.nome }}!</h2>
          <p>{{ authStore.user?.email }}</p>
        </div>

        <div class="menu-grid">
          <router-link to="/client" class="menu-card">
            <div class="icon">📝</div>
            <h3>Retirar Senha</h3>
            <p>Crie uma nova senha</p>
          </router-link>

          <router-link to="/client" class="menu-card">
            <div class="icon">📊</div>
            <h3>Minha Senha</h3>
            <p>Acompanhe sua posição</p>
          </router-link>

          <router-link v-if="authStore.isAdmin" to="/admin" class="menu-card">
            <div class="icon">⚙️</div>
            <h3>Painel Admin</h3>
            <p>Gerenciar senhas</p>
          </router-link>

          <button @click="logout" class="menu-card logout">
            <div class="icon">🚪</div>
            <h3>Sair</h3>
            <p>Fazer logout</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  // Verificar se voltou do OAuth com token
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const user = params.get('user')

  if (token && user) {
    try {
      const userData = JSON.parse(decodeURIComponent(user))
      authStore.setToken(token)
      authStore.setUser(userData)
      
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Redirecionar para página de cliente
      router.push('/client')
    } catch (error) {
      console.error('Erro ao processar login:', error)
    }
  }
})

const loginWithGoogle = () => {
  window.location.href = 'http://localhost:3000/auth/google'
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.hero {
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  color: #333;
}

.hero > p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 40px;
}

.login-section {
  margin-top: 40px;
}

.btn-lg {
  padding: 15px 40px;
  font-size: 1.1rem;
}

.user-section {
  text-align: left;
}

.user-info {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.user-info h2 {
  margin: 0 0 5px 0;
  color: #333;
}

.user-info p {
  margin: 0;
  color: #666;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.menu-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
  cursor: pointer;
}

.menu-card:hover {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-5px);
}

.menu-card.logout {
  background: #fff5f5;
  border-color: #ffcccc;
}

.menu-card.logout:hover {
  border-color: #ff6b6b;
  background: #ffe0e0;
}

.icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.menu-card h3 {
  margin: 10px 0 5px 0;
  font-size: 1.1rem;
}

.menu-card p {
  margin: 0;
  font-size: 0.9rem;
  color: #999;
}
</style>
