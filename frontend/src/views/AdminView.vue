<template>
  <div class="admin-container">
    <!-- Header Moderno -->
    <header class="admin-header">
      <div class="header-content">
        <div class="header-title">
          <h1>⚙️ Painel Administrativo</h1>
          <p>Bem-vindo, {{ authStore.user?.nome || 'Administrador' }}</p>
        </div>
        <button @click="logout" class="btn btn-logout">
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </header>

    <!-- Abas Modernas -->
    <nav class="admin-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="{active: activeTab === tab.id}" 
        @click="activeTab = tab.id"
        class="tab-btn"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-text">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- Conteúdo Principal -->
    <main class="admin-content">
      <!-- Fila Tab -->
      <section v-if="activeTab === 'fila'" class="tab-content">
        <!-- Status da Fila -->
        <section class="queue-stats" v-if="queueStats">
          <h2>Status da Fila</h2>
          <div class="stats-grid">
            <div class="stat-card total">
              <div class="stat-icon">📊</div>
              <div class="stat-value">{{ queueStats.total }}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-card waiting">
              <div class="stat-icon">⏳</div>
              <div class="stat-value">{{ queueStats.esperando }}</div>
              <div class="stat-label">Pendentes</div>
            </div>
            <div class="stat-card calling">
              <div class="stat-icon">📢</div>
              <div class="stat-value">{{ queueStats.chamando }}</div>
              <div class="stat-label">Em Atendimento</div>
            </div>
            <div class="stat-card attended">
              <div class="stat-icon">✓</div>
              <div class="stat-value">{{ queueStats.atendido }}</div>
              <div class="stat-label">Atendidos</div>
            </div>
            <div class="stat-card normal">
              <div class="stat-icon">🔵</div>
              <div class="stat-value">{{ queueStats.normais }}</div>
              <div class="stat-label">Normais</div>
            </div>
            <div class="stat-card priority">
              <div class="stat-icon">🔴</div>
              <div class="stat-value">{{ queueStats.prioritarias }}</div>
              <div class="stat-label">Prioritárias</div>
            </div>
          </div>
        </section>

        <!-- Lista de Senhas -->
        <section class="queue-list">
          <h2>Fila de Senhas</h2>
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Carregando...</p>
          </div>
          <div v-else-if="senhas.length === 0" class="empty">
            <p>📭 Nenhuma senha na fila</p>
          </div>
          <div v-else class="senhas-grid">
            <div v-for="senha in senhas" :key="senha.id" :class="['senha-card', senha.status]">
              <div class="senha-header">
                <div class="senha-numero">{{ senha.numero }}</div>
                <div class="senha-badge" :class="senha.tipo">
                  {{ senha.tipo === 'prioritario' ? 'P' : 'N' }}
                </div>
              </div>
              <div class="senha-info">
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value">{{ getStatusLabel(senha.status) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Código:</span>
                  <span class="info-value">{{ senha.codigo_verificacao }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <!-- Usuários Tab -->
      <section v-else-if="activeTab === 'usuarios'" class="tab-content">
        <section class="user-management">
          <div class="section-header">
            <h2>Gerenciamento de Usuários</h2>
            <button @click="fetchUsers" class="btn btn-refresh">
              <span>🔄</span>
              <span>Atualizar Lista</span>
            </button>
          </div>
          
          <!-- Tabela de Usuários -->
          <div class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Ativo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>
                    <input v-model="user.nome" class="form-control"/>
                  </td>
                  <td>
                    <input v-model="user.email" class="form-control"/>
                  </td>
                  <td>
                    <select v-model="user.perfil" class="form-control">
                      <option value="atendente">Atendente</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </td>
                  <td>
                    <span class="status-badge" :class="{ active: user.ativo }">
                      {{ user.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td>
                    <button @click="updateUser(user)" class="btn btn-sm btn-primary">
                      <span>💾</span>
                      <span>Salvar</span>
                    </button>
                    <button @click="deactivateUser(user.id)" class="btn btn-sm btn-danger">
                      <span>🚫</span>
                      <span>Desativar</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Formulário de Novo Usuário -->
          <div class="new-user-section">
            <h3>Adicionar Novo Usuário</h3>
            <form @submit.prevent="createUser" class="new-user-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Nome</label>
                  <input v-model="newUser.nome" required class="form-control"/>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input v-model="newUser.email" type="email" required class="form-control"/>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Senha</label>
                  <input v-model="newUser.senha" type="password" required class="form-control"/>
                </div>
                <div class="form-group">
                  <label>Perfil</label>
                  <select v-model="newUser.perfil" class="form-control">
                    <option value="atendente">Atendente</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="btn btn-success">
                <span>➕</span>
                <span>Criar Usuário</span>
              </button>
            </form>
          </div>
        </section>
      </section>

      <!-- Configurações Tab -->
      <section v-else class="tab-content">
        <section class="system-config">
          <h2>Configurações do Sistema</h2>
          <div class="config-placeholder">
            <p>🔧 Em breve será possível configurar parâmetros do sistema aqui.</p>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

// Estado local para estatísticas da fila e aba ativa
const queueStats = ref(null)
const senhas = ref([])
const loading = ref(false)
const activeTab = ref('fila')

// Estado e funções para gerenciamento de usuários
const users = ref([])
const newUser = ref({ nome: '', email: '', senha: '', perfil: 'atendente' })

// Definição das abas
const tabs = [
  { id: 'fila', label: 'Fila', icon: '📋' },
  { id: 'usuarios', label: 'Usuários', icon: '👥' },
  { id: 'config', label: 'Configurações', icon: '⚙️' }
]

const API_URL = '/api'

// Variável para armazenar o intervalo de atualização
let updateInterval = null

const fetchQueueData = async () => {
  loading.value = true
  try {
    // Buscar lista de senhas usando o endpoint de admin
    console.log('Iniciando busca de dados da fila...')
    const response = await axios.get(`${API_URL}/senhas`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    
    console.log('Resposta recebida:', response.data)
    
    // Processar os dados para calcular estatísticas
    const senhasData = response.data
    senhas.value = senhasData
    
    console.log('Senhas processadas:', senhasData)
    
    // Calcular estatísticas
    queueStats.value = {
      total: senhasData.length,
      esperando: senhasData.filter(s => s.status === 'esperando').length,
      chamando: senhasData.filter(s => s.status === 'chamando').length,
      atendido: senhasData.filter(s => s.status === 'atendido').length,
      normais: senhasData.filter(s => s.tipo === 'normal').length,
      prioritarias: senhasData.filter(s => s.tipo === 'prioritario').length
    }
    
    console.log('Estatísticas calculadas:', queueStats.value)
  } catch (e) {
    console.error('Erro ao buscar dados da fila:', e)
    if (e.response) {
      console.error('Status:', e.response.status)
      console.error('Dados:', e.response.data)
    }
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    users.value = response.data
  } catch (e) {
    console.error('Erro ao buscar usuários', e)
  }
}

const createUser = async () => {
  try {
    await axios.post(`${API_URL}/users`, newUser.value, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    await fetchUsers()
    // Resetar formulário
    newUser.value = { nome: '', email: '', senha: '', perfil: 'atendente' }
  } catch (e) {
    alert('Erro ao criar usuário: ' + (e.response?.data?.mensagem || e.message))
  }
}

const updateUser = async (user) => {
  try {
    const payload = { nome: user.nome, email: user.email, perfil: user.perfil }
    await axios.put(`${API_URL}/users/${user.id}`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    await fetchUsers()
  } catch (e) {
    alert('Erro ao atualizar usuário: ' + (e.response?.data?.mensagem || e.message))
  }
}

const deactivateUser = async (id) => {
  if (!confirm('Tem certeza que deseja desativar este usuário?')) return
  try {
    await axios.delete(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    await fetchUsers()
  } catch (e) {
    alert('Erro ao desativar usuário: ' + (e.response?.data?.mensagem || e.message))
  }
}

// Função para atualizar automaticamente a fila
const startAutoUpdate = () => {
  // Atualizar imediatamente
  fetchQueueData()
  
  // Configurar intervalo para atualização a cada 5 segundos
  updateInterval = setInterval(() => {
    fetchQueueData()
  }, 5000)
}

// Função para parar atualização automática
const stopAutoUpdate = () => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    router.push('/login')
    return
  }
  
  fetchUsers()
  startAutoUpdate()
})

onUnmounted(() => {
  // Limpar o intervalo quando o componente for desmontado
  stopAutoUpdate()
})

const logout = () => {
  authStore.logout()
  router.push('/')
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
</script>

<style>
/* Variáveis de Design - Padronizado com AtendenteView */
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
.admin-container {
  min-height: 100vh;
  background: var(--background-gradient);
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* Header Moderno */
.admin-header {
  background: var(--card-background);
  border-radius: var(--border-radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 640px;
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

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-danger {
  background: var(--danger-color);
  color: white;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-icon {
  font-size: 1.1em;
}

.btn-text {
  font-weight: 500;
}

/* Abas Modernas */
.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 1200px;
  animation: slideDown 0.6s ease-out;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.tab-btn.active {
  background: var(--card-background);
  color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.tab-icon {
  font-size: 1.2em;
}

/* Conteúdo Principal */
.admin-content {
  width: 100%;
  max-width: 1200px;
  animation: fadeIn 0.8s ease-out;
}

.tab-content {
  animation: fadeIn 0.5s ease-out;
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

/* Status da Fila */
.queue-stats h2 {
  margin-bottom: 20px;
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

.stat-card.cancelled {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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

/* Lista de Senhas */
.queue-list h2 {
  margin-bottom: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.senhas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.senha-card {
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.senha-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--border-color);
}

.senha-card.esperando {
  border-color: var(--warning-color);
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.senha-card.esperando::before {
  background: var(--warning-color);
}

.senha-card.chamando {
  border-color: var(--info-color);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.senha-card.chamando::before {
  background: var(--info-color);
}

.senha-card.atendido {
  border-color: var(--success-color);
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.senha-card.atendido::before {
  background: var(--success-color);
}

.senha-card.cancelado {
  border-color: var(--danger-color);
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.senha-card.cancelado::before {
  background: var(--danger-color);
}

.senha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.senha-numero {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  text-align: center;
}

.senha-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
}

.senha-badge.normal {
  background: var(--info-color);
}

.senha-badge.prioritario {
  background: var(--danger-color);
}

.senha-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

/* Gerenciamento de Usuários */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.users-table-container {
  overflow-x: auto;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin-bottom: 32px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-background);
}

.users-table th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

.users-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.users-table tr:hover {
  background: rgba(75, 85, 99, 0.05);
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: var(--transition);
  background: var(--card-background);
  color: var(--text-primary);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(117, 177, 235, 0.1);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--border-color);
  color: var(--text-secondary);
}

.status-badge.active {
  background: var(--success-color);
  color: white;
}

.new-user-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: var(--border-radius);
  padding: 24px;
  border: 1px solid var(--border-color);
}

.new-user-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

/* Configurações do Sistema */
.config-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: var(--border-radius);
  border: 2px dashed var(--border-color);
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
  .admin-container {
    padding: 20px;
  }

  .admin-header {
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

  .admin-tabs {
    margin-bottom: 16px;
  }

  .tab-btn {
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .admin-content {
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

  .senhas-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .senha-card {
    padding: 16px;
  }

  .senha-numero {
    font-size: 2rem;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .users-table-container {
    margin-bottom: 20px;
  }

  .users-table th,
  .users-table td {
    padding: 12px 8px;
    font-size: 0.85rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .btn-lg {
    padding: 10px 20px;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .admin-header h1 {
    font-size: 1.5rem;
  }

  .tab-btn {
    flex-direction: column;
    gap: 4px;
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

  .senha-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>