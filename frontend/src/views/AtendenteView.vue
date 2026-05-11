<template>
  <div class="atendente-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="icone-senha">👤</span>
          <h1>Painel do Atendente</h1>
        </div>
        <div class="user-info">
          <span>{{ authStore.user?.nome }}</span>
          <button @click="logout" class="btn-logout">Sair</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="card-principal">
        <!-- Botão Chamar Próxima - Destaque -->
        <section class="action-section">
          <button
            @click="chamarProxima"
            :disabled="loading"
            class="btn-chamar-proxima"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>
              <span class="icon">📢</span>
              <span class="text">Chamar Próxima Senha</span>
            </span>
          </button>
        </section>

        <!-- Senha Sendo Atendida -->
        <section class="current-ticket-section">
          <h2>🎫 Senha em Atendimento</h2>
          <div v-if="senhaAtual" class="ticket-card">
            <div class="numero-senha">
              <div class="identificador">Senha atual</div>
              <div class="numero">{{ senhaAtual.numero }}</div>
              <div class="tipo-badge" :class="senhaAtual.tipo">
                {{ senhaAtual.tipo === 'prioritario' ? '⭐ Prioritária' : '📋 Normal' }}
              </div>
            </div>
            <div class="ticket-details">
              <p><strong>Código de verificação:</strong> {{ senhaAtual.codigo_verificacao }}</p>
            </div>
            <div class="ticket-actions">
              <button @click="finalizarAtendimento" class="btn btn-success">
                ✓ Finalizar Atendimento
              </button>
              <button @click="cancelarSenha" class="btn btn-danger">
                ✗ Cancelar Senha
              </button>
            </div>
          </div>
          <div v-else class="no-ticket">
            <p>📭 Nenhuma senha em atendimento</p>
            <p v-if="fila.length > 0">Clique em "Chamar Próxima" para começar</p>
          </div>
        </section>

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

        <!-- Duas Filas Laterais -->
        <div class="queues-container">
          <!-- Fila de Chamadas - Lado Esquerdo -->
          <section class="queue-section left">
            <h2>📋 Fila de Chamadas</h2>
            <div v-if="filaChamada.length > 0" class="queue-list">
              <div
                v-for="(senha, index) in filaChamadaInvertida"
                :key="senha.id"
                class="queue-item"
                :class="{ 'status-chamando': senha.status === 'chamando' }"
              >
                <div class="position">{{ index + 1 }}º</div>
                <div class="info">
                  <div class="number">{{ senha.numero }}</div>
                  <div class="type" :class="senha.tipo">
                    {{ senha.tipo === 'prioritario' ? '⭐' : '📋' }}
                  </div>
                </div>
                <div class="code">{{ senha.codigo_verificacao }}</div>
                <div class="status-badge" :class="senha.status">
                  {{ getStatusLabel(senha.status) }}
                </div>
              </div>
            </div>
            <div v-else class="queue-empty">
              <p>🎉 Nenhuma senha na fila de chamadas</p>
            </div>
          </section>

          <!-- Fila Atendida - Lado Direito -->
          <section class="queue-section right">
            <h2>✅ Fila Atendida</h2>
            <div v-if="filaAtendida.length > 0" class="queue-list">
              <div
                v-for="(senha, index) in filaAtendidaInvertida"
                :key="senha.id"
                class="queue-item atendido"
              >
                <div class="position">{{ index + 1 }}º</div>
                <div class="info">
                  <div class="number">{{ senha.numero }}</div>
                  <div class="type" :class="senha.tipo">
                    {{ senha.tipo === 'prioritario' ? '⭐' : '📋' }}
                  </div>
                </div>
                <div class="code">{{ senha.codigo_verificacao }}</div>
                <div class="atendente-info">
                  <span class="atendente-name">{{ senha.atendente?.nome || 'N/A' }}</span>
                  <span class="atendente-time">{{ formatarData(senha.atualizado_em) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="queue-empty">
              <p>🎉 Nenhum ticket atendido</p>
            </div>
          </section>
        </div>
      </div>
    </main>

    <div v-if="mensagem" class="alert" :class="'alert-' + tipoMensagem">
      {{ mensagem }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// Computed properties para separar as filas
const filaChamada = computed(() => {
  return fila.value.filter(senha => senha.status === 'esperando' || senha.status === 'chamando')
})

const filaAtendida = computed(() => {
  return fila.value.filter(senha => senha.status === 'atendido')
})

// Computed properties para inverter a ordem e limitar a 5 senhas
const filaChamadaInvertida = computed(() => {
  return [...filaChamada.value].reverse().slice(0, 5)
})

const filaAtendidaInvertida = computed(() => {
  return [...filaAtendida.value].reverse().slice(0, 5)
})

const getStatusLabel = (status) => {
  const labels = {
    esperando: '⏳ Esperando',
    chamando: '📢 Chamando',
    atendido: '✅ Atendido',
    cancelado: '❌ Cancelado'
  }
  return labels[status] || status
}

const formatarData = (dataString) => {
  if (!dataString) return ''
  const data = new Date(dataString)
  return data.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const carregarFila = async () => {
  try {
    const response = await axios.get('/api/fila', {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    fila.value = response.data.senhas || []
    filaStats.value = response.data.stats || {}

    const chamando = fila.value.find(s => s.status === 'chamando')
    senhaAtual.value = chamando || null
  } catch (error) {
    console.error('Erro ao carregar fila:', error)
  }
}

const chamarProxima = async () => {
  loading.value = true
  try {
    const response = await axios.put('/api/chamar', {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })

    if (response.data.mensagem && response.data.mensagem === 'Nenhuma senha na fila') {
      mensagem.value = 'Nenhuma senha na fila!'
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
    await axios.put(`/api/finalizar/${senhaAtual.value.id}`, {}, {
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
    await axios.put(`/api/cancelar/${senhaAtual.value.id}`, {}, {
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
  router.push('/login')
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
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.header {
  background: white;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 640px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icone-senha {
  font-size: 2.5rem;
}

.header h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #263A4D;
  font-weight: 700;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-logout {
  background: #f5f9fe;
  color: #3B5975;
  border: 2px solid #75B1EB;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-logout:hover {
  background: #e8f2fb;
  border-color: #6397C7;
}

.main-content {
  width: 100%;
  max-width: 640px;
}

.card-principal {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Botão Chamar Próxima */
.action-section {
  grid-column: 1 / -1;
}

.btn-chamar-proxima {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-chamar-proxima:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(117, 177, 235, 0.4);
}

.btn-chamar-proxima:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.icon {
  font-size: 1.5rem;
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

/* Senha em Atendimento */
.current-ticket-section {
  background: #f0f6fc;
  border-radius: 14px;
  padding: 24px;
}

.current-ticket-section h2 {
  margin-top: 0;
  color: #3B5975;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
}

.ticket-card {
  background: linear-gradient(135deg, #d6e7f7 0%, #b5d5f0 100%);
  border: 2px solid #6397C7;
  color: #3B5975;
  padding: 30px;
  border-radius: 14px;
  text-align: center;
}

.numero-senha {
  margin-bottom: 20px;
}

.identificador {
  font-size: 0.9rem;
  color: #4F789E;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.numero {
  font-size: 4rem;
  font-weight: 800;
  color: #3B5975;
  line-height: 1;
  margin-bottom: 16px;
}

.tipo-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.tipo-badge.normal {
  background: #eaf8e5;
  color: #4a9e2e;
}

.tipo-badge.prioritario {
  background: #fef7e0;
  color: #b8860b;
}

.ticket-details {
  text-align: left;
  margin: 20px 0;
  background: rgba(255, 255, 255, 0.5);
  padding: 15px;
  border-radius: 8px;
}

.ticket-details p {
  margin: 8px 0;
}

.ticket-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
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

.no-ticket {
  text-align: center;
  padding: 40px 20px;
  color: #4F789E;
}

.no-ticket p {
  margin: 5px 0;
}

/* Estatísticas */
.stats-section {
  background: #f0f6fc;
  border-radius: 14px;
  padding: 24px;
}

.stats-section h2 {
  margin-top: 0;
  color: #3B5975;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
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

/* Duas Filas Laterais */
.queues-container {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
  width: 100%;
}

.queue-section {
  flex: 1;
  background: #f0f6fc;
  border-radius: 14px;
  padding: 24px;
  min-height: 300px;
}

.queue-section.right {
  background: #f0fdf4;
}

.queue-section h2 {
  margin-top: 0;
  color: #3B5975;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
}

.queue-section.right h2 {
  color: #059669;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #75B1EB;
  transition: all 0.3s;
}

.queue-item.status-chamando {
  border-left-color: #f5576c;
  background: #fff0f0;
  animation: pulse 1.5s infinite;
}

.queue-item.atendido {
  border-left-color: #10b981;
  background: #f0fdf4;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.position {
  font-size: 1.2rem;
  font-weight: bold;
  color: #75B1EB;
  min-width: 40px;
}

.queue-item.atendido .position {
  color: #059669;
}

.info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3B5975;
}

.type {
  font-size: 1.2rem;
}

.code {
  flex: 1;
  font-family: monospace;
  font-weight: 500;
  color: #3B5975;
}

.status-badge {
  padding: 5px 12px;
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

.atendente-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.atendente-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #059669;
}

.atendente-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.queue-empty {
  text-align: center;
  padding: 30px;
  color: #4F789E;
}

.queue-section.right .queue-empty {
  color: #059669;
}

/* Alertas */
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

/* Responsivo */
@media (max-width: 640px) {
  .header {
    padding: 20px;
  }

  .card-principal {
    padding: 28px;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .numero {
    font-size: 3rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ticket-actions {
    flex-direction: column;
  }

  .queues-container {
    flex-direction: column;
    gap: 16px;
  }

  .queue-item {
    flex-wrap: wrap;
  }

  .atendente-info {
    min-width: auto;
    width: 100%;
  }
}
</style>