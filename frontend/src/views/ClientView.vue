<template>
  <div class="client-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="icone-senha">👤</span>
          <h1>Área do Cliente</h1>
        </div>
        <div class="user-info">
          <div class="user-profile">
            <img 
              v-if="authStore.user?.foto" 
              :src="authStore.user.foto" 
              :alt="authStore.user?.nome || 'Foto do usuário'"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              <span class="avatar-icon">👤</span>
            </div>
            <div class="user-details">
              <span class="user-name">{{ authStore.user?.nome || 'Usuário' }}</span>
              <span v-if="authStore.user?.email" class="user-email">{{ authStore.user.email }}</span>
            </div>
          </div>
          <button @click="logout" class="btn-logout">Sair</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="card-principal">
        <!-- Modo: Senha existente passada do TicketView (apenas para segundo caminho) -->
        <div v-if="senhaExistente && !senhaDoSistema" class="secao-senha-existente">
          <div class="mensagem-senha-existente">
            <span class="icone-senha-existente">🎟️</span>
            <h2>Você já tem uma senha em andamento!</h2>
            <p>Seu número de senha é: <strong>{{ senhaExistente.numero }}</strong></p>
            <p>Continue aguardando o atendimento.</p>
          </div>
          
          <div class="detalhes-senha">
            <div class="numero-senha">
              <div class="identificador">Sua senha</div>
              <div class="numero">{{ senhaExistente.numero }}</div>
              <div class="tipo-badge" :class="senhaExistente.tipo">
                {{ senhaExistente.tipo === 'prioritario' ? '⭐ Prioritário' : '👤 Normal' }}
              </div>
            </div>

            <!-- Status chamando -->
            <div v-if="senhaExistente.status === 'chamando'" class="status-chamando">
              <span class="icone-status">📢</span>
              <span class="texto-status">Sua senha está sendo chamada! Dirija-se ao atendimento.</span>
            </div>

            <!-- Resumo da previsão -->
            <div class="previsao-resumo" :class="senhaExistente.tipo">
              <div class="previsao-linha">
                <span class="previsao-icone">👥</span>
                <span class="previsao-texto">{{ senhaExistente.pessoasNaFrente }} {{ senhaExistente.pessoasNaFrente === 1 ? 'senha na frente' : 'senhas na frente' }}</span>
              </div>
              <div class="previsao-linha">
                <span class="previsao-icone">⏱️</span>
                <span class="previsao-texto">Tempo estimado: <strong>{{ senhaExistente.tempoEstimadoMinutos || 0 }} min</strong></span>
              </div>
              <div class="previsao-linha destaque">
                <span class="previsao-icone">🕐</span>
                <span class="previsao-texto">Previsão de chamada: <strong>{{ calcularHorarioEstimado(senhaExistente) }}</strong></span>
              </div>
            </div>

            <!-- Código de verificação -->
            <div class="secao-codigo">
              <h3>🔐 Código de Verificação</h3>
              <div class="codigo-verificacao">
                <span class="texto-codigo">{{ senhaExistente.codigo_verificacao }}</span>
              </div>
              <p class="descricao-codigo">Guarde este código para comprovar sua senha</p>
            </div>

            <div class="acoes-senha">
              <button 
                @click="cancelarSenhaExistente" 
                :disabled="queueStore.loading || senhaExistente.status === 'chamando'"
                class="btn btn-danger"
              >
                ✗ Cancelar Senha
              </button>
            </div>
          </div>
        </div>

        <!-- Modo: Formulário para retirar nova senha (primeiro caminho) -->
        <div v-else-if="!senhaDoSistema" class="secao-formulario">
          <div class="mensagem-boas-vindas">
            <span class="icone-boas-vindas">👋</span>
            <h2>Bem-vindo, {{ authStore.user?.nome }}!</h2>
            <p>Escolha o tipo de atendimento para retirar sua senha.</p>
          </div>
          
          <h2>Escolha o tipo de atendimento:</h2>

          <div class="opcoes-tipo">
            <label class="opcao-tipo" :class="{ selecionado: tipoSelecionado === 'normal' }">
              <input v-model="tipoSelecionado" type="radio" value="normal" />
              <div class="conteudo-opcao">
                <span class="icone-opcao">👤</span>
                <div class="texto-opcao">
                  <span class="titulo-opcao">Atendimento Normal</span>
                  <span class="descricao-opcao">Fila padrão</span>
                </div>
              </div>
            </label>

            <label class="opcao-tipo" :class="{ selecionado: tipoSelecionado === 'prioritario' }">
              <input v-model="tipoSelecionado" type="radio" value="prioritario" />
              <div class="conteudo-opcao">
                <span class="icone-opcao">♿</span>
                <div class="texto-opcao">
                  <span class="titulo-opcao">Atendimento Prioritário</span>
                  <span class="descricao-opcao">Idosos, gestantes, PCD</span>
                </div>
              </div>
            </label>
          </div>

          <button @click="criarSenha" :disabled="queueStore.loading" class="btn-retirar">
            <span v-if="queueStore.loading" class="spinner"></span>
            <span v-else>
              <span class="icone-botao">🎟️</span>
              Retirar Senha
            </span>
          </button>

          <div v-if="queueStore.error" class="alerta-erro">
            ⚠️ {{ queueStore.error }}
          </div>
        </div>

        <!-- Com senha ativa do sistema -->
        <div v-else class="secao-sucesso">
          <div class="numero-senha">
            <div class="identificador">Sua senha</div>
            <div class="numero">{{ senhaDoSistema.numero }}</div>
            <div class="tipo-badge" :class="senhaDoSistema.tipo">
              {{ senhaDoSistema.tipo === 'prioritario' ? '⭐ Prioritário' : '👤 Normal' }}
            </div>
          </div>

          <!-- Status chamando -->
          <div v-if="senhaDoSistema.status === 'chamando'" class="status-chamando">
            <span class="icone-status">📢</span>
            <span class="texto-status">Sua senha está sendo chamada! Dirija-se ao atendimento.</span>
          </div>

          <!-- Resumo da previsão -->
          <div class="previsao-resumo" :class="senhaDoSistema.tipo">
            <div class="previsao-linha">
              <span class="previsao-icone">👥</span>
              <span class="previsao-texto">{{ senhaDoSistema.pessoasNaFrente || 0 }} {{ (senhaDoSistema.pessoasNaFrente || 0) === 1 ? 'pessoa na frente' : 'pessoas na frente' }}</span>
            </div>
            <div class="previsao-linha">
              <span class="previsao-icone">⏱️</span>
              <span class="previsao-texto">Tempo estimado: <strong>{{ senhaDoSistema.tempoEstimadoMinutos || 0 }} min</strong></span>
            </div>
            <div class="previsao-linha destaque">
              <span class="previsao-icone">🕐</span>
              <span class="previsao-texto">Previsão de chamada: <strong>{{ calcularHorarioEstimado(senhaDoSistema) }}</strong></span>
            </div>
          </div>

          <!-- Código de verificação -->
          <div class="secao-codigo">
            <h3>🔐 Código de Verificação</h3>
            <div class="codigo-verificacao">
              <span class="texto-codigo">{{ senhaDoSistema.codigo_verificacao }}</span>
            </div>
            <p class="descricao-codigo">Guarde este código para comprovar sua senha</p>
          </div>

          <button 
            @click="cancelarSenha" 
            :disabled="queueStore.loading || senhaDoSistema.status === 'chamando'"
            class="btn btn-danger"
          >
            ✗ Cancelar Senha
          </button>
        </div>

        <!-- Seção de Histórico de Senhas -->
        <div class="history-section">
          <h2>📋 Meu Histórico de Senhas</h2>
          <div v-if="queueStore.loading && !historico.length" class="loading">
            <p>Carregando histórico...</p>
          </div>
          <div v-else-if="historico.length === 0" class="empty-history">
            <p>Nenhuma senha no histórico</p>
          </div>
          <div v-else class="history-list">
            <div 
              v-for="senha in historico" 
              :key="senha.id" 
              class="history-item"
              :class="senha.status"
            >
              <div class="history-number">{{ senha.numero }}</div>
              <div class="history-details">
                <div class="history-type">{{ senha.tipo === 'prioritario' ? 'Prioritário' : 'Normal' }}</div>
                <div class="history-status">{{ getStatusLabel(senha.status) }}</div>
                <div class="history-date">{{ formatarData(senha.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'

const router = useRouter()
const authStore = useAuthStore()
const queueStore = useQueueStore()
const tipoSelecionado = ref('normal')
const historico = ref([])
const senhaExistente = ref(null)

// Computed para verificar se há senha do sistema
const senhaDoSistema = computed(() => {
  return queueStore.minhaSenha
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
      authStore.setAdmin(false) // Usuários do Google não são admin por padrão
      
      // Se houver senha passada do TicketView, armazená-la
      if (senha) {
        try {
          senhaExistente.value = JSON.parse(decodeURIComponent(senha))
          // Armazenar no localStorage para persistência
          localStorage.setItem('senhaExistente', JSON.stringify(senhaExistente.value))
        } catch (e) {
          console.error('Erro ao processar senha existente:', e)
        }
      }
      
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      return true
    } catch (error) {
      console.error('Erro ao processar login:', error)
      return false
    }
  }
  return false
}

onMounted(() => {
  // Verificar se é um callback do Google
  if (!processGoogleCallback()) {
    // Não é callback do Google, verificar se está logado
    if (!authStore.isLoggedIn) {
      // Não está logado, redirecionar para login
      router.push('/login')
      return
    }
  }
  
  // Verificar se há senha existente no localStorage
  const senhaSalva = localStorage.getItem('senhaExistente')
  if (senhaSalva) {
    try {
      senhaExistente.value = JSON.parse(senhaSalva)
    } catch (e) {
      console.error('Erro ao carregar senha salva:', e)
      localStorage.removeItem('senhaExistente')
    }
  }
  
  // Buscar senha ativa e histórico
  Promise.all([
    queueStore.fetchMinhaSenha(authStore.token),
    carregarHistorico()
  ])
})

const carregarHistorico = async () => {
  try {
    historico.value = await queueStore.fetchHistoricoSenhas(authStore.token)
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
  }
}

const criarSenha = async () => {
  try {
    await queueStore.criarSenha(tipoSelecionado.value, authStore.token)
    // Remover senha existente se houver
    if (senhaExistente.value) {
      senhaExistente.value = null
      localStorage.removeItem('senhaExistente')
    }
    // Recarregar histórico após criar nova senha
    await carregarHistorico()
  } catch (error) {
    // O erro já é tratado no store e exibido na interface
  }
}

const cancelarSenha = async () => {
  if (confirm('Tem certeza que deseja cancelar sua senha?')) {
    try {
      await queueStore.cancelarSenha(authStore.token)
      // Recarregar histórico após cancelar senha
      await carregarHistorico()
    } catch (error) {
      // O erro já é tratado no store e exibido na interface
    }
  }
}

const cancelarSenhaExistente = async () => {
  if (confirm('Tem certeza que deseja cancelar sua senha existente?')) {
    try {
      // Remover do localStorage
      localStorage.removeItem('senhaExistente')
      senhaExistente.value = null
      // Recarregar histórico
      await carregarHistorico()
    } catch (error) {
      console.error('Erro ao cancelar senha existente:', error)
    }
  }
}

const logout = () => {
  // Limpar senha existente ao fazer logout
  localStorage.removeItem('senhaExistente')
  senhaExistente.value = null
  authStore.logout()
}

const getStatusLabel = (status) => {
  const labels = {
    'esperando': '⏳ Esperando',
    'chamando': '📢 Sendo Chamado',
    'atendido': '✓ Atendido',
    'cancelado': '✗ Cancelado'
  }
  return labels[status] || status
}

const calcularHorarioEstimado = (senha) => {
  const tempoEstimado = senha?.tempoEstimadoMinutos || 0
  const agora = new Date()
  const horarioEstimado = new Date(agora.getTime() + tempoEstimado * 60000)
  
  return horarioEstimado.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatarData = (dataString) => {
  const data = new Date(dataString)
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.client-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #75B1EB 0%, #6397C7 100%);
  padding: 48px;
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

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #75B1EB;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f9fe;
  border: 2px solid #75B1EB;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 1.2rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: #3B5975;
  font-size: 0.95rem;
}

.user-email {
  font-size: 0.8rem;
  color: #4F789E;
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
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.card-principal {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 640px;
}

/* Seção de senha existente */
.secao-senha-existente {
  text-align: center;
  margin-bottom: 32px;
}

.mensagem-senha-existente {
  background: linear-gradient(135deg, #e8f2fb 0%, #d6e7f7 100%);
  padding: 24px;
  border-radius: 14px;
  margin-bottom: 28px;
  border: 2px solid #6397C7;
}

.icone-senha-existente {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
}

.mensagem-senha-existente h2 {
  font-size: 1.5rem;
  color: #3B5975;
  margin: 0 0 12px;
  font-weight: 700;
}

.mensagem-senha-existente p {
  font-size: 1rem;
  color: #4F789E;
  margin: 0 0 8px;
}

.detalhes-senha {
  text-align: center;
}

/* Seção de formulário com boas-vindas */
.secao-formulario {
  text-align: center;
  margin-bottom: 32px;
}

.mensagem-boas-vindas {
  background: linear-gradient(135deg, #e8f2fb 0%, #d6e7f7 100%);
  padding: 24px;
  border-radius: 14px;
  margin-bottom: 28px;
  border: 2px solid #6397C7;
}

.icone-boas-vindas {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
}

.mensagem-boas-vindas h2 {
  font-size: 1.5rem;
  color: #3B5975;
  margin: 0 0 12px;
  font-weight: 700;
}

.mensagem-boas-vindas p {
  font-size: 1rem;
  color: #4F789E;
  margin: 0 0 8px;
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

/* Botões de ação */
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

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.acoes-senha {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* Seção de Histórico */
.history-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #e0e0e0;
}

.history-section h2 {
  margin: 0 0 20px 0;
  color: #3B5975;
  font-size: 1.5rem;
  text-align: center;
}

.loading, .empty-history {
  text-align: center;
  color: #4F789E;
  padding: 20px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s;
}

.history-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-item.esperando {
  background: #f5f5f5;
  border-color: #9e9e9e;
}

.history-item.chamando {
  background: #fff0f0;
  border-color: #f5576c;
  animation: pulse 1.5s infinite;
}

.history-item.atendido {
  background: #f0fdf4;
  border-color: #10b981;
}

.history-item.cancelado {
  background: #fef3c7;
  border-color: #d97706;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.history-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3B5975;
  margin-right: 15px;
  min-width: 60px;
  text-align: center;
}

.history-details {
  flex: 1;
}

.history-type {
  font-weight: 600;
  color: #3B5975;
  margin-bottom: 5px;
}

.history-status {
  color: #4F789E;
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.history-date {
  color: #6b7280;
  font-size: 0.8rem;
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

/* Responsivo */
@media (max-width: 640px) {
  .client-container {
    padding: 20px;
  }

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

  .history-list {
    max-height: 250px;
  }
}
</style>