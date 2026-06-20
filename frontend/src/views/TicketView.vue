<template>
  <div class="container-tela">

    <div class="card-principal">
      <div class="cabecalho">
        <h1>Retirada de Senhas</h1>
        <p class="subtitulo">Sistema de Atendimento Online</p>

        <div v-if="!senhaFinalizada && !authStore.isLoggedIn" class="login-section">
          <button @click="loginComGoogle" :disabled="carregandoLogin" class="btn-google">
            <span v-if="carregandoLogin" class="spinner"></span>
            <span v-else>
              <img src="https://www.google.com/favicon.ico" class="google-icon" alt="Google" />
              Entrar com o Google
            </span>
          </button>
          <div class="divider"><span class="divider-line"></span><span class="ou">ou</span><span class="divider-line"></span></div>
        </div>
      </div>

      <!-- Sem senha retirada -->
      <div v-if="!senhaRetirada" class="secao-formulario">
        <h2>Bem vindo usuário</h2>
        <p class="sub-instrucao">Retire sua senha</p>

        <div class="opcoes-tipo">
          <label class="opcao-tipo preferencial-card" :class="{ selecionado: tipo === 'prioritario' }">
            <input v-model="tipo" type="radio" value="prioritario" />
            <span class="tipo-titulo">Preferencial</span>
            <span class="tipo-desc">Idosos, gestantes, PCD</span>
            <span class="tipo-icone" aria-hidden="true">♿</span>
          </label>

          <label class="opcao-tipo normal-card" :class="{ selecionado: tipo === 'normal' }">
            <input v-model="tipo" type="radio" value="normal" />
            <span class="tipo-titulo">Normal</span>
            <span class="tipo-desc">Fila padrão</span>
            <span class="tipo-icone" aria-hidden="true">👤</span>
          </label>
        </div>

        <button @click="retirarSenha" :disabled="carregando" class="btn-retirar">
          <span v-if="carregando" class="spinner"></span>
          <span v-else>🎟️ Retirar Senha</span>
        </button>

        <div v-if="erro" class="alerta-erro">⚠️ {{ erro }}</div>
      </div>

      <!-- Com senha retirada - aguardando -->
      <div v-else-if="senhaRetirada && !senhaFinalizada" class="secao-sucesso">
        <div class="numero-senha">
          <div class="identificador">Sua senha</div>
          <div class="numero">{{ senhaRetirada.numero }}</div>
          <div class="tipo-badge" :class="senhaRetirada.tipo">
            {{ senhaRetirada.tipo === 'prioritario' ? '⭐ Prioritário' : '👤 Normal' }}
          </div>
        </div>

        <div v-if="senhaRetirada.status === 'chamando'" class="status-chamando">
          <span class="icone-status">📢</span>
          <span>Sua senha está sendo chamada! Dirija-se ao {{ senhaRetirada.guiche || 'guiche indicado' }}.</span>
        </div>

        <div class="previsao-card" :class="senhaRetirada.tipo">
          <div class="previsao-linha">
            <span>👥</span>
            <span>{{ senhaRetirada.pessoasNaFrente }} senha(s) na frente</span>
          </div>
          <div class="previsao-linha">
            <span>⏱️</span>
            <span>Tempo estimado: <strong>{{ tempoEstimadoFormatado }} min</strong></span>
          </div>
          <div class="previsao-linha destaque">
            <span>🕐</span>
            <span>Previsão: <strong>{{ horarioPrevisao }}</strong></span>
          </div>
        </div>

        <div class="secao-codigo">
          <p class="codigo-label">Código de Verificação</p>
          <div class="codigo-valor">{{ senhaRetirada.codigo_verificacao }}</div>
          <p class="codigo-hint">Guarde este código para comprovar sua senha</p>
        </div>

        <div class="instrucoes">
          <h3>📌 Instruções:</h3>
          <ul>
            <li>🎟️ Guarde seu número de senha e código</li>
            <li>📺 Acompanhe o painel de chamadas</li>
            <li>🚶 Compareça quando sua senha for chamada</li>
          </ul>
        </div>

        <button @click="cancelarSenha" class="btn-cancelar">✗ Cancelar Senha</button>

        <div v-if="erro" class="alerta-erro">⚠️ {{ erro }}</div>
      </div>

      <!-- Finalizada -->
      <div v-else class="secao-finalizada">
        <span class="icone-finalizada">✅</span>
        <h2>Atendimento Finalizado!</h2>
        <p>Seu atendimento foi concluído com sucesso.</p>
        <button @click="voltarParaRetirar" class="btn-retirar">🎟️ Retirar Nova Senha</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'

const router = useRouter()
const authStore = useAuthStore()
const { connect, registerDevice, on, off } = useSocket()
const tipo = ref('normal')
const carregando = ref(false)
const carregandoLogin = ref(false)
const erro = ref('')
const senhaRetirada = ref(null)
const tempoEstimado = ref(0)
const deviceId = ref('')
const senhaFinalizada = ref(false)
let intervaloMinhaSenha = null

const registrarDispositivoSocket = () => {
  if (deviceId.value) registerDevice(deviceId.value, 'ticket')
}

const carregarEstadoSalvo = () => {
  const salva = localStorage.getItem('senhaRetirada')
  if (salva) {
    try { senhaRetirada.value = JSON.parse(salva) } catch (e) { localStorage.removeItem('senhaRetirada') }
  }
  deviceId.value = localStorage.getItem('deviceId') || ''
}

onMounted(() => {
  if (authStore.isLoggedIn && authStore.isGoogleUser) {
    router.replace('/client')
  }
  carregarEstadoSalvo()
  connect()
  registrarDispositivoSocket()
  on('queue-updated', verificarMinhaSenha)
  on('your-turn', atualizarSenhaPorEvento)
  on('ticket-called', atualizarSenhaPorEvento)
  on('attendance-finished', finalizarSenhaPorEvento)
  on('ticket-cancelled', finalizarSenhaPorEvento)
  on('attendants-online-updated', verificarMinhaSenha)
  on('attendance-config-updated', verificarMinhaSenha)
  if (senhaRetirada.value) iniciarPollingSenha()
})

const salvarEstado = () => {
  if (senhaRetirada.value) localStorage.setItem('senhaRetirada', JSON.stringify(senhaRetirada.value))
}

const limparEstadoSenha = () => {
  senhaRetirada.value = null
  senhaFinalizada.value = false
  localStorage.removeItem('senhaRetirada')
}

const voltarParaRetirar = () => limparEstadoSenha()

const horarioPrevisao = computed(() => {
  if (!senhaRetirada.value) return '--:--'
  if (senhaRetirada.value.previsaoAtendimento) {
    return new Date(senhaRetirada.value.previsaoAtendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  const agora = new Date()
  const min = senhaRetirada.value.tempoEstimadoMinutos || tempoEstimado.value || 0
  agora.setMinutes(agora.getMinutes() + min)
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
})

const tempoEstimadoFormatado = computed(() => Number(senhaRetirada.value?.tempoEstimadoMinutos || tempoEstimado.value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }))

const verificarMinhaSenha = async () => {
  if (!deviceId.value || !senhaRetirada.value) return
  try {
    const r = await axios.get(`/api/minha-senha/publica?deviceId=${deviceId.value}`)
    console.log('[DEBUG verificarMinhaSenha]', { deviceId: deviceId.value, resposta: r.data })
    if (r.data?.mensagem === 'Nenhuma senha ativa encontrada') {
      console.log('[DEBUG] verificarMinhaSenha vai FINALIZAR a senha local')
      senhaFinalizada.value = true
      clearInterval(intervaloMinhaSenha)
      setTimeout(() => limparEstadoSenha(), 5000)
    } else if (r.data?.numero) {
      senhaRetirada.value = { ...senhaRetirada.value, status: r.data.status, guiche: r.data.guiche, pessoasNaFrente: r.data.pessoasNaFrente, tempoEstimadoMinutos: r.data.tempoEstimadoMinutos, previsaoAtendimento: r.data.previsaoAtendimento }
      tempoEstimado.value = Number(r.data.tempoEstimadoMinutos) || 0
      salvarEstado()
    }
  } catch (e) {
    console.log('[DEBUG verificarMinhaSenha] ERRO', e)
  }
}

const eventoEhDaMinhaSenha = (payload) => {
  const senha = payload?.senha || payload
  if (!senhaRetirada.value || !senha) return false
  // Não usar "numero" como critério: números são reaproveitados por dia/tipo
  // e podem coincidir com a senha de outro dispositivo, causando falsos positivos.
  if (senha.dispositivo_id && deviceId.value) {
    return senha.dispositivo_id === deviceId.value
  }
  if (senha.id && senhaRetirada.value.id) {
    return senha.id === senhaRetirada.value.id
  }
  return false
}

const atualizarSenhaPorEvento = async (payload) => {
  if (!eventoEhDaMinhaSenha(payload)) return
  const senha = payload?.senha || payload
  senhaRetirada.value = {
    ...senhaRetirada.value,
    ...senha,
    status: senha.status || 'chamando'
  }
  salvarEstado()
  await verificarMinhaSenha()
}

const finalizarSenhaPorEvento = (payload) => {
  console.log('[DEBUG finalizarSenhaPorEvento] evento recebido', payload, 'eventoEhDaMinhaSenha?', eventoEhDaMinhaSenha(payload))
  if (!eventoEhDaMinhaSenha(payload)) return
  console.log('[DEBUG] finalizarSenhaPorEvento VAI FINALIZAR via WebSocket')
  senhaFinalizada.value = true
  if (intervaloMinhaSenha) clearInterval(intervaloMinhaSenha)
  setTimeout(() => limparEstadoSenha(), 5000)
}

const iniciarPollingSenha = () => {
  if (intervaloMinhaSenha) clearInterval(intervaloMinhaSenha)
  intervaloMinhaSenha = setInterval(verificarMinhaSenha, 5000)
}

onBeforeUnmount(() => {
  salvarEstado()
  if (intervaloMinhaSenha) clearInterval(intervaloMinhaSenha)
  off('queue-updated', verificarMinhaSenha)
  off('your-turn', atualizarSenhaPorEvento)
  off('ticket-called', atualizarSenhaPorEvento)
  off('attendance-finished', finalizarSenhaPorEvento)
  off('ticket-cancelled', finalizarSenhaPorEvento)
  off('attendants-online-updated', verificarMinhaSenha)
  off('attendance-config-updated', verificarMinhaSenha)
})

const retirarSenha = async () => {
  carregando.value = true
  erro.value = ''
  try {
    if (!deviceId.value) {
      deviceId.value = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
      localStorage.setItem('deviceId', deviceId.value)
    }
    const r = await axios.post('/api/senha/publica', { tipo: tipo.value, deviceId: deviceId.value })
    registrarDispositivoSocket()
    senhaRetirada.value = r.data
    tempoEstimado.value = Number(r.data.tempoEstimadoMinutos) || 0
    salvarEstado()
    iniciarPollingSenha()
  } catch (e) {
    erro.value = e.response?.data?.erro || 'Erro ao retirar senha. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

const cancelarSenha = async () => {
  erro.value = ''
  try {
    await axios.put('/api/minha-senha/cancelar/publica', { deviceId: deviceId.value })
    senhaFinalizada.value = true
    if (intervaloMinhaSenha) clearInterval(intervaloMinhaSenha)
    setTimeout(() => limparEstadoSenha(), 5000)
  } catch (e) {
    // Cancelamento falhou de verdade no backend — sincroniza com o estado real
    // em vez de fingir sucesso.
    erro.value = e.response?.data?.erro || 'Erro ao cancelar senha. Tente novamente.'
    await verificarMinhaSenha()
  }
}

const loginComGoogle = async () => {
  carregandoLogin.value = true
  try {
    const senhaExistente = senhaRetirada.value
    window.location.href = senhaExistente ? `/auth/google?senha=${encodeURIComponent(JSON.stringify(senhaExistente))}` : '/auth/google'
  } catch (e) {
    erro.value = 'Erro ao fazer login com Google.'
  } finally {
    carregandoLogin.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.container-tela {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #F0F3FC 0%, #8F9AD2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}



.card-principal {
  background: #F0F3FC;
  border-radius: 25px;
  padding: 48px;
  max-width: 720px;
  width: calc(100% - 40px);
  margin: 40px 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}

.cabecalho { text-align: center; margin-bottom: 36px; }

.cabecalho h1 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 8px;
}

.subtitulo { color: #555; font-size: 1rem; margin: 0 0 20px; }

.btn-google {
  width: 100%;
  max-width: 400px;
  padding: 14px 24px;
  background: #f2f2f2;
  color: #000;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 4px rgba(0,0,0,0.25);
  margin: 0 auto 16px;
}

.btn-google:hover:not(:disabled) { background: #e0e0e0; transform: translateY(-1px); }

.google-icon { width: 24px; height: 24px; border-radius: 50%; }

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px auto;
  max-width: 400px;
}

.divider-line { flex: 1; height: 1px; background: #000; }
.ou { font-size: 1rem; color: #000; }

.secao-formulario h2 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 400;
  color: #000;
  text-align: center;
  margin: 0 0 4px;
}

.sub-instrucao {
  font-size: 1.3rem;
  color: #000;
  text-align: center;
  margin: 0 0 32px;
}

.opcoes-tipo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.opcao-tipo {
  border-radius: 25px;
  padding: 32px 20px 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  min-height: 210px;
  text-align: center;
}

.opcao-tipo input { position: absolute; opacity: 0; pointer-events: none; }

.preferencial-card {
  background: linear-gradient(180deg, #2B387E 0%, #8F9AD2 100%);
}

.normal-card {
  background: linear-gradient(180deg, #8F9AD2 0%, #2B387E 100%);
}

.opcao-tipo:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.opcao-tipo.selecionado { box-shadow: 0 0 0 3px #fff, 0 8px 24px rgba(0,0,0,0.25); }

.tipo-titulo { font-size: 1.8rem; font-weight: 600; color: #fff; font-family: 'Inter', sans-serif; }
.tipo-desc { font-size: 0.95rem; color: #F0F3FC; font-weight: 500; }

.tipo-icone {
  margin-top: auto;
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
  font-size: 0.9rem;
}

.secao-sucesso { text-align: center; }

.numero-senha { margin-bottom: 28px; }

.identificador {
  font-size: 0.85rem;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 8px;
}

.numero {
  font-size: 6rem;
  font-weight: 800;
  color: #0F1A52;
  line-height: 1;
  padding: 32px;
  background: linear-gradient(135deg, #CCD4FF 0%, #949FD4 100%);
  border-radius: 20px;
  margin-bottom: 16px;
  font-family: 'Inter', sans-serif;
}

.tipo-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: #CCD4FF;
  color: #0F1A52;
}

.status-chamando {
  background: #fef7e0;
  border: 2px solid #f59e0b;
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 700;
  color: #8a6b1e;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
  50% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
}

.previsao-card {
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: left;
  background: linear-gradient(135deg, #CCD4FF 0%, #949FD4 100%);
  border: 2px solid #6B78C7;
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
  background: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
  border: 2px dashed #6B78C7;
  margin-bottom: 8px;
}

.codigo-hint { font-size: 0.8rem; color: #555; margin: 0; }

.instrucoes {
  background: rgba(255,255,255,0.5);
  padding: 18px 20px;
  border-radius: 14px;
  text-align: left;
  margin-bottom: 24px;
}

.instrucoes h3 { margin: 0 0 10px; color: #0F1A52; font-size: 0.95rem; }
.instrucoes ul { margin: 0; padding-left: 20px; }
.instrucoes li { margin: 6px 0; color: #333; font-size: 0.9rem; }

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
  transition: all 0.2s;
}

.btn-cancelar:hover { background: #c0392b; }

.secao-finalizada { text-align: center; }
.icone-finalizada { font-size: 4rem; display: block; margin-bottom: 16px; }
.secao-finalizada h2 { font-size: 2rem; color: #2B387E; margin: 0 0 12px; font-family: 'Inter', sans-serif; }
.secao-finalizada p { color: #555; margin: 0 0 24px; }

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
  .opcoes-tipo { grid-template-columns: 1fr; }
  .numero { font-size: 4rem; padding: 24px; }
}
</style>