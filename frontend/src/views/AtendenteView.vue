<template>
  <div class="atendente-container">
    <!-- Header -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="avatar-circle" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="avatar-icon">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
            <path d="M4.5 20c.88-3.45 3.78-5.5 7.5-5.5s6.62 2.05 7.5 5.5" />
          </svg>
        </div>
        <div class="topbar-info">
          <span class="topbar-title">Bem vindo Atendente</span>
          <span class="topbar-sub">Chame a primeira senha</span>
        </div>
      </div>
      <button @click="logout" class="btn-sair">Sair <span class="seta-sair" aria-hidden="true">→</span></button>
    </header>

    <main class="main-content">
      <!-- Senha em atendimento -->
      <section class="card senha-atual-card">
        <div class="sa-label">Senha em atendimento</div>
        <div class="sa-numero" :class="{ vazio: !senhaAtual }">{{ senhaAtual?.numero || '— — — —' }}</div>
        <div class="sa-codigo-bloco">
          <div class="sa-codigo-label">Código da senha:</div>
          <div class="sa-codigo-valor" :class="{ vazio: !senhaAtual }">{{ senhaAtual?.codigo_verificacao || '— — — — — — — —' }}</div>
        </div>
      </section>

      <!-- Botões de ação -->
      <div class="acoes-grid">
        <button @click="chamarProxima" :disabled="loading" class="btn-acao btn-chamar">
          <span v-if="loading" class="spinner"></span>
          <span v-else>🔊 Chamar senha</span>
        </button>
        <button @click="cancelarSenha" :disabled="!senhaAtual" class="btn-acao btn-cancelar">
          🗑️ Cancelar Senha
        </button>
        <button @click="finalizarAtendimento" :disabled="!senhaAtual" class="btn-acao btn-finalizar">
          Finalizar
        </button>
      </div>

      <!-- Duas colunas de fila -->
      <div class="filas-grid">
        <!-- Fila para chamar -->
        <section class="card fila-card">
          <h2 class="fila-titulo">Para chamar</h2>
          <div v-if="filaPendenteOrdenada.length === 0" class="fila-vazia">Nenhuma senha pendente</div>
          <div v-else class="fila-lista">
            <div v-for="senha in filaPendenteOrdenada" :key="senha.id" class="fila-item" :class="{ 'item-chamando': senha.status === 'chamando' }">
              <div class="item-avatar" :class="'item-avatar-' + senha.tipo" aria-hidden="true">
                {{ senha.tipo === 'prioritario' ? '★' : '👤' }}
              </div>
              <div class="item-info">
                <div class="item-tipo">{{ senha.tipo === 'prioritario' ? 'Preferencial' : 'Normal' }}</div>
                <div class="item-meta">
                  <span class="item-numero">Senha: {{ senha.numero }}</span>
                  <span class="item-data">{{ formatarData(senha.criado_em || senha.created_at) }}</span>
                </div>
              </div>
              <span class="item-status" :class="'status-' + senha.status">{{ getStatusLabel(senha.status) }}</span>
            </div>
          </div>
        </section>

        <!-- Já atendidos -->
        <section class="card fila-card">
          <div class="fila-atendida-header">
            <h2 class="fila-titulo">Já atendidos</h2>
          </div>
          <div v-if="filaFinalizadaInvertida.length === 0" class="fila-vazia">Nenhuma senha finalizada</div>
          <div v-else class="fila-lista">
            <div v-for="senha in filaFinalizadaInvertida" :key="senha.id" class="fila-item" :class="{ 'item-cancelado': senha.status === 'cancelado' }">
              <div class="item-avatar" :class="'item-avatar-' + senha.tipo" aria-hidden="true">
                {{ senha.tipo === 'prioritario' ? '★' : '👤' }}
              </div>
              <div class="item-info">
                <div class="item-tipo">{{ senha.tipo === 'prioritario' ? 'Preferencial' : 'Normal' }}</div>
                <div class="item-meta">
                  <span class="item-numero">Senha: {{ senha.numero }}</span>
                  <span class="item-data">{{ formatarData(senha.atualizado_em || senha.updated_at) }}</span>
                </div>
              </div>
              <span class="item-status" :class="'status-' + senha.status">{{ getStatusLabel(senha.status) }}</span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Alert toast -->
    <div v-if="mensagem" class="toast" :class="'toast-' + tipoMensagem">{{ mensagem }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const { connect, joinAdmin, registerAttendant, unregisterAttendant, on, off } = useSocket()
const loading = ref(false)
const mensagem = ref('')
const tipoMensagem = ref('success')
const senhaAtual = ref(null)
const fila = ref([])
const filaStats = ref({ esperando: 0, chamando: 0, normais: 0, prioritarias: 0, atendido: 0, total: 0 })
let intervalo = null

const ordenarPorChamada = (senhasFila) => {
  const chamando = senhasFila.filter(s => s.status === 'chamando')
  const restantes = senhasFila.filter(s => s.status !== 'chamando')
  const ordem = []
  let contadorPrioritarias = 0

  while (restantes.length > 0) {
    let indice = -1

    if (contadorPrioritarias < 3) {
      indice = restantes.findIndex(s => s.tipo === 'prioritario')
      if (indice === -1) {
        indice = 0
        contadorPrioritarias = 0
      } else {
        contadorPrioritarias++
      }
    } else {
      indice = restantes.findIndex(s => s.tipo === 'normal')
      if (indice === -1) {
        indice = 0
        contadorPrioritarias++
      } else {
        contadorPrioritarias = 0
      }
    }

    ordem.push(restantes.splice(indice, 1)[0])
  }

  return [...chamando, ...ordem]
}

const filaPendente = computed(() => fila.value.filter(s => s.status === 'esperando' || s.status === 'chamando'))
const filaPendenteOrdenada = computed(() => ordenarPorChamada([...filaPendente.value]))
const filaFinalizada = computed(() => fila.value.filter(s => s.status === 'atendido' || s.status === 'cancelado'))
const filaFinalizadaInvertida = computed(() => [...filaFinalizada.value].reverse())

const getStatusLabel = (status) => ({ esperando: 'Esperando', chamando: 'Chamando', atendido: 'Atendida', cancelado: 'Cancelado' }[status] || status)

const formatarData = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const carregarFila = async () => {
  try {
    const r = await axios.get('/api/fila', { headers: { Authorization: `Bearer ${authStore.token}` } })
    fila.value = r.data.senhas || []
    filaStats.value = r.data.stats || {}
    senhaAtual.value = fila.value.find(s => s.status === 'chamando') || null
  } catch (e) {}
}

const chamarProxima = async () => {
  loading.value = true
  try {
    const r = await axios.put('/api/chamar', { guiche: authStore.guiche }, { headers: { Authorization: `Bearer ${authStore.token}` } })
    mensagem.value = r.data.mensagem === 'Nenhuma senha na fila' ? 'Nenhuma senha na fila!' : `Senha ${r.data.numero} chamada no ${r.data.guiche || authStore.guiche}!`
    tipoMensagem.value = r.data.mensagem === 'Nenhuma senha na fila' ? 'error' : 'success'
    await carregarFila()
    setTimeout(() => mensagem.value = '', 3000)
  } catch (e) {
    mensagem.value = e.response?.data?.mensagem || 'Erro ao chamar senha'
    tipoMensagem.value = 'error'
  } finally { loading.value = false }
}

const finalizarAtendimento = async () => {
  if (!senhaAtual.value) return
  try {
    await axios.put(`/api/finalizar/${senhaAtual.value.id}`, {}, { headers: { Authorization: `Bearer ${authStore.token}` } })
    mensagem.value = 'Atendimento finalizado!'
    tipoMensagem.value = 'success'
    await carregarFila()
    setTimeout(() => mensagem.value = '', 3000)
  } catch (e) {
    mensagem.value = 'Erro ao finalizar atendimento'
    tipoMensagem.value = 'error'
  }
}

const cancelarSenha = async () => {
  if (!senhaAtual.value || !confirm('Tem certeza que deseja cancelar esta senha?')) return
  try {
    await axios.put(`/api/cancelar/${senhaAtual.value.id}`, {}, { headers: { Authorization: `Bearer ${authStore.token}` } })
    mensagem.value = 'Senha cancelada!'
    tipoMensagem.value = 'success'
    await carregarFila()
    setTimeout(() => mensagem.value = '', 3000)
  } catch (e) {
    mensagem.value = 'Erro ao cancelar senha'
    tipoMensagem.value = 'error'
  }
}

const logout = () => { authStore.logout(); router.push('/login') }

const onQueueUpdated = () => { carregarFila() }

onMounted(() => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  carregarFila()
  connect()
  joinAdmin()
  registerAttendant(authStore.user)
  on('queue-updated', onQueueUpdated)
})

onUnmounted(() => {
  unregisterAttendant()
  off('queue-updated', onQueueUpdated)
})
</script>

<style scoped>
* { box-sizing: border-box; }

.atendente-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #F0F3FC 0%, #8F9AD2 100%);
  display: flex;
  flex-direction: column;
}

/* Topbar */
.topbar {
  background: #F0F3FC;
  border-radius: 25px;
  margin: 24px 24px 0;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.topbar-left { display: flex; align-items: center; gap: 20px; }

.avatar-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: #8F9AD2;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  width: 44px;
  height: 44px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.topbar-info { display: flex; flex-direction: column; gap: 2px; }
.topbar-title { font-size: 1.6rem; font-weight: 400; color: #000; font-family: 'Inter', sans-serif; }
.topbar-sub { font-size: 1.2rem; color: #000; font-family: 'Inter', sans-serif; }

.btn-sair {
  background: #0F1A52;
  color: #fff;
  border: 1px solid #000;
  border-radius: 50px;
  padding: 10px 24px;
  font-size: 1rem;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.2s;
}

.btn-sair:hover { background: #2B387E; }
.seta-sair { display: inline-block; margin-left: 4px; }

/* Main */
.main-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #F0F3FC;
  border-radius: 25px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

/* Senha atual */
.senha-atual-card { text-align: center; padding: 40px 24px; }

.sa-label {
  font-family: 'Inter', sans-serif;
  font-size: 1.8rem;
  font-weight: 400;
  color: #000;
  margin-bottom: 18px;
}

.sa-numero {
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 800;
  line-height: 1;
  color: #0F1A52;
  font-family: 'Inter', sans-serif;
  margin-bottom: 24px;
}

.sa-numero.vazio {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  color: rgba(15, 26, 82, 0.35);
  letter-spacing: 0.3em;
}

.sa-codigo-bloco {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sa-codigo-label {
  font-size: 0.95rem;
  color: #555;
  font-family: 'Inter', sans-serif;
}

.sa-codigo-valor {
  background: #CCD4FF;
  border-radius: 14px;
  padding: 10px 28px;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #0F1A52;
  font-family: 'Inter', sans-serif;
}

.sa-codigo-valor.vazio {
  color: rgba(15, 26, 82, 0.35);
  letter-spacing: 0.3em;
  background: rgba(204, 212, 255, 0.45);
}

/* Botões de ação */
.acoes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.btn-acao {
  padding: 18px;
  border: none;
  border-radius: 25px;
  font-size: 1.2rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  color: #fff;
}

.btn-acao:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
.btn-acao:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-chamar { background: #0C56DA; }
        .btn-cancelar { background: #E93A32; }
        .btn-finalizar { background: #0F1A52; }

/* Filas */
.filas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.fila-card { min-height: 300px; }

.fila-titulo {
  font-family: 'Inter', sans-serif;
  font-size: 1.8rem;
  font-weight: 400;
  color: #000;
  margin: 0 0 20px;
}

.fila-atendida-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.fila-atendida-header .fila-titulo { margin: 0; }

.fila-vazia { color: #555; padding: 20px 0; font-family: 'Inter', sans-serif; font-size: 1rem; }

.fila-lista { display: flex; flex-direction: column; }

.fila-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  transition: background 0.15s;
}

.fila-item:last-child { border-bottom: none; }
.fila-item:hover { background: rgba(255,255,255,0.5); border-radius: 8px; }
.item-chamando { background: rgba(59,130,246,0.08); }
.item-cancelado { background: rgba(239,68,68,0.05); }

.item-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(143, 154, 210, 0.18);
  color: #0F1A52;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.item-avatar-prioritario { font-size: 1.3rem; }

.item-info { flex: 1; min-width: 0; }
.item-tipo { font-size: 1rem; font-weight: 500; color: #000; font-family: 'Inter', sans-serif; }

.item-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }

.item-numero {
  display: inline-block;
  background: #D8FFDE;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 0.8rem;
  color: #065f46;
  font-family: 'Inter', sans-serif;
}

.item-data {
  font-size: 0.85rem;
  color: rgba(0,0,0,0.5);
  font-family: 'Inter', sans-serif;
}

.item-status {
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  background: rgba(0,0,0,0.08);
  color: #555;
  flex-shrink: 0;
  white-space: nowrap;
}

.item-status.status-esperando { background: #fef3c7; color: #92400e; }
.item-status.status-chamando { background: #dbeafe; color: #1d4ed8; }
.item-status.status-atendido { background: #D8FFDE; color: #065f46; }
.item-status.status-cancelado { background: #fee2e2; color: #991b1b; }

.item-data {
  font-size: 0.85rem;
  color: rgba(0,0,0,0.5);
  font-family: 'Inter', sans-serif;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 24px;
  border-radius: 10px;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

.toast-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.toast-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.spinner {
  width: 20px; height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .filas-grid { grid-template-columns: 1fr; }
  .acoes-grid { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .main-content { padding: 16px; }
  .topbar { margin: 16px 16px 0; padding: 16px; flex-wrap: wrap; gap: 12px; }
  .topbar-title { font-size: 1.2rem; }
  .avatar-circle { width: 56px; height: 56px; }
  .sa-label { font-size: 1.35rem; }
  .senha-atual-card { padding: 28px 16px; }
}
</style>