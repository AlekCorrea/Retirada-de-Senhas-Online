<template>
  <div class="admin-container">
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
        <div v-else class="filas-grid">
          <section class="fila-card">
            <h3 class="fila-titulo">Para chamar</h3>
            <div v-if="filaPendenteOrdenada.length === 0" class="fila-vazia">Nenhuma senha pendente</div>
            <div v-else class="fila-lista">
              <div
                v-for="senha in filaPendenteOrdenada"
                :key="senha.id"
                class="fila-item"
                :class="{ 'item-chamando': senha.status === 'chamando' }"
              >
                <div class="item-avatar-circle" :class="senha.tipo">
                  {{ senha.tipo === 'prioritario' ? 'P' : 'N' }}
                </div>
                <div class="item-info">
                  <div class="item-tipo">{{ senha.tipo === 'prioritario' ? 'Preferencial' : 'Normal' }}</div>
                  <div class="item-numero">Senha: {{ senha.numero }}</div>
                </div>
                <div class="item-extra">
                  <span class="item-status" :class="'status-' + senha.status">{{ getStatusLabel(senha.status) }}</span>
                  <span class="item-data">{{ formatarData(senha.criado_em || senha.created_at) }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="fila-card">
            <h3 class="fila-titulo">Atendidas ou canceladas</h3>
            <div v-if="filaFinalizadaInvertida.length === 0" class="fila-vazia">Nenhuma senha finalizada</div>
            <div v-else class="fila-lista">
              <div
                v-for="senha in filaFinalizadaInvertida"
                :key="senha.id"
                class="fila-item"
                :class="{ 'item-cancelado': senha.status === 'cancelado' }"
              >
                <div class="item-avatar-circle" :class="senha.tipo">
                  {{ senha.tipo === 'prioritario' ? 'P' : 'N' }}
                </div>
                <div class="item-info">
                  <div class="item-tipo">{{ senha.tipo === 'prioritario' ? 'Preferencial' : 'Normal' }}</div>
                  <div class="item-numero">Senha: {{ senha.numero }}</div>
                </div>
                <div class="item-extra">
                  <span class="item-status" :class="'status-' + senha.status">{{ getStatusLabel(senha.status) }}</span>
                  <span class="item-data">{{ formatarData(senha.atualizado_em || senha.updated_at) }}</span>
                </div>
              </div>
            </div>
          </section>
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
        <div class="config-card">
          <div class="config-header">
            <div>
              <h3>Dias com atendimento</h3>
              <p>As senhas so serao entregues nos dias e horarios permitidos.</p>
            </div>
            <span class="config-status" :class="{ fechado: !atendimentoHoje }">
              {{ atendimentoHoje ? 'Atendimento liberado hoje' : 'Sem entrega hoje' }}
            </span>
          </div>

          <div class="dias-grid">
            <label v-for="dia in diasSemana" :key="dia.valor" class="dia-option" :class="{ checked: diasAtendimento.includes(dia.valor) }">
              <input
                type="checkbox"
                :value="dia.valor"
                v-model="diasAtendimento"
              />
              <span>{{ dia.label }}</span>
            </label>
          </div>

          <div class="horarios-grid">
            <div class="horario-field">
              <label>Inicio da entrega de senhas</label>
              <input v-model="horaInicioEntrega" type="time" class="tbl-input" />
            </div>
            <div class="horario-field">
              <label>Inicio dos atendimentos</label>
              <input v-model="horaInicioAtendimento" type="time" class="tbl-input" />
            </div>
            <div class="horario-field">
              <label>Fim dos atendimentos</label>
              <input v-model="horaFimAtendimento" type="time" class="tbl-input" />
            </div>
            <div class="horario-field">
              <label>Tempo medio por atendimento (min)</label>
              <input v-model.number="tempoMedioAtendimentoMinutos" type="number" min="1" step="0.5" class="tbl-input" />
            </div>
          </div>

          <div class="tempo-efetivo-info">
            <span>Atendentes online: <strong>{{ atendentesLogados }}</strong></span>
            <span>Tempo usado na previsao: <strong>{{ tempoMedioEfetivoFormatado }} min</strong></span>
          </div>

          <div class="config-actions">
            <button @click="fetchConfigAtendimento" class="btn-secondary" :disabled="configLoading">
              Atualizar
            </button>
            <button @click="salvarConfigAtendimento" class="btn-primary btn-config" :disabled="configLoading">
              {{ configLoading ? 'Salvando...' : 'Salvar configuracoes' }}
            </button>
          </div>

          <div v-if="configMensagem" class="config-message" :class="{ erro: configErro }">
            {{ configMensagem }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue'
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
const diasAtendimento = ref([0, 1, 2, 3, 4, 5, 6])
const diaAtualAtendimento = ref(new Date().getDay())
const horaInicioEntrega = ref('08:00')
const horaInicioAtendimento = ref('08:00')
const horaFimAtendimento = ref('18:00')
const tempoMedioAtendimentoMinutos = ref(5)
const atendentesLogados = ref(0)
const tempoMedioEfetivoMinutos = ref(5)
const configLoading = ref(false)
const configMensagem = ref('')
const configErro = ref(false)

const diasSemana = [
  { valor: 0, label: 'Domingo' },
  { valor: 1, label: 'Segunda' },
  { valor: 2, label: 'Terca' },
  { valor: 3, label: 'Quarta' },
  { valor: 4, label: 'Quinta' },
  { valor: 5, label: 'Sexta' },
  { valor: 6, label: 'Sabado' }
]

const atendimentoHoje = computed(() => diasAtendimento.value.includes(diaAtualAtendimento.value))
const tempoMedioEfetivoFormatado = computed(() => Number(tempoMedioEfetivoMinutos.value || 5).toLocaleString('pt-BR', { maximumFractionDigits: 2 }))

const tabs = [
  { id: 'fila', label: 'Fila' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'config', label: 'Configurações' }
]

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

const filaPendente = computed(() => senhas.value.filter(s => s.status === 'esperando' || s.status === 'chamando'))
const filaPendenteOrdenada = computed(() => ordenarPorChamada([...filaPendente.value]))
const filaFinalizada = computed(() => senhas.value.filter(s => s.status === 'atendido' || s.status === 'cancelado'))
const filaFinalizadaInvertida = computed(() => [...filaFinalizada.value].reverse())

const formatarData = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

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

const fetchConfigAtendimento = async () => {
  configLoading.value = true
  configMensagem.value = ''
  configErro.value = false
  try {
    const r = await axios.get('/api/config/atendimento', { headers: { Authorization: `Bearer ${authStore.token}` } })
    diasAtendimento.value = Array.isArray(r.data?.diasAtendimento) ? r.data.diasAtendimento : [0, 1, 2, 3, 4, 5, 6]
    diaAtualAtendimento.value = Number.isInteger(r.data?.diaAtual) ? r.data.diaAtual : new Date().getDay()
    horaInicioEntrega.value = r.data?.horaInicioEntrega || '08:00'
    horaInicioAtendimento.value = r.data?.horaInicioAtendimento || '08:00'
    horaFimAtendimento.value = r.data?.horaFimAtendimento || '18:00'
    tempoMedioAtendimentoMinutos.value = Number(r.data?.tempoMedioAtendimentoMinutos) || 5
    atendentesLogados.value = Number(r.data?.atendentesLogados) || 0
    tempoMedioEfetivoMinutos.value = Number(r.data?.tempoMedioEfetivoMinutos) || tempoMedioAtendimentoMinutos.value
  } catch (e) {
    configErro.value = true
    configMensagem.value = 'Erro ao carregar configuracoes.'
  } finally {
    configLoading.value = false
  }
}

const salvarConfigAtendimento = async () => {
  configLoading.value = true
  configMensagem.value = ''
  configErro.value = false
  try {
    const diasOrdenados = [...diasAtendimento.value].sort((a, b) => a - b)
    const r = await axios.put(
      '/api/config/atendimento',
      {
        diasAtendimento: diasOrdenados,
        horaInicioEntrega: horaInicioEntrega.value,
        horaInicioAtendimento: horaInicioAtendimento.value,
        horaFimAtendimento: horaFimAtendimento.value,
        tempoMedioAtendimentoMinutos: tempoMedioAtendimentoMinutos.value
      },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    )
    diasAtendimento.value = r.data?.diasAtendimento || diasOrdenados
    diaAtualAtendimento.value = Number.isInteger(r.data?.diaAtual) ? r.data.diaAtual : diaAtualAtendimento.value
    horaInicioEntrega.value = r.data?.horaInicioEntrega || horaInicioEntrega.value
    horaInicioAtendimento.value = r.data?.horaInicioAtendimento || horaInicioAtendimento.value
    horaFimAtendimento.value = r.data?.horaFimAtendimento || horaFimAtendimento.value
    tempoMedioAtendimentoMinutos.value = Number(r.data?.tempoMedioAtendimentoMinutos) || tempoMedioAtendimentoMinutos.value
    atendentesLogados.value = Number(r.data?.atendentesLogados) || atendentesLogados.value
    tempoMedioEfetivoMinutos.value = Number(r.data?.tempoMedioEfetivoMinutos) || tempoMedioAtendimentoMinutos.value
    configMensagem.value = 'Configuracoes salvas com sucesso.'
  } catch (e) {
    configErro.value = true
    configMensagem.value = e.response?.data?.erro || 'Erro ao salvar configuracoes.'
  } finally {
    configLoading.value = false
  }
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
  fetchConfigAtendimento()
  connect()
  joinAdmin()
  on('queue-updated', fetchQueueData)
  on('queue-stats-updated', fetchQueueData)
  on('attendants-online-updated', fetchConfigAtendimento)
  on('attendance-config-updated', fetchConfigAtendimento)
})

onUnmounted(() => {
  off('queue-updated', fetchQueueData)
  off('queue-stats-updated', fetchQueueData)
  off('attendants-online-updated', fetchConfigAtendimento)
  off('attendance-config-updated', fetchConfigAtendimento)
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

/* Filas */
.filas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.fila-card {
  min-height: 300px;
  background: rgba(255,255,255,0.35);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(0,0,0,0.08);
}

.fila-titulo {
  font-family: 'Inter', sans-serif;
  font-size: 1.4rem;
  font-weight: 400;
  color: #000;
  margin: 0 0 20px;
}

.fila-vazia {
  color: #555;
  padding: 20px 0;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
}

.fila-lista {
  display: flex;
  flex-direction: column;
}

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

.item-avatar-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 700;
}

.item-avatar-circle.prioritario { background: #ef4444; }

.item-info {
  flex: 1;
  min-width: 0;
}

.item-tipo {
  font-size: 1rem;
  font-weight: 400;
  color: #000;
  font-family: 'Inter', sans-serif;
}

.item-numero {
  display: inline-block;
  background: #FFE2C5;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 0.8rem;
  color: #000;
  font-family: 'Inter', sans-serif;
  margin-top: 4px;
}

.item-extra {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  white-space: nowrap;
}

.item-status {
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  background: rgba(0,0,0,0.08);
  color: #555;
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
.config-card {
  background: rgba(255,255,255,0.5);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0,0,0,0.1);
  font-family: 'Inter', sans-serif;
}

.config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.config-header h3 {
  margin: 0 0 6px;
  font-size: 1.1rem;
  color: #000;
}

.config-header p {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
}

.config-status {
  flex-shrink: 0;
  background: #D8FFDE;
  color: #065f46;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
}

.config-status.fechado {
  background: #fee2e2;
  color: #991b1b;
}

.dias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.dia-option {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.dia-option.checked {
  border-color: #0C56DA;
  background: #e8efff;
  box-shadow: 0 0 0 3px rgba(12,86,218,0.1);
}

.dia-option input {
  width: 18px;
  height: 18px;
  accent-color: #0C56DA;
}

.dia-option span {
  color: #000;
  font-size: 0.95rem;
}

.horarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0,0,0,0.1);
}

.horario-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.horario-field label {
  color: #000;
  font-size: 0.9rem;
  font-weight: 600;
}

.tempo-efetivo-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  color: #1f2937;
  font-size: 0.95rem;
}

.tempo-efetivo-info span {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 10px 12px;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-config {
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.btn-config:disabled,
.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.config-message {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #D8FFDE;
  color: #065f46;
  font-size: 0.95rem;
}

.config-message.erro {
  background: #fee2e2;
  color: #991b1b;
}

/* Tab content */
.tab-content { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .topbar { margin: 16px 16px 0; width: calc(100% - 32px); padding: 16px 20px; }
  .card-principal { margin: 16px; width: calc(100% - 32px); padding: 20px; }
  .tabs { flex-wrap: wrap; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .filas-grid { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .topbar-title { font-size: 1.2rem; }
  .tabs { gap: 8px; }
  .tab-btn { padding: 10px 20px; font-size: 1rem; }
  .config-header { flex-direction: column; }
  .config-status { width: 100%; text-align: center; }
  .config-actions { flex-direction: column; }
  .config-actions .btn-secondary,
  .config-actions .btn-config { width: 100%; }
}
</style>
