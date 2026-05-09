<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🔐 Login - Atendentes e Administradores</h1>
      <p>Faça login para acessar o sistema</p>

      <form @submit.prevent="fazerLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="seu@email.com" required />
        </div>

        <div class="form-group">
          <label>Senha</label>
          <input v-model="senha" type="password" placeholder="Sua senha" required />
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Entrando...' : '✓ Entrar' }}
        </button>
      </form>

      <div v-if="erro" class="alert alert-error">
        {{ erro }}
      </div>

      <div class="info-box">
        <h3>Credenciais de Teste:</h3>
        <p><strong>Atendente:</strong></p>
        <p>Email: atendente@senhas.com</p>
        <p>Senha: senha123</p>
        <hr />
        <p><strong>Administrador:</strong></p>
        <p>Email: admin@senhas.com</p>
        <p>Senha: admin123</p>
      </div>

      <router-link to="/" class="back-link">← Voltar</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const senha = ref('')
const loading = ref(false)
const erro = ref('')

const fazerLogin = async () => {
  if (!email.value || !senha.value) {
    erro.value = 'Por favor, preencha todos os campos'
    return
  }

  loading.value = true
  erro.value = ''

  try {
    const response = await axios.post('http://localhost:3000/auth/login-atendente', {
      email: email.value,
      senha: senha.value
    })

    const { token, usuario } = response.data

    // Armazenar token e usuário
    authStore.setToken(token)
    authStore.setUser(usuario)
    authStore.setAdmin(usuario.perfil === 'administrador')

    // Redirecionar baseado no perfil
    if (usuario.perfil === 'administrador') {
      router.push('/admin')
    } else if (usuario.perfil === 'atendente') {
      router.push('/atendente')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    erro.value = error.response?.data?.mensagem || 'Erro ao fazer login. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 15px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
  font-size: 1.5rem;
}

.login-card > p {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
  margin-bottom: 15px;
}

.alert {
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 15px;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.info-box {
  background: #f5f7ff;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  font-size: 0.9rem;
}

.info-box h3 {
  margin-top: 0;
  color: #333;
  font-size: 1rem;
}

.info-box p {
  margin: 5px 0;
  color: #666;
}

.info-box hr {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #ddd;
}

.back-link {
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
