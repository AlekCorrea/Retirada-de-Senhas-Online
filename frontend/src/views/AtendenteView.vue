<template>
  <div class="atendente-container">
    <header class="header">
      <div class="header-content">
        <h1>👤 Painel do Atendente</h1>
        <div class="user-info">
          <span>{{ authStore.user?.nome }}</span>
          <button @click="logout" class="btn-logout">Sair</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="grid-container">
        <!-- Estatísticas -->
        <section class="stats-section">
          <h2>📊 Estatísticas da Fila</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">{{ filaStats.esperando }}</div>
              <div class="stat-label">Esperando</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ filaStats.chamando }}</div>
              <div class="stat-label">Chamando</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ filaStats.normais }}</div>
              <div class="stat-label">Normais</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ filaStats.prioritarias }}</div>
              <div class="stat-label">Prioritárias</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ filaStats.atendido }}</div>
              <div class="stat-label">Atendidas</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ filaStats.total }}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>
        </section>

        <!-- Senha Sendo Atendida -->
        <section class="senha-atual-section">
          <h2>🎫 Senha Sendo Atendida</h2>
          <div v-if="senhaAtual" class="senha-destaque">
            <div class="numero-grande">{{ senhaAtual.numero }}</div>
            <div class="tipo-badge" :class="senhaAtual.tipo">
              {{ senhaAtual.tipo === 'prioritario' ? '⭐ Prioritária' : '📋 Normal' }}
            </div>
            <div class="usuario-info">
              <p><strong>Cliente:</strong> {{ senhaAtual.nome_usuario || 'Não informado' }}</p>
              <p><strong>Email:</strong> {{ senhaAtual.email_usuario }}</p>
            </div>
            <div class="acoes">
              <button @click="finalizarAtendimento" class="btn btn-success">
                ✓ Finalizar Atendimento
              </button>
              <button @click="cancelarSenha" class="btn btn-danger">
                ✗ Cancelar Senha
              </button>
            </div>
          </div>
          <div v-else class="sem-senha">
            <p>📭 Nenhuma senha sendo atendida</p>
            <p v-if="fila.length > 0">Clique em "Chamar Próxima" para começar</p>
          </div>
        </section>

        <!-- Botão Chamar Próxima -->
        <section class="chamar-section">
          <button @click="chamarProxima" class="btn-chamar-proxima" :disabled="loading">
            <span class="icon">📢</span>
            <span class="text">{{ loading ? 'Chamando...' : 'Chamar Próxima' }}</span>
          </button>
        </section>

        <!-- Fila de Espera -->
        <section class="fila-section">
          <h2>⏳ Fila de Espera ({{ fila.length }} senhas)</h2>
          <div v-if="fila.length > 0" class="fila-list">
            <div v-for="(senha, index) in fila" :key="senha.id" class="fila-item" :class="{ 'senha-chamando': senha.status === 'chamando' }">
              <div class="posicao">{{ index + 1 }}º</div>
              <div class="info">
                <div class="numero">{{ senha.numero }}</div>
                <div class="tipo" :class="senha.tipo">
                  {{ senha.tipo === 'prioritario' ? '⭐' : '📋' }}
                </div>
              </div>
              <div class="cliente">
                <p>{{ senha.nome_usuario || 'Não informado' }}</p>
                <small>{{ senha.email_usuario }}</small>
              </div>
              <div class="status-badge" :class="senha.status">
                {{ getStatusLabel(senha.status) }}
              </div>
            </div>
          </div>
          <div v-else class="fila-vazia">
            <p>🎉 Nenhuma senha na fila</p>
          </div>
        </section>
      </div>
    </main>

    <div v-if="mensagem" class="alert" :class="'alert-' + tipoMensagem">
      {{ mensagem }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const mensagem = ref('')
const tipoMensagem = ref('success')
const senhaAtual = ref(null)
const fila = ref([])
const filaStats = ref({
  esperando: 0,
  chamando: 0,
  normais: 0,
  prioritarias: 0,
  atendido: 0,
  total: 0
})

let intervalo = null

const getStatusLabel = (status) => {
  const labels = {
    esperando: '⏳ Esperando',
    chamando: '📢 Chamando',
    atendido: '✅ Atendido',
    cancelado: '❌ Cancelado'
  }
  return labels[status] || status
}

const carregarFila = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/fila', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    fila.value = response.data.senhas || []
    filaStats.value = response.data.stats || {}
    
    // Atualizar senha sendo atendida
    const chamando = fila.value.find(s => s.status === 'chamando')
    senhaAtual.value = chamando || null
  } catch (error) {
    console.error('Erro ao carregar fila:', error)
  }
}

const chamarProxima = async () => {
  loading.value = true
  try {
    const response = await axios.put('http://localhost:3000/api/chamar', {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    if (response.data.mensagem && response.data.mensagem === "Nenhuma senha na fila") {
      mensagem.value = "Nenhuma senha na fila!"
      tipoMensagem.value = 'error'
    } else {
      mensagem.value = `Senha ${response.data.numero} chamada!`
      tipoMensagem.value = 'success'
    }
    await carregarFila()
    
    setTimeout(() => {
      mensagem.value = ''
    }, 3000)
  } catch (error) {
    console.error('Erro ao chamar próxima:', error)
    mensagem.value = error.response?.data?.mensagem || 'Erro ao chamar próxima senha'
    tipoMensagem.value = 'error'
  } finally {
    loading.value = false
  }
}

const finalizarAtendimento = async () => {
  if (!senhaAtual.value) return
  
  try {
    await axios.put(`http://localhost:3000/api/finalizar/${senhaAtual.value.id}`, {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    mensagem.value = 'Atendimento finalizado!'
    tipoMensagem.value = 'success'
    await carregarFila()
    
    setTimeout(() => {
      mensagem.value = ''
    }, 3000)
  } catch (error) {
    console.error('Erro ao finalizar:', error)
    mensagem.value = 'Erro ao finalizar atendimento'
    tipoMensagem.value = 'error'
  }
}

const cancelarSenha = async () => {
  if (!senhaAtual.value) return
  
  if (!confirm('Tem certeza que deseja cancelar esta senha?')) return
  
  try {
    await axios.put(`http://localhost:3000/api/cancelar/${senhaAtual.value.id}`, {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    mensagem.value = 'Senha cancelada!'
    tipoMensagem.value = 'success'
    await carregarFila()
    
    setTimeout(() => {
      mensagem.value = ''
    }, 3000)
  } catch (error) {
    console.error('Erro ao cancelar:', error)
    mensagem.value = 'Erro ao cancelar senha'
    tipoMensagem.value = 'error'
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  carregarFila()
  intervalo = setInterval(carregarFila, 3000)
})

onUnmounted(() => {
  if (intervalo) {
    clearInterval(intervalo)
  }
})
</script>

<style scoped>
.atendente-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid white;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.senha-destaque {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
}

.numero-grande {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.tipo-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  margin-bottom: 20px;
  font-weight: 600;
}

.usuario-info {
  text-align: left;
  margin: 20px 0;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
}

.usuario-info p {
  margin: 8px 0;
}

.acoes {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.sem-senha {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.sem-senha p {
  margin: 5px 0;
}

.chamar-section {
  grid-column: 1 / -1;
}

.btn-chamar-proxima {
  width: 100%;
  padding: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.btn-chamar-proxima:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.btn-chamar-proxima:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  font-size: 2rem;
}

.fila-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fila-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.fila-item.senha-chamando {
  border-left-color: #f5576c;
  background: #fff0f0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.posicao {
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
  min-width: 40px;
}

.info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.numero {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.tipo {
  font-size: 1.2rem;
}

.cliente {
  flex: 1;
}

.cliente p {
  margin: 0;
  font-weight: 500;
  color: #333;
}

.cliente small {
  color: #999;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.esperando {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.chamando {
  background: #fee2e2;
  color: #dc2626;
  animation: pulse-badge 1s infinite;
}

.status-badge.atendido {
  background: #d1fae5;
  color: #059669;
}

.status-badge.cancelado {
  background: #fef3c7;
  color: #d97706;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.fila-vazia {
  text-align: center;
  padding: 30px;
  color: #999;
}

.alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
  }

  .grid-container {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .numero-grande {
    font-size: 3rem;
  }

  .acoes {
    flex-direction: column;
  }
}
</style>