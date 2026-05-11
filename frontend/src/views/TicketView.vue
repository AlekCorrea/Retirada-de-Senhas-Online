<template>
  <div class="container-tela">
    <div class="card-principal">
      <div class="cabecalho">
        <div class="logo">
          <span class="icone-senha">🎟️</span>
          <h1>Retirada de Senhas</h1>
        </div>
        <p class="subtitulo">Sistema de Atendimento Online</p>
        <div class="login-section" v-if="!senhaFinalizada">
          <button @click="loginComGoogle" :disabled="carregandoLogin" class="btn-google">
            <span v-if="carregandoLogin" class="spinner"></span>
            <span v-else>
              <span class="icone-google">🔍</span>
              Login com Google
            </span>
          </button>
        </div>
      </div>

      <!-- Sem senha retirada -->
      <div v-if="!senhaRetirada" class="secao-formulario">
        <h2>Escolha o tipo de atendimento:</h2>

        <div class="opcoes-tipo">
          <label class="opcao-tipo" :class="{ selecionado: tipo === 'normal' }">
            <input v-model="tipo" type="radio" value="normal" />
            <div class="conteudo-opcao">
              <span class="icone-opcao">👤</span>
              <div class="texto-opcao">
                <span class="titulo-opcao">Atendimento Normal</span>
                <span class="descricao-opcao">Fila padrão</span>
              </div>
            </div>
          </label>

          <label class="opcao-tipo" :class="{ selecionado: tipo === 'prioritario' }">
            <input v-model="tipo" type="radio" value="prioritario" />
            <div class="conteudo-opcao">
              <span class="icone-opcao">♿</span>
              <div class="texto-opcao">
                <span class="titulo-opcao">Atendimento Prioritário</span>
                <span class="descricao-opcao">Idosos, gestantes, PCD</span>
              </div>
            </div>
          </label>
        </div>

        <button @click="retirarSenha" :disabled="carregando" class="btn-retirar">
          <span v-if="carregando" class="spinner"></span>
          <span v-else>
            <span class="icone-botao">🎟️</span>
            Retirar Senha
          </span>
        </button>

        <div v-if="erro" class="alerta-erro">
          ⚠️ {{ erro }}
        </div>
      </div>

      <!-- Com senha retirada - aguardando atendimento -->
      <div v-else-if="senhaRetirada && !senhaFinalizada" class="secao-sucesso">
        <div class="numero-senha">
          <div class="identificador">Sua senha</div>
          <div class="numero">{{ senhaRetirada.numero }}</div>
          <div class="tipo-badge" :class="senhaRetirada.tipo">
            {{ senhaRetirada.tipo === 'prioritario' ? '⭐ Prioritário' : '👤 Normal' }}
          </div>
        </div>

        <!-- Status chamando -->
        <div v-if="senhaRetirada.status === 'chamando'" class="status-chamando">
          <span class="icone-status">📢</span>
          <span class="texto-status">Sua senha está sendo chamada! Dirija-se ao atendimento.</span>
        </div>

        <!-- Resumo da previsão -->
        <div class="previsao-resumo" :class="senhaRetirada.tipo">
          <div class="previsao-linha">
            <span class="previsao-icone">👥</span>
            <span class="previsao-texto">{{ senhaRetirada.pessoasNaFrente }} {{ senhaRetirada.pessoasNaFrente === 1 ? 'senha na frente' : 'senhas na frente' }}</span>
          </div>
          <div class="previsao-linha">
            <span class="previsao-icone">⏱️</span>
            <span class="previsao-texto">Tempo estimado: <strong>{{ senhaRetirada.tempoEstimadoMinutos || tempoEstimado }} min</strong></span>
          </div>
          <div class="previsao-linha destaque">
            <span class="previsao-icone">🕐</span>
            <span class="previsao-texto">Previsão de chamada: <strong>{{ horarioPrevisao }}</strong></span>
          </div>
        </div>

        <!-- Código de verificação -->
        <div class="secao-codigo">
          <h3>🔐 Código de Verificação</h3>
          <div class="codigo-verificacao">
            <span class="texto-codigo">{{ senhaRetirada.codigo_verificacao }}</span>
          </div>
          <p class="descricao-codigo">Guarde este código para comprovar sua senha</p>
        </div>

        <div class="instrucoes">
          <h3>📌 Instruções:</h3>
          <ul>
            <li>🎟️ Guarde seu número de senha e código de verificação</li>
            <li>📺 Acompanhe o painel de chamadas</li>
            <li>🚶 Compareça quando sua senha for chamada</li>
          </ul>
        </div>
      </div>

      <!-- Senha finalizada -->
      <div v-else class="secao-finalizada">
        <div class="mensagem-finalizada">
          <span class="icone-finalizada">✅</span>
          <h2>Atendimento Finalizado!</h2>
          <p>Seu atendimento foi concluído com sucesso.</p>
          <p class="subtitulo-finalizada">Você pode retirar uma nova senha se necessário.</p>
        </div>
        <button @click="voltarParaRetirar" class="btn-retirar">
          <span class="icone-botao">🎟️</span>
          Retirar Nova Senha
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const tipo = ref('normal')
const carregando = ref(false)
const carregandoLogin = ref(false)
const erro = ref('')
const senhaRetirada = ref(null)
const tempoEstimado = ref(15)
const horario = ref('')
const deviceId = ref('')
const senhaFinalizada = ref(false)

let intervaloMinhaSenha = null

const carregarEstadoSalvo = () => {
  const salva = localStorage.getItem('senhaRetirada')
  if (salva) {
    try {
      senhaRetirada.value = JSON.parse(salva)
      horario.value = localStorage.getItem('horario') || new Date().toLocaleTimeString('pt-BR')
    } catch (e) {
      console.error('Erro ao carregar estado salvo:', e)
    }
  }
  deviceId.value = localStorage.getItem('deviceId') || ''
}

const salvarEstado = () => {
  if (senhaRetirada.value) {
    localStorage.setItem('senhaRetirada', JSON.stringify(senhaRetirada.value))
    localStorage.setItem('horario', horario.value)
  }
}

const limparEstadoSenha = () => {
  senhaRetirada.value = null
  senhaFinalizada.value = false
  horario.value = ''
  localStorage.removeItem('senhaRetirada')
  localStorage.removeItem('horario')
}

const voltarParaRetirar = () => {
  limparEstadoSenha()
}

const horarioPrevisao = computed(() => {
  if (!senhaRetirada.value) return '--:--'
  const agora = new Date()
  const minutos = senhaRetirada.value.tempoEstimadoMinutos ||
                  (senhaRetirada.value.pessoasNaFrente || 0) * 5
  agora.setMinutes(agora.getMinutes() + minutos)
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
})

const verificarMinhaSenha = async () => {
  if (!deviceId.value || !senhaRetirada.value) return

  try {
    const resposta = await axios.get(`/api/minha-senha/publica?deviceId=${deviceId.value}`)

    if (resposta.data && resposta.data.mensagem === 'Nenhuma senha ativa encontrada') {
      senhaFinalizada.value = true
      if (intervaloMinhaSenha) {
        clearInterval(intervaloMinhaSenha)
        intervaloMinhaSenha = null
      }
      setTimeout(() => {
        limparEstadoSenha()
      }, 5000)
    } else if (resposta.data && resposta.data.numero) {
      senhaRetirada.value = {
        ...senhaRetirada.value,
        status: resposta.data.status,
        pessoasNaFrente: resposta.data.pessoasNaFrente,
        tempoEstimadoMinutos: resposta.data.tempoEstimadoMinutos
      }
      tempoEstimado.value = resposta.data.tempoEstimadoMinutos ||
                            (resposta.data.pessoasNaFrente || 0) * 5
      salvarEstado()
    }
  } catch (error) {
    console.log('Não foi possível verificar status da senha')
  }
}

const iniciarPollingSenha = () => {
  if (intervaloMinhaSenha) clearInterval(intervaloMinhaSenha)
  intervaloMinhaSenha = setInterval(verificarMinhaSenha, 5000)
}

onMounted(() => {
  carregarEstadoSalvo()
  if (senhaRetirada.value) {
    iniciarPollingSenha()
  }
})

onBeforeUnmount(() => {
  salvarEstado()
  if (intervaloMinhaSenha) clearInterval(intervaloMinhaSenha)
})

const retirarSenha = async () => {
  carregando.value = true
  erro.value = ''

  try {
    if (!deviceId.value) {
      deviceId.value = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
      localStorage.setItem('deviceId', deviceId.value)
    }

    const resposta = await axios.post('/api/senha/publica',
      { tipo: tipo.value, deviceId: deviceId.value }
    )

    senhaRetirada.value = resposta.data
    horario.value = new Date().toLocaleTimeString('pt-BR')
    tempoEstimado.value = resposta.data.tempoEstimadoMinutos ||
                          (resposta.data.pessoasNaFrente || 0) * 5

    salvarEstado()
    iniciarPollingSenha()

  } catch (error) {
    console.error('Erro:', error)
    erro.value = error.response?.data?.erro || 'Erro ao retirar senha. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

const loginComGoogle = async () => {
  carregandoLogin.value = true
  erro.value = ''

  try {
    // Redirecionar para o login do Google
    window.location.href = '/auth/google'
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error)
    erro.value = 'Erro ao fazer login com Google. Tente novamente.'
  } finally {
    carregandoLogin.value = false
  }
}
</script>

<style scoped>
.container-tela {
  min-height: 100vh;
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.card-principal {
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 640px;
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
}

.icone-senha {
  font-size: 2.5rem;
}

.cabecalho h1 {
  font-size: 2rem;
  margin: 0;
  color: #263A4D;
  font-weight: 700;
}

.subtitulo {
  margin: 8px 0 0;
  color: #4F789E;
  font-size: 1rem;
}

.login-section {
  margin-top: 20px;
}

.btn-google {
  width: 100%;
  padding: 16px;
  background: white;
  color: #4285F4;
  border: 2px solid #4285F4;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-google:hover:not(:disabled) {
  background: #4285F4;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(66, 133, 244, 0.4);
}

.btn-google:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.icone-google {
  font-size: 1.2rem;
}

.secao-formulario h2 {
  font-size: 1.2rem;
  margin: 0 0 24px;
  color: #3B5975;
  text-align: center;
  font-weight: 600;
}

.opcoes-tipo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.opcao-tipo {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #75B1EB;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f9fe;
}

.opcao-tipo:hover {
  border-color: #75B1EB;
  background: #e8f2fb;
}

.opcao-tipo.selecionado {
  border-color: #6397C7;
  background: #e0edf7;
}

.opcao-tipo input {
  margin-right: 14px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  accent-color: #75B1EB;
}

.conteudo-opcao {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icone-opcao {
  font-size: 2rem;
  flex-shrink: 0;
}

.texto-opcao {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.titulo-opcao {
  font-weight: 600;
  color: #3B5975;
  font-size: 1rem;
}

.descricao-opcao {
  color: #4F789E;
  font-size: 0.85rem;
}

.btn-retirar {
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

.btn-retirar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(117, 177, 235, 0.4);
}

.btn-retirar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.icone-botao {
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

.alerta-erro {
  margin-top: 16px;
  padding: 14px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 10px;
  text-align: center;
  font-size: 0.9rem;
  border: 1px solid #fca5a5;
}

/* Seção de sucesso */
.secao-sucesso {
  text-align: center;
}

.numero-senha {
  margin-bottom: 28px;
}

.identificador {
  font-size: 0.9rem;
  color: #4F789E;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.numero {
  font-size: 5.5rem;
  font-weight: 800;
  color: #3B5975;
  line-height: 1;
  padding: 32px;
  background: linear-gradient(135deg, #e8f2fb 0%, #d6e7f7 100%);
  border-radius: 20px;
  border: 3px solid #6397C7;
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

/* Status chamando */
.status-chamando {
  background: linear-gradient(135deg, #fef7e0 0%, #fcecb8 100%);
  padding: 16px 24px;
  border-radius: 14px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  animation: pulse-status 1.5s infinite;
}

@keyframes pulse-status {
  0%, 100% { box-shadow: 0 0 0 0 rgba(235, 190, 117, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(235, 190, 117, 0); }
}

.icone-status {
  font-size: 2rem;
}

.texto-status {
  font-size: 1.1rem;
  font-weight: 700;
  color: #8a6b1e;
}

/* Resumo da previsão - card único com todas as informações */
.previsao-resumo {
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 28px;
  text-align: left;
}

.previsao-resumo.normal {
  background: linear-gradient(135deg, #d6e7f7 0%, #b5d5f0 100%);
  border: 2px solid #6397C7;
}

.previsao-resumo.prioritario {
  background: linear-gradient(135deg, #fef7e0 0%, #fcecb8 100%);
  border: 2px solid #EBBE75;
}

.previsao-linha {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.previsao-linha + .previsao-linha {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.previsao-linha.destaque {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 2px solid rgba(0, 0, 0, 0.12);
}

.previsao-icone {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.previsao-texto {
  font-size: 0.95rem;
  font-weight: 500;
}

.previsao-resumo.normal .previsao-texto {
  color: #3B5975;
}

.previsao-resumo.prioritario .previsao-texto {
  color: #8a6b1e;
}

/* Código de verificação */
.secao-codigo {
  background: linear-gradient(135deg, #fef7e0 0%, #fcecb8 100%);
  padding: 20px;
  border-radius: 14px;
  margin-bottom: 28px;
  text-align: center;
}

.secao-codigo h3 {
  margin: 0 0 12px;
  color: #8a6b1e;
  font-size: 1rem;
}

.codigo-verificacao {
  margin-bottom: 8px;
}

.texto-codigo {
  font-size: 2rem;
  font-weight: 800;
  color: #5a4510;
  letter-spacing: 4px;
  font-family: monospace;
  background: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
  border: 2px dashed #EBBE75;
}

.descricao-codigo {
  margin: 0;
  color: #8a6b1e;
  font-size: 0.85rem;
}

.instrucoes {
  background: #f0f6fc;
  padding: 20px;
  border-radius: 14px;
  text-align: left;
}

.instrucoes h3 {
  margin: 0 0 12px;
  color: #3B5975;
  font-size: 1rem;
}

.instrucoes ul {
  margin: 0;
  padding-left: 20px;
}

.instrucoes li {
  margin: 8px 0;
  color: #4F789E;
  font-size: 0.9rem;
}

/* Seção finalizada */
.secao-finalizada {
  text-align: center;
}

.mensagem-finalizada {
  margin-bottom: 32px;
}

.icone-finalizada {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}

.mensagem-finalizada h2 {
  font-size: 1.8rem;
  color: #6bbf4a;
  margin: 0 0 12px;
  font-weight: 700;
}

.mensagem-finalizada p {
  font-size: 1.1rem;
  color: #3B5975;
  margin: 0 0 8px;
}

.subtitulo-finalizada {
  color: #4F789E !important;
  font-size: 0.95rem !important;
}

@media (max-width: 640px) {
  .card-principal {
    padding: 28px;
  }

  .cabecalho h1 {
    font-size: 1.5rem;
  }

  .numero {
    font-size: 3.5rem;
    padding: 24px;
  }

  .texto-codigo {
    font-size: 1.5rem;
    letter-spacing: 2px;
  }

  .status-chamando {
    flex-direction: column;
    padding: 12px;
  }
}
</style>