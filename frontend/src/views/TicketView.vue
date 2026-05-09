<template>
  <div class="ticket-container">
    <div class="ticket-card">
      <div class="header">
        <h1>🎫 Retirada de Senhas</h1>
        <p>Sistema de Atendimento Online</p>
      </div>

      <div v-if="!ticketRetirado" class="form-section">
        <div class="form-group">
          <label>Nome Completo</label>
          <input v-model="nome" type="text" placeholder="Digite seu nome" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="seu@email.com" />
        </div>

        <div class="form-group">
          <label>Tipo de Atendimento</label>
          <div class="radio-options">
            <label class="radio-option">
              <input v-model="tipo" type="radio" value="normal" />
              <span>
                <strong>Normal</strong>
                <small>Fila padrão</small>
              </span>
            </label>

            <label class="radio-option">
              <input v-model="tipo" type="radio" value="prioritario" />
              <span>
                <strong>Prioritário</strong>
                <small>Idosos, gestantes, PCD</small>
              </span>
            </label>
          </div>
        </div>

        <button @click="retirarSenha" :disabled="loading" class="btn btn-primary btn-lg">
          {{ loading ? 'Processando...' : '✓ Retirar Senha' }}
        </button>

        <div v-if="erro" class="alert alert-error">
          {{ erro }}
        </div>

        <router-link to="/login" class="login-link">
          Administrador? Faça login aqui →
        </router-link>
      </div>

      <div v-else class="success-section">
        <div class="success-icon">✓</div>
        <h2>Senha Retirada com Sucesso!</h2>
        
        <div class="ticket-display">
          <div class="ticket-number">{{ senhaRetirada.numero }}</div>
        </div>

        <div class="ticket-info">
          <p><strong>Nome:</strong> {{ nome }}</p>
          <p><strong>Email:</strong> {{ email }}</p>
          <p><strong>Tipo:</strong> {{ tipo === 'prioritario' ? 'Prioritário' : 'Normal' }}</p>
          <p><strong>Horário:</strong> {{ new Date().toLocaleTimeString('pt-BR') }}</p>
        </div>

        <div class="instructions">
          <h3>Instruções:</h3>
          <ul>
            <li>Guarde seu número de senha</li>
            <li>Acompanhe o painel de chamadas</li>
            <li>Compareça quando sua senha for chamada</li>
            <li>Tempo estimado: {{ tempoEstimado }} minutos</li>
          </ul>
        </div>

        <button @click="novaSenh" class="btn btn-success btn-lg">
          Retirar Outra Senha
        </button>
      </div>
    </div>

    <div class="fila-info">
      <h3>📊 Status da Fila</h3>
      <div class="stats">
        <div class="stat">
          <span class="label">Senhas Esperando:</span>
          <span class="value">{{ totalSenhas }}</span>
        </div>
        <div class="stat">
          <span class="label">Tempo Médio:</span>
          <span class="value">{{ tempoMedio }} min</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const nome = ref('')
const email = ref('')
const tipo = ref('normal')
const loading = ref(false)
const erro = ref('')
const ticketRetirado = ref(false)
const senhaRetirada = ref(null)
const totalSenhas = ref(0)
const tempoMedio = ref(15)
const tempoEstimado = ref(15)

// Carregar status da fila ao montar o componente
onMounted(() => {
  carregarStatusFila()
  // Atualizar a cada 10 segundos
  setInterval(carregarStatusFila, 10000)
})

const carregarStatusFila = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/senhas/status')
    if (response.data) {
      // Usar dados do status público
      totalSenhas.value = response.data.esperando || 0
      
      // Calcular tempo médio (5 minutos por senha)
      tempoMedio.value = Math.ceil((response.data.esperando || 0) * 5)
    }
  } catch (error) {
    console.log('Não foi possível carregar status da fila')
  }
}

const retirarSenha = async () => {
  // Validar campos
  if (!nome.value.trim()) {
    erro.value = 'Por favor, digite seu nome'
    return
  }
  if (!email.value.trim()) {
    erro.value = 'Por favor, digite seu email'
    return
  }

  loading.value = true
  erro.value = ''

  try {
    const response = await axios.post('http://localhost:3000/api/senha/publica', 
      { 
        tipo: tipo.value,
        nome: nome.value,
        email: email.value
      }
    )

    senhaRetirada.value = response.data
    ticketRetirado.value = true
    
    // Atualizar status da fila
    await carregarStatusFila()
    
    // Calcular tempo estimado baseado na fila
    tempoEstimado.value = totalSenhas.value * 5

  } catch (error) {
    console.error('Erro:', error)
    erro.value = error.response?.data?.erro || 'Erro ao retirar senha. Tente novamente.'
  } finally {
    loading.value = false
  }
}

const novaSenh = () => {
  nome.value = ''
  email.value = ''
  tipo.value = 'normal'
  ticketRetirado.value = false
  senhaRetirada.value = null
  erro.value = ''
}
</script>

<style scoped>
.ticket-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ticket-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

input[type="text"],
input[type="email"] {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="email"]:focus {
  outline: none;
  border-color: #667eea;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 15px;
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
  width: 20px;
  height: 20px;
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

.btn {
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-lg {
  width: 100%;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.login-link {
  text-align: center;
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
}

.login-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.success-section {
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  color: #4caf50;
  margin-bottom: 20px;
}

.success-section h2 {
  color: #333;
  margin-bottom: 30px;
}

.ticket-display {
  margin: 30px 0;
}

.ticket-number {
  font-size: 5rem;
  font-weight: bold;
  color: #667eea;
  padding: 40px;
  background: #f5f7ff;
  border-radius: 15px;
  border: 3px solid #667eea;
}

.ticket-info {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.ticket-info p {
  margin: 10px 0;
  color: #666;
}

.ticket-info strong {
  color: #333;
}

.instructions {
  background: #f0f4ff;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.instructions h3 {
  margin-top: 0;
  color: #333;
}

.instructions ul {
  margin: 10px 0;
  padding-left: 20px;
}

.instructions li {
  margin: 8px 0;
  color: #666;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover {
  background: #45a049;
}

.fila-info {
  background: white;
  border-radius: 15px;
  padding: 20px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.fila-info h3 {
  margin-top: 0;
  color: #333;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat {
  background: #f5f7ff;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat .label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.stat .value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
}

@media (max-width: 600px) {
  .ticket-card {
    padding: 20px;
  }

  .header h1 {
    font-size: 1.8rem;
  }

  .ticket-number {
    font-size: 3rem;
    padding: 30px;
  }
}
</style>
