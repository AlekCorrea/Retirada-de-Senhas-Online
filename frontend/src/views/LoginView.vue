<template>
  <div class="login-container">
    <div class="login-card">
      <div class="cabecalho">
        <div class="logo">
          <span class="icone-senha">🔐</span>
          <h1>Login - Atendentes e Administradores</h1>
        </div>
        <p class="subtitulo">Faça login para acessar o sistema</p>
      </div>

      <form @submit.prevent="fazerLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            placeholder="seu@email.com" 
            required 
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="senha">Senha</label>
          <input 
            id="senha"
            v-model="senha" 
            type="password" 
            placeholder="Sua senha" 
            required 
            class="form-input"
          />
        </div>

        <button type="submit" :disabled="loading" class="btn-login">
          <span v-if="loading" class="spinner"></span>
          <span v-else>
            <span class="icone-botao">✓</span>
            Entrar
          </span>
        </button>
      </form>

      <div v-if="erro" class="alert alert-error">
        ⚠️ {{ erro }}
      </div>

      <div class="info-box">
        <h3>🔑 Credenciais de Teste:</h3>
        <div class="credenciais-section">
          <p><strong>Atendente:</strong></p>
          <p>Email: atendente@senhas.com</p>
          <p>Senha: senha123</p>
        </div>
        <hr />
        <div class="credenciais-section">
          <p><strong>Administrador:</strong></p>
          <p>Email: admin@senhas.com</p>
          <p>Senha: admin123</p>
        </div>
      </div>
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
    // Tentar login como admin primeiro
    const response = await axios.post('/auth/login-admin', {
      email: email.value,
      senha: senha.value
    })

    const { token } = response.data

    // Armazenar token e usuário
    authStore.setToken(token)
    authStore.setUser({ email: email.value, perfil: 'admin' })
    authStore.setAdmin(true)

    // Redirecionar para admin
    router.push('/admin')
  } catch (adminError) {
    // Se falhar, tentar login como atendente
    try {
      const response = await axios.post('/auth/login-atendente', {
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
    } catch (atendenteError) {
      console.error('Erro ao fazer login:', atendenteError)
      erro.value = atendenteError.response?.data?.mensagem || 'Erro ao fazer login. Verifique suas credenciais.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.cabecalho {
  text-align: center;
  margin-bottom: 36px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.icone-senha {
  font-size: 2.5rem;
}

.cabecalho h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #263A4D;
  font-weight: 700;
}

.subtitulo {
  margin: 8px 0 0;
  color: #4F789E;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #3B5975;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 14px;
  border: 2px solid #75B1EB;
  border-radius: 12px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s;
  background: #f5f9fe;
}

.form-input:focus {
  outline: none;
  border-color: #6397C7;
  background: white;
  box-shadow: 0 0 0 4px rgba(117, 177, 235, 0.1);
}

.btn-login {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(117, 177, 235, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.icone-botao {
  font-size: 1.3rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  margin: 20px 0;
  font-size: 0.95rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.info-box {
  background: #f0f6fc;
  padding: 20px;
  border-radius: 14px;
  margin: 24px 0;
  font-size: 0.9rem;
}

.info-box h3 {
  margin-top: 0;
  color: #3B5975;
  font-size: 1rem;
  font-weight: 600;
}

.credenciais-section {
  margin-bottom: 16px;
}

.credenciais-section p {
  margin: 6px 0;
  color: #4F789E;
}

.info-box hr {
  margin: 16px 0;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Responsivo */
@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
  }

  .cabecalho h1 {
    font-size: 1.5rem;
  }

  .icone-senha {
    font-size: 2rem;
  }

  .form-input {
    padding: 12px;
  }

  .btn-login {
    padding: 14px;
    font-size: 1rem;
  }
}
</style>