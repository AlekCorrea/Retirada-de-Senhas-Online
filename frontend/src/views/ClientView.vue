<template>
  <div class="client-container">
    <div class="client-card">
      <h1>📝 Gerenciar Minha Senha</h1>

      <div v-if="!queueStore.minhaSenha" class="no-ticket">
        <p>Você não possui uma senha ativa</p>
        
        <div class="ticket-type-selector">
          <h3>Selecione o tipo de atendimento:</h3>
          
          <label class="radio-option">
            <input v-model="tipoSelecionado" type="radio" value="normal" />
            <span>
              <strong>Atendimento Normal</strong>
              <small>Fila padrão</small>
            </span>
          </label>

          <label class="radio-option">
            <input v-model="tipoSelecionado" type="radio" value="prioritario" />
            <span>
              <strong>Atendimento Prioritário</strong>
              <small>Idosos, gestantes, PCD</small>
            </span>
          </label>
        </div>

        <button @click="criarSenha" :disabled="queueStore.loading" class="btn btn-success btn-lg">
          {{ queueStore.loading ? 'Criando...' : '✓ Retirar Senha' }}
        </button>
      </div>

      <div v-else class="ticket-info">
        <div class="ticket-display">
          <div class="ticket-number">{{ queueStore.minhaSenha.numero }}</div>
        </div>

        <div class="ticket-details">
          <div class="detail-row">
            <span class="label">Tipo:</span>
            <span class="value">{{ queueStore.minhaSenha.tipo === 'prioritario' ? 'Prioritário' : 'Normal' }}</span>
          </div>

          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value" :class="queueStore.minhaSenha.status">
              {{ getStatusLabel(queueStore.minhaSenha.status) }}
            </span>
          </div>

          <div class="detail-row">
            <span class="label">Posição na fila:</span>
            <span class="value">{{ queueStore.minhaSenha.pessoasNaFrente || 0 }}</span>
          </div>

          <div class="detail-row">
            <span class="label">Tempo estimado:</span>
            <span class="value">{{ queueStore.minhaSenha.tempoEstimadoMinutos || 0 }} min</span>
          </div>
        </div>

        <button 
          @click="cancelarSenha" 
          :disabled="queueStore.loading || queueStore.minhaSenha.status === 'chamando'"
          class="btn btn-danger btn-lg"
        >
          {{ queueStore.loading ? 'Cancelando...' : '✗ Cancelar Senha' }}
        </button>
      </div>

      <router-link to="/" class="back-link">← Voltar</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'

const router = useRouter()
const authStore = useAuthStore()
const queueStore = useQueueStore()
const tipoSelecionado = ref('normal')

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  queueStore.fetchMinhaSenha(authStore.token)
})

const criarSenha = async () => {
  try {
    await queueStore.criarSenha(tipoSelecionado.value, authStore.token)
  } catch (error) {
    alert('Erro ao criar senha: ' + error.message)
  }
}

const cancelarSenha = async () => {
  if (confirm('Tem certeza que deseja cancelar sua senha?')) {
    try {
      await queueStore.cancelarSenha(authStore.token)
      alert('Senha cancelada com sucesso')
    } catch (error) {
      alert('Erro ao cancelar senha: ' + error.message)
    }
  }
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

<style scoped>
.client-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.client-card {
  background: white;
  border-radius: 15px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.no-ticket {
  text-align: center;
}

.no-ticket > p {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1rem;
}

.ticket-type-selector {
  margin-bottom: 30px;
  text-align: left;
}

.ticket-type-selector h3 {
  margin-bottom: 15px;
  color: #333;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.radio-option:hover {
  border-color: #667eea;
  background: #f5f7ff;
}

.radio-option input {
  margin-right: 15px;
  cursor: pointer;
}

.radio-option span {
  flex: 1;
}

.radio-option strong {
  display: block;
  color: #333;
}

.radio-option small {
  display: block;
  color: #999;
  font-size: 0.85rem;
  margin-top: 3px;
}

.ticket-display {
  text-align: center;
  margin-bottom: 30px;
}

.ticket-number {
  font-size: 4rem;
  font-weight: bold;
  color: #667eea;
  padding: 40px;
  background: #f5f7ff;
  border-radius: 15px;
  border: 3px solid #667eea;
}

.ticket-info {
  text-align: center;
}

.ticket-details {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  color: #333;
  font-weight: 600;
}

.value.chamando {
  color: #ff9800;
}

.value.atendido {
  color: #4caf50;
}

.value.cancelado {
  color: #f44336;
}

.btn-lg {
  width: 100%;
  padding: 15px;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.back-link {
  display: block;
  text-align: center;
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  margin-top: 20px;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
