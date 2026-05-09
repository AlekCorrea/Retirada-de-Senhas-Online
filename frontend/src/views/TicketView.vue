<template>
  <div class="container-tela">
    <!-- Seção principal -->
    <div class="card-principal">
      <div class="cabecalho">
        <div class="logo">
          <span class="icone-senha">🎟️</span>
          <h1>Retirada de Senhas</h1>
        </div>
        <p class="subtitulo">Sistema de Atendimento Online</p>
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

        <button
          @click="retirarSenha"
          :disabled="carregando"
          class="btn-retirar"
        >
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

      <!-- Com senha retirada - tela travada -->
      <div v-else class="secao-sucesso">
        <div class="numero-senha">
          <div class="identificador">Sua senha</div>
          <div class="numero">{{ senhaRetirada.numero }}</div>
          <div class="tipo-badge" :class="senhaRetirada.tipo">
            {{ senhaRetirada.tipo === 'prioritario' ? '⭐ Prioritário' : '👤 Normal' }}
          </div>
        </div>

        <div class="info-senha">
          <div class="info-item">
            <span class="icone-info">🕐</span>
            <span class="label-info">Horário:</span>
            <span class="valor-info">{{ horario }}</span>
          </div>
          <div class="info-item">
            <span class="icone-info">⏱️</span>
            <span class="label-info">Tempo estimado:</span>
            <span class="valor-info">{{ tempoEstimado }} min</span>
          </div>
        </div>

        <div class="instrucoes">
          <h3>📌 Instruções:</h3>
          <ul>
            <li>🎟️ Guarde seu número de senha</li>
            <li>📺 Acompanhe o painel de chamadas</li>
            <li>🚶 Compareça quando sua senha for chamada</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Status da fila -->
    <div class="card-fila">
      <h3>📊 Status da Fila</h3>
      <div class="estatisticas">
        <div class="stat-item">
          <div class="stat-valor">{{ totalSenhas }}</div>
          <div class="stat-label">🎫 Senhas Esperando</div>
        </div>
        <div class="stat-item">
          <div class="stat-valor">{{ tempoMedio }}</div>
          <div class="stat-label">⏱️ Tempo Médio (min)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const tipo = ref('normal')
const carregando = ref(false)
const erro = ref('')
const senhaRetirada = ref(null)
const totalSenhas = ref(0)
const tempoMedio = ref(15)
const tempoEstimado = ref(15)
const horario = ref('')

// Carregar status da fila ao montar o componente
onMounted(() => {
  carregarStatusFila()
  // Atualizar a cada 10 segundos
  setInterval(carregarStatusFila, 10000)
})

const carregarStatusFila = async () => {
  try {
    const resposta = await axios.get('http://localhost:3000/api/senhas/status')
    if (resposta.data) {
      totalSenhas.value = resposta.data.esperando || 0
      tempoMedio.value = Math.ceil((resposta.data.esperando || 0) * 5)
    }
  } catch (error) {
    console.log('Não foi possível carregar status da fila')
  }
}

const retirarSenha = async () => {
  carregando.value = true
  erro.value = ''

  try {
    const resposta = await axios.post('http://localhost:3000/api/senha/publica',
      { tipo: tipo.value }
    )

    senhaRetirada.value = resposta.data
    horario.value = new Date().toLocaleTimeString('pt-BR')
    tempoEstimado.value = totalSenhas.value * 5

  } catch (error) {
    console.error('Erro:', error)
    erro.value = error.response?.data?.erro || 'Erro ao retirar senha. Tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.container-tela {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  margin-bottom: 20px;
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
  color: #1e1e1e;
  font-weight: 700;
}

.subtitulo {
  margin: 8px 0 0;
  color: #666;
  font-size: 1rem;
}

.secao-formulario h2 {
  font-size: 1.2rem;
  margin: 0 0 24px;
  color: #333;
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
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.opcao-tipo:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.opcao-tipo.selecionado {
  border-color: #667eea;
  background: #eef2ff;
}

.opcao-tipo input {
  margin-right: 14px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  accent-color: #667eea;
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
  color: #333;
  font-size: 1rem;
}

.descricao-opcao {
  color: #888;
  font-size: 0.85rem;
}

.btn-retirar {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
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
  margin-bottom: 32px;
}

.identificador {
  font-size: 0.9rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.numero {
  font-size: 5.5rem;
  font-weight: 800;
  color: #667eea;
  line-height: 1;
  padding: 32px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  border-radius: 20px;
  border: 3px solid #667eea;
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
  background: #e8f5e9;
  color: #2e7d32;
}

.tipo-badge.prioritario {
  background: #fff8e1;
  color: #f57f17;
}

.info-senha {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 28px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.icone-info {
  font-size: 1.5rem;
}

.label-info {
  font-size: 0.8rem;
  color: #888;
  font-weight: 500;
}

.valor-info {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.instrucoes {
  background: #f8f9ff;
  padding: 20px;
  border-radius: 14px;
  margin-bottom: 28px;
  text-align: left;
}

.instrucoes h3 {
  margin: 0 0 12px;
  color: #333;
  font-size: 1rem;
}

.instrucoes ul {
  margin: 0;
  padding-left: 20px;
}

.instrucoes li {
  margin: 8px 0;
  color: #666;
  font-size: 0.9rem;
}

/* Card da fila */
.card-fila {
  background: white;
  border-radius: 18px;
  padding: 24px;
  max-width: 640px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-fila h3 {
  margin: 0 0 20px;
  color: #333;
  font-size: 1.1rem;
  text-align: center;
}

.estatisticas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 14px;
  text-align: center;
  color: white;
}

.stat-valor {
  font-size: 2.5rem;
  font-weight: 800;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 4px;
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

  .info-senha {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
