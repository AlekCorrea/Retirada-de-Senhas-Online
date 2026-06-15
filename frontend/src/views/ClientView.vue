<template>
  <div class="client-container">

    <div class="card-principal">
      <!-- Cabeçalho do card -->
      <div class="card-header">
        <div class="client-profile">
          <div class="profile-avatar">
            <img
              v-if="userPhotoUrl"
              :src="userPhotoUrl"
              :alt="`Foto de ${authStore.user?.nome || 'usuario'}`"
              @error="fotoUsuarioErro = true"
            />
            <svg v-else viewBox="0 0 24 24" class="profile-avatar-icon" aria-hidden="true">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
              <path d="M4.5 20c.88-3.45 3.78-5.5 7.5-5.5s6.62 2.05 7.5 5.5" />
            </svg>
          </div>
          <div>
            <h1>Bem vindo {{ authStore.user?.nome?.split(' ')[0] || 'Usuário' }}</h1>
            <p>Retire sua senha</p>
          </div>
        </div>
        <button @click="logout" class="btn-sair">Sair</button>
      </div>

      <div v-if="senhaConcluida" class="secao-finalizada">
        <span class="icone-finalizada">âœ…</span>
        <h2>Atendimento Finalizado!</h2>
        <p>{{ mensagemConclusao }}</p>
      </div>

      <!-- Senha existente do TicketView -->
      <div v-else-if="senhaExistente && !senhaDoSistema">
        <div class="senha-existente-aviso">
          <span>🎟️</span>
          <div>
            <strong>Você já tem uma senha em andamento!</strong>
            <p>Seu número é: {{ senhaExistente.numero }}</p>
          </div>
        </div>
        <SenhaCard :senha="senhaExistente" @cancelar="cancelarSenhaExistente" />
      </div>

      <!-- Formulário para nova senha -->
      <div v-else-if="!senhaDoSistema">
        <h2 class="escolha-label">Escolha o tipo de atendimento:</h2>

        <div class="opcoes-tipo">
          <label class="opcao-tipo preferencial-card" :class="{ selecionado: tipoSelecionado === 'prioritario' }">
            <input v-model="tipoSelecionado" type="radio" value="prioritario" />
            <span class="tipo-titulo">Preferencial</span>
            <span class="tipo-desc">Idosos, gestantes, PCD</span>
            <span class="tipo-icone" aria-hidden="true">♿</span>
          </label>

          <label class="opcao-tipo normal-card" :class="{ selecionado: tipoSelecionado === 'normal' }">
            <input v-model="tipoSelecionado" type="radio" value="normal" />
            <span class="tipo-titulo">Normal</span>
            <span class="tipo-desc">Fila padrão</span>
            <span class="tipo-icone" aria-hidden="true">👤</span>
          </label>
        </div>

        <button @click="criarSenha" :disabled="queueStore.loading" class="btn-retirar">
          <span v-if="queueStore.loading" class="spinner"></span>
          <span v-else>🎟️ Retirar Senha</span>
        </button>

        <div v-if="queueStore.error" class="alerta-erro">⚠️ {{ queueStore.error }}</div>
      </div>

      <!-- Senha ativa do sistema -->
      <div v-else>
        <div class="numero-senha">
          <div class="identificador">Sua senha</div>
          <div class="numero">{{ senhaDoSistema.numero }}</div>
          <div class="tipo-badge">{{ senhaDoSistema.tipo === 'prioritario' ? '⭐ Prioritário' : '👤 Normal' }}</div>
        </div>

        <div v-if="senhaDoSistema.status === 'chamando'" class="status-chamando">
          📢 Sua senha está sendo chamada! Dirija-se ao {{ senhaDoSistema.guiche || 'guiche indicado' }}.
        </div>

        <div class="previsao-card">
          <div class="previsao-linha"><span>👥</span><span>{{ senhaDoSistema.pessoasNaFrente || 0 }} pessoa(s) na frente</span></div>
          <div class="previsao-linha"><span>⏱️</span><span>Tempo estimado: <strong>{{ formatarMinutos(senhaDoSistema.tempoEstimadoMinutos) }} min</strong></span></div>
          <div class="previsao-linha destaque"><span>🕐</span><span>Previsão: <strong>{{ calcularHorarioEstimado(senhaDoSistema) }}</strong></span></div>
        </div>

        <div class="secao-codigo">
          <p class="codigo-label">Código de Verificação</p>
          <div class="codigo-valor">{{ senhaDoSistema.codigo_verificacao }}</div>
          <p class="codigo-hint">Guarde este código para comprovar sua senha</p>
        </div>

        <button @click="cancelarSenha" :disabled="queueStore.loading" class="btn-cancelar">
          ✗ Cancelar Senha
        </button>
      </div>

      <!-- Histórico -->
      <div class="historico-section">
        <h2>Historico de senhas:</h2>
        <div v-if="historico.length === 0" class="historico-vazio">Nenhuma senha no histórico</div>
        <div v-else class="historico-lista">
          <div v-for="senha in historico" :key="senha.id" class="historico-item">
            <div class="hist-avatar">
              <div class="hist-avatar-circle"></div>
            </div>
            <div class="hist-info">
              <div class="hist-tipo">{{ senha.tipo === 'prioritario' ? 'Preferencial' : 'Normal' }}</div>
              <div class="hist-numero">Senha: {{ senha.numero }}</div>
              <div class="hist-data">| {{ formatarData(senha.created_at) }}</div>
            </div>
            <div class="hist-status" :class="'status-' + senha.status">
              {{ getStatusLabel(senha.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'
import { useSocket } from '../composables/useSocket'
import SenhaCard from '../components/SenhaCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const queueStore = useQueueStore()
const { connect, registerDevice, on, off } = useSocket()
const tipoSelecionado = ref('normal')
const historico = ref([])
const senhaExistente = ref(null)
const senhaConcluida = ref(false)
const mensagemConclusao = ref('Seu atendimento foi concluido com sucesso.')
const fotoUsuarioErro = ref(false)
let timeoutConclusao = null

const getDeviceId = () => localStorage.getItem('deviceId')

const registrarDispositivoSocket = () => {
  const deviceId = getDeviceId()
  if (deviceId) registerDevice(deviceId, 'client')
}

const finalizarFluxoSenha = async (mensagem = 'Seu atendimento foi concluido com sucesso.') => {
  mensagemConclusao.value = mensagem
  senhaConcluida.value = true
  queueStore.minhaSenha = null
  await carregarHistorico(true)

  if (timeoutConclusao) clearTimeout(timeoutConclusao)
  timeoutConclusao = setTimeout(() => {
    senhaConcluida.value = false
    timeoutConclusao = null
  }, 5000)
}

const senhaDoSistema = computed(() => {
  const s = queueStore.minhaSenha
  // Se não tem senha ou é apenas mensagem de "nenhuma encontrada", retorna null
  if (!s || s.mensagem) return null
  return s
})

const userPhotoUrl = computed(() => {
  if (fotoUsuarioErro.value) return ''
  const user = authStore.user || {}
  return user.foto || user.foto_url || user.picture || user.avatar_url || user.image || ''
})

// Controla se a tela deve mostrar o estado "chamando" ou o formulário
const mostrarChamando = computed(() => {
  return senhaDoSistema.value && senhaDoSistema.value.status === 'chamando'
})

const processGoogleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const user = urlParams.get('user')
  const senha = urlParams.get('senha')
  if (token && user) {
    try {
      const userData = JSON.parse(decodeURIComponent(user))
      authStore.setToken(token)
      authStore.setUser(userData)
      authStore.setAdmin(false)
      fotoUsuarioErro.value = false
      if (senha) {
        try {
          senhaExistente.value = JSON.parse(decodeURIComponent(senha))
          localStorage.setItem('senhaExistente', JSON.stringify(senhaExistente.value))
        } catch (e) {}
      }
      window.history.replaceState({}, document.title, window.location.pathname)
      return true
    } catch (e) { return false }
  }
  return false
}

const verificarStatusSenha = async (silent = false) => {
  try {
    await queueStore.fetchMinhaSenha(authStore.token, { silent })
    const s = queueStore.minhaSenha
    // Se a senha foi atendida ou cancelada pelo atendente, retorna ao início
    if (s && (s.status === 'atendido' || s.status === 'cancelado')) {
      await finalizarFluxoSenha()
    }
  } catch (e) {}
}

const atualizarPorEvento = async (payload) => {
  const senha = payload?.senha || payload
  const deviceId = getDeviceId()

  if (senha?.dispositivo_id && deviceId && senha.dispositivo_id !== deviceId) return

  await verificarStatusSenha(true)
  await carregarHistorico(true)
}

onMounted(() => {
  if (!processGoogleCallback()) {
    if (!authStore.isLoggedIn) { router.push('/login'); return }
  }
  const senhaSalva = localStorage.getItem('senhaExistente')
  if (senhaSalva) {
    try { senhaExistente.value = JSON.parse(senhaSalva) } catch (e) { localStorage.removeItem('senhaExistente') }
  }
  Promise.all([queueStore.fetchMinhaSenha(authStore.token), carregarHistorico()])
  connect()
  registrarDispositivoSocket()
  on('queue-updated', atualizarPorEvento)
  on('your-turn', atualizarPorEvento)
  on('ticket-called', atualizarPorEvento)
  on('attendance-finished', atualizarPorEvento)
  on('ticket-cancelled', atualizarPorEvento)
  on('attendants-online-updated', atualizarPorEvento)
  on('attendance-config-updated', atualizarPorEvento)
})

onUnmounted(() => {
  if (timeoutConclusao) clearTimeout(timeoutConclusao)
  off('queue-updated', atualizarPorEvento)
  off('your-turn', atualizarPorEvento)
  off('ticket-called', atualizarPorEvento)
  off('attendance-finished', atualizarPorEvento)
  off('ticket-cancelled', atualizarPorEvento)
  off('attendants-online-updated', atualizarPorEvento)
  off('attendance-config-updated', atualizarPorEvento)
})

const carregarHistorico = async (silent = false) => {
  try { historico.value = await queueStore.fetchHistoricoSenhas(authStore.token, { silent }) } catch (e) {}
}

const criarSenha = async () => {
  try {
    await queueStore.criarSenha(tipoSelecionado.value, authStore.token)
    registrarDispositivoSocket()
    if (senhaExistente.value) { senhaExistente.value = null; localStorage.removeItem('senhaExistente') }
    await carregarHistorico()
  } catch (e) {}
}

const cancelarSenha = async () => {
  if (confirm('Tem certeza que deseja cancelar sua senha?')) {
    try {
      await queueStore.cancelarSenha(authStore.token)
      await finalizarFluxoSenha('Sua senha foi cancelada com sucesso.')
    } catch (e) {}
  }
}

const cancelarSenhaExistente = async () => {
  if (confirm('Tem certeza?')) {
    localStorage.removeItem('senhaExistente')
    senhaExistente.value = null
    await carregarHistorico()
  }
}

const logout = () => {
  localStorage.removeItem('senhaExistente')
  authStore.logout()
  router.push('/')
}

const getStatusLabel = (s) => ({ esperando: 'Pendente', chamando: 'Chamando', atendido: 'Atendido', cancelado: 'Cancelado' }[s] || s)

const calcularHorarioEstimado = (senha) => {
  if (senha?.previsaoAtendimento) {
    return new Date(senha.previsaoAtendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() + (senha?.tempoEstimadoMinutos || 0))
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatarMinutos = (minutos) => Number(minutos || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })

const formatarData = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
* { box-sizing: border-box; }

.client-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #F0F3FC 0%, #8F9AD2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}



.user-name-top { color: #fff; font-size: 0.9rem; font-family: 'Inter', sans-serif; }

.btn-sair {
  background: #0F1A52;
  color: #fff;
  border: 1px solid #000;
  border-radius: 50px;
  padding: 6px 18px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.2s;
}

.btn-sair:hover { background: #2B387E; }

.card-principal {
  background: #F0F3FC;
  border-radius: 25px;
  padding: 48px;
  max-width: 780px;
  width: calc(100% - 40px);
  margin: 40px 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.card-header {
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.client-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #8F9AD2;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-avatar-icon {
  width: 40px;
  height: 40px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card-header h1 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 400;
  color: #000;
  margin: 0 0 4px;
}

.card-header p { font-size: 1.2rem; color: #000; margin: 0; }

.senha-existente-aviso {
  background: linear-gradient(135deg, #CCD4FF 0%, #949FD4 100%);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: 'Inter', sans-serif;
}

.senha-existente-aviso span:first-child { font-size: 2rem; }
.senha-existente-aviso strong { color: #0F1A52; display: block; margin-bottom: 4px; }
.senha-existente-aviso p { margin: 0; color: #333; }

.escolha-label { font-size: 1.1rem; color: #0F1A52; margin: 0 0 20px; font-family: 'Inter', sans-serif; }

.opcoes-tipo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

.opcao-tipo {
  border-radius: 25px;
  padding: 28px 20px 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  min-height: 200px;
  text-align: center;
}

.opcao-tipo input { position: absolute; opacity: 0; }
.preferencial-card { background: linear-gradient(180deg, #2B387E 0%, #8F9AD2 100%); }
.normal-card { background: linear-gradient(180deg, #8F9AD2 0%, #2B387E 100%); }
.opcao-tipo:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.opcao-tipo.selecionado { box-shadow: 0 0 0 3px #fff, 0 8px 24px rgba(0,0,0,0.2); }

.tipo-titulo { font-size: 1.8rem; font-weight: 600; color: #fff; font-family: 'Inter', sans-serif; }
.tipo-desc { font-size: 0.95rem; color: #F0F3FC; font-weight: 500; }

.tipo-icone {
  background: #F0F3FC;
  color: #0F1A52;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  font-size: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  margin-top: 12px;
  box-shadow: 0 6px 14px rgba(15, 26, 82, 0.22);
}

.btn-retirar {
  width: 100%;
  padding: 18px;
  background: #0F1A52;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
}

.btn-retirar:hover:not(:disabled) { background: #2B387E; transform: translateY(-2px); }
.btn-retirar:disabled { opacity: 0.6; cursor: not-allowed; }

.alerta-erro {
  margin-top: 16px;
  padding: 14px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 10px;
  text-align: center;
}

.numero-senha { text-align: center; margin-bottom: 24px; }

.identificador { font-size: 0.85rem; color: #555; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px; }

.numero {
  font-size: 6rem;
  font-weight: 800;
  color: #0F1A52;
  padding: 32px;
  background: linear-gradient(135deg, #CCD4FF 0%, #949FD4 100%);
  border-radius: 20px;
  margin-bottom: 16px;
  font-family: 'Inter', sans-serif;
  display: inline-block;
}

.tipo-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  background: #CCD4FF;
  color: #0F1A52;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-chamando {
  background: #fef7e0;
  border: 2px solid #f59e0b;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 700;
  color: #8a6b1e;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
  50% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
}

.previsao-card {
  background: linear-gradient(135deg, #CCD4FF 0%, #949FD4 100%);
  border: 2px solid #6B78C7;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
}

.previsao-linha {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  color: #0F1A52;
  font-size: 0.95rem;
}

.previsao-linha + .previsao-linha { border-top: 1px solid rgba(0,0,0,0.1); }
.previsao-linha.destaque { font-weight: 600; }

.secao-codigo {
  background: #CCD4FF;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
}

.codigo-label { font-size: 0.85rem; color: #0F1A52; margin: 0 0 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

.codigo-valor {
  font-size: 2rem;
  font-weight: 800;
  color: #0F1A52;
  letter-spacing: 4px;
  font-family: monospace;
  background: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
  border: 2px dashed #6B78C7;
  margin-bottom: 8px;
}

.codigo-hint { font-size: 0.8rem; color: #555; margin: 0; }

.btn-cancelar {
  width: 100%;
  padding: 14px;
  background: #e93a32;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancelar:hover:not(:disabled) { background: #c0392b; }
.btn-cancelar:disabled { opacity: 0.6; cursor: not-allowed; }

.secao-finalizada {
  text-align: center;
  padding: 32px 20px;
}

.icone-finalizada {
  display: block;
  font-size: 4rem;
  margin-bottom: 16px;
}

.secao-finalizada h2 {
  color: #2B387E;
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  margin: 0 0 12px;
}

.secao-finalizada p {
  color: #555;
  margin: 0;
}

/* Histórico */
.historico-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 2px solid rgba(0,0,0,0.1);
}

.historico-section h2 {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: #000;
  margin: 0 0 20px;
}

.historico-vazio { text-align: center; color: #555; padding: 20px; }

.historico-lista {
  background: #F0F3FC;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.historico-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  transition: background 0.15s;
}

.historico-item:last-child { border-bottom: none; }
.historico-item:hover { background: rgba(255,255,255,0.5); border-radius: 8px; }

.hist-avatar-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #8F9AD2;
  flex-shrink: 0;
}

.hist-info { flex: 1; }
.hist-tipo { font-size: 1.1rem; font-weight: 400; color: #000; font-family: 'Inter', sans-serif; }
.hist-numero { font-size: 0.85rem; color: #555; }
.hist-data { font-size: 0.8rem; color: rgba(0,0,0,0.5); }

.hist-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-atendido { background: #d8ffde; color: #1a6b2a; }
.status-cancelado { background: #ffe2c5; color: #8a4a00; }
.status-esperando { background: #d9d9d9; color: #333; }
.status-chamando { background: #fee2e2; color: #991b1b; }

.spinner {
  width: 20px; height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .card-principal { padding: 28px 20px; margin: 20px 10px; }
  .card-header { align-items: center; }
  .profile-avatar {
    width: 56px;
    height: 56px;
  }
  .profile-avatar-icon {
    width: 32px;
    height: 32px;
  }
  .opcoes-tipo { grid-template-columns: 1fr; }
  .numero { font-size: 4rem; padding: 24px; }
  .user-name-top { display: none; }
}
</style>
