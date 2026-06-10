<template>
  <div class="admin-container">
    <!-- Header -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="avatar-circle"></div>
        <div class="topbar-info">
          <span class="topbar-title">Bem vindo ADM</span>
          <span class="topbar-sub">Gerencie o sistema</span>
        </div>
      </div>
      <button @click="logout" class="btn-sair">Sair</button>
    </header>

    <!-- Card principal -->
    <div class="card-principal">
      <!-- Tabs -->
      <nav class="tabs">
        <button v-for="tab in tabs" :key="tab.id" :class="['tab-btn', { active: activeTab === tab.id }]" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </nav>

      <!-- Aba Fila -->
      <div v-if="activeTab === 'fila'" class="tab-content">
        <h2 class="section-title">Status da fila</h2>

        <div class="stats-grid" v-if="queueStats">
          <div class="stat-card" style="background:#BDE8F5">
            <div class="stat-valor">{{ queueStats.total }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card" style="background:#FBE6D3">
            <div class="stat-valor">{{ queueStats.esperando }}</div>
            <div class="stat-label">Pendentes</div>
          </div>
          <div class="stat-card" style="background:#D9D9D9">
            <div class="stat-valor">{{ queueStats.chamando }}</div>
            <div class="stat-label">Em atendimento</div>
          </div>
          <div class="stat-card" style="background:#D8FFDE">
            <div class="stat-valor">{{ queueStats.atendido }}</div>
            <div class="stat-label">Atendidos</div>
          </div>
          <div class="stat-card" style="background:#4988C4">
            <div class="stat-valor" style="color:#fff">{{ queueStats.normais }}</div>
            <div class="stat-label" style="color:#fff">Normais</div>
          </div>
          <div class="stat-card" style="background:#CFD9FD">
            <div class="stat-valor">{{ queueStats.prioritarias }}</div>
            <div class="stat-label">Prioritárias</div>
          </div>
        </div>

        <div class="divider"></div>

        <h2 class="section-title">Fila de Senhas:</h2>
        <div v-if="loading" class="loading-state">Carregando...</div>
        <div v-else-if="senhas.length === 0" class="vazio-state">Nenhuma senha na fila</div>
        <div v-else class="senhas-grid">
          <div v-for="senha in senhas" :key="senha.id" class="senha-card" :class="'status-' + senha.status">
            <div class="senha-card-top" :class="'top-' + senha.status"></div>
            <div class="senha-numero-grande">{{ senha.numero }}</div>
            <div class="senha-meta">
              <span class="senha-status">Status: {{ getStatusLabel(senha.status) }}</span>
              <span class="senha-codigo">Código: {{ senha.codigo_verificacao }}</span>
            </div>
            <div class="senha-tipo-badge" :class="senha.tipo">
              {{ senha.tipo === 'prioritario' ? 'P' : 'N' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Aba Usuários -->
      <div v-else-if="activeTab === 'usuarios'" class="tab-content">
        <div class="section-header">
          <h2 class="section-title" style="margin:0">Gerenciamento de Usuários</h2>
          <button @click="fetchUsers" class="btn-secondary">🔄 Atualizar</button>
        </div>

        <div class="table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th><th>Nome</th><th>Email</th><th>Perfil</th><th>Ativo</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td><input v-model="user.nome" class="tbl-input" /></td>
                <td><input v-model="user.email" class="tbl-input" /></td>
                <td>
                  <select v-model="user.perfil" class="tbl-input">
                    <option value="atendente">Atendente</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </td>
                <td>
                  <span class="status-pill" :class="{ ativo: user.ativo }">{{ user.ativo ? 'Ativo' : 'Inativo' }}</span>
                </td>
                <td class="acoes-td">
                  <button @click="updateUser(user)" class="btn-sm btn-primary">💾 Salvar</button>
                  <button @click="deactivateUser(user.id)" class="btn-sm btn-danger">🚫</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="novo-usuario">
          <h3>Adicionar Novo Usuário</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Nome</label>
              <input v-model="newUser.nome" required class="tbl-input" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="newUser.email" type="email" required class="tbl-input" />
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input v-model="newUser.senha" type="password" required class="tbl-input" />
            </div>
            <div class="form-group">
              <label>Perfil</label>
              <select v-model="newUser.perfil" class="tbl-input">
                <option value="atendente">Atendente</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>
          <button @click="createUser" class="btn-primary">➕ Criar Usuário</button>
        </div>
      </div>

      <!-- Aba Configurações -->
      <div v-else class="tab-content">
        <h2 class="section-title">Configurações do Sistema</h2>
        <div class="config-placeholder">🔧 Em breve será possível configurar parâmetros do sistema aqui.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const { connect, joinAdmin, on, off } = useSocket()
const queueStats = ref(null)
const senhas = ref([])
const loading = ref(false)
const activeTab = ref('fila')
const users = ref([])
const newUser = ref({ nome: '', email: '', senha: '', perfil: 'atendente' })

const tabs = [
  { id: 'fila', label: 'Fila' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'config', label: 'Configurações' }
]

const fetchQueueData = async () => {
  loading.value = true
  try {
    const r = await axios.get('/api/senhas', { headers: { Authorization: `Bearer ${authStore.token}` } })
    const data = r.data
    senhas.value = data
    queueStats.value = {
      total: data.length,
      esperando: data.filter(s => s.status === 'esperando').length,
      chamando: data.filter(s => s.status === 'chamando').length,
      atendido: data.filter(s => s.status === 'atendido').length,
      normais: data.filter(s => s.tipo === 'normal').length,
      prioritarias: data.filter(s => s.tipo === 'prioritario').length
    }
  } catch (e) {} finally { loading.value = false }
}

const fetchUsers = async () => {
  try {
    const r = await axios.get('/api/users', { headers: { Authorization: `Bearer ${authStore.token}` } })
    users.value = r.data
  } catch (e) {}
}

const createUser = async () => {
  try {
    await axios.post('/api/users', newUser.value, { headers: { Authorization: `Bearer ${authStore.token}` } })
    await fetchUsers()
    newUser.value = { nome: '', email: '', senha: '', perfil: 'atendente' }
  } catch (e) { alert('Erro ao criar usuário: ' + (e.response?.data?.mensagem || e.message)) }
}

const updateUser = async (user) => {
  try {
    await axios.put(`/api/users/${user.id}`, { nome: user.nome, email: user.email, perfil: user.perfil }, { headers: { Authorization: `Bearer ${authStore.token}` } })
    await fetchUsers()
  } catch (e) { alert('Erro ao atualizar: ' + (e.response?.data?.mensagem || e.message)) }
}

const deactivateUser = async (id) => {
  if (!confirm('Desativar este usuário?')) return
  try {
    await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    await fetchUsers()
  } catch (e) { alert('Erro ao desativar: ' + (e.response?.data?.mensagem || e.message)) }
}

const getStatusLabel = (status) => ({ esperando: 'Esperando', chamando: 'Chamando', atendido: 'Atendida', cancelado: 'Cancelado' }[status] || status)

const logout = () => { authStore.logout(); router.push('/') }

onMounted(() => {
  if (!authStore.isLoggedIn || !authStore.isAdmin) { router.push('/login'); return }
  fetchUsers()
  fetchQueueData()
  connect()
  joinAdmin()
  on('queue-updated', fetchQueueData)
  on('queue-stats-updated', fetchQueueData)
})

onUnmounted(() => {
  off('queue-updated', fetchQueueData)
  off('queue-stats-updated', fetchQueueData)
})
</script>

<style scoped>
* { box-sizing: border-box; }

.admin-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #F0F3FC 0%, #8F9AD2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 40px;
}

/* Topbar */
.topbar {
  background: #F0F3FC;
  border-radius: 25px;
  margin: 24px 24px 0;
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  width: calc(100% - 48px);
  max-width: 1400px;
}

.topbar-left { display: flex; align-items: center; gap: 20px; }

.avatar-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: #8F9AD2;
  flex-shrink: 0;
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

/* Card principal */
.card-principal {
  background: #F0F3FC;
  border-radius: 25px;
  border: 1px solid #000;
  padding: 32px;
  width: calc(100% - 48px);
  max-width: 1400px;
  margin: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}

.tab-btn {
  background: #0C56DA;
  opacity: 0.7;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 14px 32px;
  font-size: 1.2rem;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active { opacity: 1; box-shadow: 0 4px 12px rgba(12,86,218,0.4); transform: translateY(-1px); }
.tab-btn:hover { opacity: 0.9; }

/* Seções */
.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.2rem;
  font-weight: 400;
  color: #000;
  margin: 0 0 16px;
}

.divider { border: none; border-top: 1px solid #000; margin: 28px 0; }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}

.stat-card {
  border-radius: 20px;
  padding: 24px 20px 16px;
  box-shadow: 10px 10px 4px rgba(0,0,0,0.25);
  text-align: center;
}

.stat-valor { font-size: 2.8rem; font-weight: 400; color: #000; font-family: 'Inter', sans-serif; line-height: 1; }
.stat-label { font-size: 1.2rem; color: #000; font-family: 'Inter', sans-serif; margin-top: 8px; }

/* Senhas grid */
.senhas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.senha-card {
  background: #D8FFDE;
  border-radius: 25px;
  padding: 0;
  overflow: hidden;
  box-shadow: 10px 10px 4px rgba(0,0,0,0.25);
  position: relative;
}

.senha-card-top {
  height: 12px;
  border-radius: 25px 25px 0 0;
  background: #8EFFA0;
}

.senha-card.status-esperando { background: #fef3c7; }
.senha-card.status-esperando .senha-card-top { background: #f59e0b; }
.senha-card.status-chamando { background: #dbeafe; }
.senha-card.status-chamando .senha-card-top { background: #3b82f6; }
.senha-card.status-cancelado { background: #fee2e2; }
.senha-card.status-cancelado .senha-card-top { background: #ef4444; }

.senha-numero-grande {
  font-family: 'Inter', sans-serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: #000;
  padding: 16px 20px 4px;
}

.senha-meta { padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 4px; }
.senha-status { font-size: 0.9rem; color: #000; font-family: 'Inter', sans-serif; }
.senha-codigo { font-size: 0.85rem; color: #555; font-family: 'Inter', sans-serif; }

.senha-tipo-badge {
  position: absolute;
  top: 20px;
  right: 16px;
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: #fff;
  background: #3b82f6;
}

.senha-tipo-badge.prioritario { background: #ef4444; }

.loading-state, .vazio-state { padding: 40px; text-align: center; color: #555; font-family: 'Inter', sans-serif; font-size: 1.1rem; }

/* Usuários */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

.table-wrap { overflow-x: auto; margin-bottom: 32px; border-radius: 12px; }

.users-table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; }

.users-table th {
  background: #f0f3fc;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  color: #000;
  border-bottom: 2px solid rgba(0,0,0,0.1);
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  vertical-align: middle;
}

.users-table tr:hover td { background: rgba(255,255,255,0.5); }

.tbl-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  background: #fff;
  color: #000;
  transition: border-color 0.2s;
}

.tbl-input:focus { outline: none; border-color: #0C56DA; box-shadow: 0 0 0 3px rgba(12,86,218,0.1); }

.status-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 500;
  background: rgba(0,0,0,0.1);
  color: #555;
}

.status-pill.ativo { background: #D8FFDE; color: #065f46; }

.acoes-td { display: flex; gap: 8px; align-items: center; }

.btn-sm {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}

.btn-sm:hover { transform: translateY(-1px); }

.btn-primary { background: #0C56DA; color: #fff; }
.btn-danger { background: #E93A32; color: #fff; }
.btn-secondary { background: #8F9AD2; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 0.9rem; cursor: pointer; font-family: 'Inter', sans-serif; }

/* Novo usuário */
.novo-usuario {
  background: rgba(255,255,255,0.5);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0,0,0,0.1);
}

.novo-usuario h3 { margin: 0 0 20px; font-family: 'Inter', sans-serif; font-size: 1.1rem; color: #000; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.9rem; font-weight: 600; color: #000; font-family: 'Inter', sans-serif; }

/* Config */
.config-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #555;
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  background: rgba(255,255,255,0.4);
  border-radius: 14px;
  border: 2px dashed rgba(0,0,0,0.15);
}

/* Tab content */
.tab-content { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .topbar { margin: 16px 16px 0; width: calc(100% - 32px); padding: 16px 20px; }
  .card-principal { margin: 16px; width: calc(100% - 32px); padding: 20px; }
  .tabs { flex-wrap: wrap; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .topbar-title { font-size: 1.2rem; }
  .tabs { gap: 8px; }
  .tab-btn { padding: 10px 20px; font-size: 1rem; }
  .senhas-grid { grid-template-columns: 1fr; }
}
</style>
