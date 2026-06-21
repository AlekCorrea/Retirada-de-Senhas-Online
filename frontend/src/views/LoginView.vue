<template>
  <div class="login-container">

    <div class="login-card">
      <div class="card-header">
        <h1>Login - Atendentes e Administradores</h1>
        <p class="subtitulo">Faça login para acessar o sistema</p>
      </div>

      <form @submit.prevent="fazerLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="seu@email.com" required class="form-input" />
        </div>

        <div class="form-group">
          <label for="senha">Senha</label>
          <input id="senha" v-model="senha" type="password" placeholder="Sua senha" required class="form-input" />
        </div>

        <div class="form-group">
          <label for="guiche">Guiche de atendimento</label>
          <select id="guiche" v-model="guiche" required class="form-input">
            <option value="Guiche 01">Guiche 01</option>
            <option value="Guiche 02">Guiche 02</option>
            <option value="Guiche 03">Guiche 03</option>
            <option value="Guiche 04">Guiche 04</option>
            <option value="Guiche 05">Guiche 05</option>
            <option value="Guiche 06">Guiche 06</option>
          </select>
        </div>

        <button type="submit" :disabled="loading" class="btn-login">
          <span v-if="loading" class="spinner"></span>
          <span v-else>✓ Entrar</span>
        </button>
      </form>

      <div v-if="erro" class="alert-error">⚠️ {{ erro }}</div>

      <div class="info-box">
        <h3>🔑 Credenciais de Teste:</h3>
        <div class="cred-section">
          <p><strong>Atendente:</strong></p>
          <p>Email: atendente@senhas.com</p>
          <p>Senha: senha123</p>
        </div>
        <hr class="cred-divider" />
        <div class="cred-section">
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
const guiche = ref(localStorage.getItem('guiche') || 'Guiche 01')
const loading = ref(false)
const erro = ref('')

const fazerLogin = async () => {
  if (!email.value || !senha.value) { erro.value = 'Por favor, preencha todos os campos'; return }
  loading.value = true
  erro.value = ''
  try {
    const r = await axios.post('/auth/login-atendente', { email: email.value, senha: senha.value })
    const { token, usuario } = r.data
    authStore.setToken(token)
    authStore.setUser(usuario)
    authStore.setAdmin(usuario.perfil === 'administrador')
    authStore.setIsGoogleUser(false)
    authStore.setGuiche(usuario.perfil === 'atendente' ? guiche.value : '')
    router.push(usuario.perfil === 'administrador' ? '/admin' : '/atendente')
  } catch (e) {
    erro.value = e.response?.data?.mensagem || 'Erro ao fazer login. Verifique suas credenciais.'
  } finally { loading.value = false }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.login-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #F0F3FC 0%, #8F9AD2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}



.login-card {
  background: #F0F3FC;
  border-radius: 25px;
  padding: 48px;
  max-width: clamp(460px, 38vw, 760px);
  width: calc(100% - 40px);
  margin: 60px 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}

.card-header { text-align: center; margin-bottom: 36px; }

.card-header h1 {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 8px;
}

.subtitulo { color: #555; font-size: 1rem; margin: 0; font-family: 'Inter', sans-serif; }

.form-group { margin-bottom: 24px; }

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #0F1A52;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
}

.form-input {
  width: 100%;
  padding: 14px;
  border: 2px solid #8F9AD2;
  border-radius: 12px;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
  background: #fff;
  color: #000;
  transition: border-color 0.2s;
}

.form-input:focus { outline: none; border-color: #0C56DA; box-shadow: 0 0 0 4px rgba(12,86,218,0.1); }

.btn-login {
  width: 100%;
  padding: 16px;
  background: #0F1A52;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-login:hover:not(:disabled) { background: #2B387E; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,26,82,0.3); }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  margin-top: 20px;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
}

.info-box {
  background: rgba(255,255,255,0.6);
  padding: 20px;
  border-radius: 14px;
  margin-top: 28px;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
}

.info-box h3 { margin-top: 0; color: #0F1A52; font-size: 1rem; font-weight: 600; }
.cred-section { margin-bottom: 12px; }
.cred-section p { margin: 4px 0; color: #333; }
.cred-divider { border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 14px 0; }

.spinner {
  width: 20px; height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .login-card { padding: 32px 24px; margin: 30px 10px; }
  .card-header h1 { font-size: 1.3rem; }
}
</style>