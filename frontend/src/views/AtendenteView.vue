<template>
  <div class="atendente-container">
    <!-- Header Moderno -->
    <header class="atendente-header">
      <div class="header-content">
        <div class="header-title">
          <h1>👤 Painel do Atendente</h1>
          <p>Bem-vindo, {{ authStore.user?.nome || 'Atendente' }}</p>
        </div>
        <button @click="logout" class="btn btn-logout">
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </header>

    <!-- Conteúdo Principal -->
    <main class="atendente-content">
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
            <div class="info-row">
              <span class="info-label">Código de verificação:</span>
              <span class="info-value">{{ senhaAtual.codigo_verificacao }}</span>
            </div>
          </div>
          <div class="ticket-actions">
            <button @click="finalizarAtendimento" class="btn btn-success">
              <span>✓</span>
              <span>Finalizar Atendimento</span>
            </button>
            <button @click="cancelarSenha" class="btn btn-danger">
              <span>✗</span>
              <span>Cancelar Senha</span>
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
          <div class="stat-card total">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ filaStats.total }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card waiting">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">{{ filaStats.esperando }}</div>
            <div class="stat-label">Pendentes</div>
          </div>
          <div class="stat-card calling">
            <div class="stat-icon">📢</div>
            <div class="stat-value">{{ filaStats.chamando }}</div>
            <div class="stat-label">Em Atendimento</div>
          </div>
          <div class="stat-card attended">
            <div class="stat-icon">✓</div>
            <div class="stat-value">{{ filaStats.atendido }}</div>
            <div class="stat-label">Atendidas</div>
          </div>
          <div class="stat-card normal">
            <div class="stat-icon">🔵</div>
            <div class="stat-value">{{ filaStats.normais }}</div>
            <div class="stat-label">Normais</div>
          </div>
          <div class="stat-card priority">
            <div class="stat-icon">🔴</div>
            <div class="stat-value">{{ filaStats.prioritarias }}</div>
            <div class="stat-label">Prioritárias</div>
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
    </main>

    <!-- Alertas -->
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

<style>
/* Variáveis de Design - Padronizado com AdminView */
:root {
  --primary-color: #75B1EB;
  --primary-hover: #6397C7;
  --secondary-color: #3B5975;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3B82F6;
  
  --background-gradient: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  --card-background: #ffffff;
  --text-primary: #263A4D;
  --text-secondary: #4F789E;
  --border-color: #75B1EB;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  --border-radius: 12px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reset e Base */
* {
  box-sizing: border-box;
}

/* Container Principal */
.atendente-container {
  min-height: 100vh;
  background: var(--background-gradient);
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* Header Moderno */
.atendente-header {
  background: var(--card-background);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 1200px;
  animation: slideDown 0.5s ease-out;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  margin: 0 0 4px 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.8rem;
}

.header-title p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* Botões */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
  white-space: nowrap;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn:active {
  transform: translateY(0);
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-logout {
  background: #f5f9fe;
  color: var(--secondary-color);
  border: 2px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn-logout:hover {
  background: #e8f2fb;
  border-color: var(--primary-hover);
}

/* Conteúdo Principal */
.atendente-content {
  width: 100%;
  max-width: 1200px;
  animation: fadeIn 0.8s ease-out;
}

/* Seções Gerais */
section {
  background: var(--card-background);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-lg);
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1.4rem;
}

/* Botão Chamar Próxima */
.action-section {
  margin-bottom: 24px;
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
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Senha em Atendimento */
.current-ticket-section h2 {
  text-align: center;
}

.ticket-card {
  background: linear-gradient(135deg, #d6e7f7 0%, #b5d5f0 100%);
  border: 2px solid var(--primary-hover);
  color: var(--secondary-color);
  padding: 30px;
  border-radius: 14px;
  text-align: center;
}

.numero-senha {
  margin-bottom: 20px;
}

.identificador {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.numero {
  font-size: 4rem;
  font-weight: 800;
  color: var(--secondary-color);
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

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.ticket-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.no-ticket {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.no-ticket p {
  margin: 5px 0;
}

/* Estatísticas */
.stats-section h2 {
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-card.total {
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  color: white;
}

.stat-card.waiting {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stat-card.calling {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.stat-card.attended {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.stat-card.normal {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: var(--text-primary);
}

.stat-card.priority {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.stat-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

/* Duas Filas Laterais */
.queues-container {
  display: flex;
  gap: 24px;
  width: 100%;
}

.queue-section {
  flex: 1;
  min-height: 300px;
}

.queue-section.left {
  background: var(--card-background);
}

.queue-section.right {
  background: var(--card-background);
}

.queue-section h2 {
  text-align: center;
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
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  transition: var(--transition);
}

.queue-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.queue-item.status-chamando {
  border-left-color: var(--danger-color);
  background: #fff0f0;
  animation: pulse 1.5s infinite;
}

.queue-item.atendido {
  border-left-color: var(--success-color);
  background: #f0fdf4;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.position {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-color);
  min-width: 40px;
}

.queue-item.atendido .position {
  color: var(--success-color);
}

.info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--secondary-color);
}

.type {
  font-size: 1.2rem;
}

.code {
  flex: 1;
  font-family: monospace;
  font-weight: 500;
  color: var(--secondary-color);
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
  color: var(--success-color);
}

.atendente-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.queue-empty {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

/* Alertas */
.alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
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

/* Animações */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .atendente-container {
    padding: 20px;
  }

  .atendente-header {
    padding: 20px;
    margin-bottom: 16px;
    width: 100%;
    max-width: 100%;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .atendente-content {
    padding: 0;
  }

  section {
    padding: 20px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .numero {
    font-size: 3rem;
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

  .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .atendente-header h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 1.2rem;
  }
}
</style>