<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>⚙️ Painel Administrativo</h1>
      <button @click="logout" class="btn btn-danger">Sair</button>
    </div>

    <div class="admin-content">
      <div class="control-panel">
        <h2>Controles</h2>
        <button @click="chamarProxima" :disabled="queueStore.loading" class="btn btn-success btn-lg">
          {{ queueStore.loading ? 'Chamando...' : '📢 Chamar Próxima' }}
        </button>
        <button @click="recarregar" class="btn btn-primary">🔄 Recarregar</button>
      </div>

      <div class="queue-list">
        <h2>Fila de Senhas</h2>
        
        <div v-if="queueStore.loading" class="loading">
          Carregando...
        </div>

        <div v-else-if="queueStore.senhas.length === 0" class="empty">
          Nenhuma senha na fila
        </div>

        <div v-else class="senhas-grid">
          <div 
            v-for="senha in queueStore.senhas" 
            :key="senha.id"
            :class="['senha-card', senha.status]"
          >
            <div class="senha-numero">{{ senha.numero }}</div>
            <div class="senha-info">
              <p><strong>Tipo:</strong> {{ senha.tipo === 'prioritario' ? 'Prioritário' : 'Normal' }}</p>
              <p><strong>Status:</strong> {{ getStatusLabel(senha.status) }}</p>
              <p><strong>Email:</strong> {{ senha.email_usuario }}</p>
            </div>
            <div class="senha-actions">
              <button 
                v-if="senha.status === 'chamando'"
                @click="finalizarSenha(senha.id)"
                class="btn btn-sm btn-success"
              >
                ✓ Finalizar
              </button>
              <button 
                v-if="senha.status !== 'atendido' && senha.status !== 'cancelado'"
                @click="cancelarSenha(senha.id)"
                class="btn btn-sm btn-danger"
              >
                ✗ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'

const router = useRouter()
const authStore = useAuthStore()
const queueStore = useQueueStore()

onMounted(() => {
  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    router.push('/login')
    return
  }
  recarregar()
})

const recarregar = () => {
  queueStore.fetchSenhas(authStore.token)
}

const chamarProxima = async () => {
  try {
    await queueStore.chamarProxima(authStore.token)
  } catch (error) {
    alert('Erro ao chamar próxima: ' + error.message)
  }
}

const finalizarSenha = async (id) => {
  try {
    await queueStore.finalizarSenha(id, authStore.token)
  } catch (error) {
    alert('Erro ao finalizar: ' + error.message)
  }
}

const cancelarSenha = async (id) => {
  if (confirm('Tem certeza que deseja cancelar esta senha?')) {
    try {
      await queueStore.cancelarSenha(id, authStore.token)
    } catch (error) {
      alert('Erro ao cancelar: ' + error.message)
    }
  }
}

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

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.admin-header h1 {
  margin: 0;
  color: #333;
}

.admin-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.control-panel,
.queue-list {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #333;
}

.btn-lg {
  width: 100%;
  padding: 15px;
  margin-bottom: 10px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.senhas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.senha-card {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s;
}

.senha-card.esperando {
  border-color: #ff9800;
  background: #fff8f0;
}

.senha-card.chamando {
  border-color: #2196f3;
  background: #f0f8ff;
}

.senha-card.atendido {
  border-color: #4caf50;
  background: #f0fff0;
}

.senha-card.cancelado {
  border-color: #f44336;
  background: #fff0f0;
}

.senha-numero {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  text-align: center;
  margin-bottom: 10px;
}

.senha-info {
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.senha-info p {
  margin: 5px 0;
  color: #666;
}

.senha-actions {
  display: flex;
  gap: 10px;
}

.btn-sm {
  flex: 1;
  padding: 8px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .admin-content {
    grid-template-columns: 1fr;
  }

  .admin-header {
    flex-direction: column;
    gap: 10px;
  }

  .admin-header h1 {
    width: 100%;
  }

  .admin-header .btn {
    width: 100%;
  }
}
</style>
