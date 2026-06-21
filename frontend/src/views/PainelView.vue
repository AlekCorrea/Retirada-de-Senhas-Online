<template>
  <main class="painel-tv">
    <header class="painel-topbar">
      <div>
        <p class="eyebrow">Painel de atendimento</p>
        <h1>Senhas chamadas</h1>
      </div>
      <div class="status-area">
        <span class="socket-dot" :class="{ online: connected }"></span>
        <span>{{ connected ? 'Tempo real ativo' : 'Reconectando' }}</span>
        <strong>{{ horaAtual }}</strong>
      </div>
    </header>

    <section class="hero-grid" aria-live="polite">
      <article class="info-card chamada-card" :class="{ pulse: chamadaAtual }">
        <div class="card-heading">
          <span class="card-label">Senha chamada</span>
          <span class="card-status">{{ chamadaAtual ? 'Em atendimento' : 'Aguardando chamada' }}</span>
        </div>
        <strong class="senha-numero" :class="{ vazio: !chamadaAtual }">{{ chamadaAtual?.numero || '— —' }}</strong>
        <div class="card-footer">
          <span class="tipo-pill" :class="chamadaAtual?.tipo || 'vazio'">
            {{ formatarTipo(chamadaAtual?.tipo) }}
          </span>
          <span class="chamada-hora">
            {{ chamadaAtual?.updated_at ? formatarHora(chamadaAtual.updated_at) : horaAtual }}
          </span>
        </div>
      </article>

      <article class="info-card local-card">
        <div class="card-heading">
          <span class="card-label">Local</span>
          <span class="card-status">Destino</span>
        </div>
        <strong class="local-nome" :class="{ vazio: !localAtendimento }">{{ localAtendimento || '— —' }}</strong>
        <span class="card-hint">Dirija-se ao local indicado</span>
      </article>
    </section>

    <section class="painel-corpo">
      <article class="lista-card">
        <div class="section-title">
          <h2>Ultimas chamadas</h2>
          <span>{{ ultimasChamadas.length }} recentes</span>
        </div>

        <div v-if="ultimasChamadas.length" class="ultimas-lista">
          <div v-for="senha in ultimasChamadas" :key="senha.id" class="ultima-item">
            <span class="ultima-hora">{{ formatarHora(senha.updated_at) }}</span>
            <span class="ultima-numero">{{ senha.numero }}</span>
            <span class="ultima-meta">
              <span>{{ formatarTipo(senha.tipo) }}</span>
              <strong>{{ senha.guiche || 'Local --' }}</strong>
            </span>
          </div>
        </div>
        <div v-else class="estado-vazio">
          Nenhuma senha chamada
        </div>
      </article>

      <aside class="resumo-card">
        <div>
          <span class="resumo-label">Resumo</span>
          <h2>Fila agora</h2>
        </div>
        <div class="metricas-grid">
          <div class="metrica">
            <span>Aguardando</span>
            <strong>{{ totalAguardando }}</strong>
          </div>
          <div class="metrica">
            <span>Atendidos</span>
            <strong>{{ totalAtendidos }}</strong>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useSocket } from '../composables/useSocket'

const route = useRoute()
const { connect, connected, on, off } = useSocket()

const chamadaAtual = ref(null)
const ultimasChamadas = ref([])
const stats = ref({})
const agora = ref(new Date())
let relogio = null

const localAtendimento = computed(() => {
  if (chamadaAtual.value?.guiche) return chamadaAtual.value.guiche
  const local = route.query.local || route.query.sala || route.query.guiche
  return local ? String(local) : ''
})

const horaAtual = computed(() =>
  agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
)

const totalAguardando = computed(() => stats.value.esperando || 0)
const totalAtendidos = computed(() => stats.value.atendido || stats.value.atendidos || 0)

const carregarPainel = async () => {
  try {
    const { data } = await axios.get('/api/painel')
    chamadaAtual.value = data.chamadaAtual
    ultimasChamadas.value = data.ultimasChamadas || []
    stats.value = data.stats || {}
  } catch (err) {
    console.error('Erro ao carregar painel:', err)
  }
}

const atualizarPainel = () => {
  carregarPainel()
}

const formatarTipo = (tipo) => {
  if (tipo === 'prioritario') return 'Preferencial'
  if (tipo === 'normal') return 'Normal'
  return 'Aguardando'
}

const formatarHora = (data) => {
  if (!data) return '--:--'
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  carregarPainel()
  connect()
  on('queue-updated', atualizarPainel)
  on('ticket-called', atualizarPainel)
  on('ticket-created', atualizarPainel)
  on('attendance-finished', atualizarPainel)
  on('ticket-cancelled', atualizarPainel)
  relogio = setInterval(() => {
    agora.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  off('queue-updated', atualizarPainel)
  off('ticket-called', atualizarPainel)
  off('ticket-created', atualizarPainel)
  off('attendance-finished', atualizarPainel)
  off('ticket-cancelled', atualizarPainel)
  if (relogio) clearInterval(relogio)
})
</script>

<style scoped>
.painel-tv {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  padding: clamp(28px, 3.4vw, 56px);
  background:
    radial-gradient(circle at 50% 20%, rgba(240, 243, 252, 0.96) 0%, rgba(143, 154, 210, 0.88) 48%, rgba(43, 56, 126, 0.92) 100%);
  color: #0b102f;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  display: grid;
  grid-template-rows: auto minmax(0, 1.1fr) minmax(0, 0.74fr);
  gap: clamp(22px, 2.4vw, 38px);
  overflow: hidden;
}

.painel-topbar {
  min-height: clamp(72px, 8vh, 100px);
  padding: clamp(14px, 1.4vw, 22px) clamp(18px, 2vw, 30px);
  background: #050817;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 18px 46px rgba(5, 8, 23, 0.28);
}

.eyebrow {
  margin: 0 0 4px;
  color: #bfc7ee;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.painel-topbar h1,
.section-title h2,
.resumo-card h2 {
  margin: 0;
  font-weight: 700;
}

.painel-topbar h1 {
  font-size: clamp(2rem, 4vw, 4.4rem);
  line-height: 1;
}

.status-area {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 1.15rem;
  white-space: nowrap;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.status-area strong {
  font-size: clamp(1.7rem, 3vw, 3rem);
}

.socket-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #e93a32;
  box-shadow: 0 0 0 6px rgba(233, 58, 50, 0.18);
}

.socket-dot.online {
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.18);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(300px, 0.68fr);
  gap: clamp(22px, 2.4vw, 38px);
  min-height: 0;
}

.info-card,
.lista-card,
.resumo-card {
  border-radius: 8px;
  background: linear-gradient(180deg, #6d85fb 0%, #414f95 100%);
  color: #fff;
  box-shadow: 0 18px 42px rgba(7, 10, 32, 0.24);
}

.info-card {
  min-height: 0;
  padding: clamp(22px, 2.1vw, 34px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.info-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: inherit;
  pointer-events: none;
}

.card-heading,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.card-heading {
  margin-bottom: 12px;
}

.card-label {
  font-size: clamp(1.5rem, 2.7vw, 3rem);
  font-weight: 500;
}

.card-status,
.chamada-hora,
.resumo-label {
  color: #dfe4ff;
  font-size: clamp(1rem, 1.15vw, 1.3rem);
  font-weight: 700;
  text-transform: uppercase;
}

.senha-numero {
  margin: 8px 0 20px;
  font-size: clamp(7rem, 18vw, 18rem);
  line-height: 0.86;
  letter-spacing: 0;
  text-shadow: 0 14px 30px rgba(5, 8, 23, 0.2);
}

.senha-numero.vazio {
  font-size: clamp(2.2rem, 4vw, 3.5rem);
  color: rgba(255, 255, 255, 0.55);
  text-shadow: none;
  letter-spacing: 0.3em;
}

.local-nome {
  margin: auto 0 22px;
  font-size: clamp(4rem, 8vw, 8.2rem);
  line-height: 0.95;
  word-break: break-word;
  text-shadow: 0 12px 26px rgba(5, 8, 23, 0.2);
}

.local-nome.vazio {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  color: rgba(255, 255, 255, 0.55);
  text-shadow: none;
  letter-spacing: 0.3em;
}

.card-hint,
.tipo-pill {
  align-self: flex-start;
  border-radius: 999px;
  padding: 10px 22px;
  background: rgba(5, 8, 23, 0.35);
  font-size: clamp(1.1rem, 1.6vw, 1.7rem);
  font-weight: 700;
}

.tipo-pill.prioritario {
  background: #ffe2c5;
  color: #2a1a0c;
}

.tipo-pill.normal {
  background: #dbe8ff;
  color: #091638;
}

.painel-corpo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.38fr);
  gap: clamp(22px, 2.4vw, 38px);
  min-height: 0;
}

.lista-card,
.resumo-card {
  min-height: 0;
  padding: clamp(20px, 1.8vw, 30px);
  overflow: hidden;
}

.resumo-card {
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.section-title h2,
.resumo-card h2 {
  font-size: clamp(2rem, 3.2vw, 3.4rem);
}

.section-title span {
  font-size: 1.25rem;
  color: #dfe4ff;
}

.ultimas-lista {
  display: grid;
  grid-template-columns: repeat(5, minmax(132px, 1fr));
  gap: clamp(12px, 1vw, 16px);
  height: calc(100% - 72px);
}

.ultima-item {
  min-height: 0;
  padding: clamp(16px, 1.4vw, 22px);
  border-radius: 8px;
  background: #eef2ff;
  color: #0b102f;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  box-shadow: inset 0 0 0 1px rgba(65, 79, 149, 0.12);
}

.ultima-numero {
  max-width: 100%;
  font-size: clamp(2.4rem, 3.7vw, 4.6rem);
  font-weight: 800;
  line-height: 1;
  overflow-wrap: anywhere;
}

.ultima-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: clamp(1rem, 1.2vw, 1.35rem);
  line-height: 1.15;
}

.ultima-meta strong,
.ultima-hora {
  color: #414f95;
}

.ultima-hora {
  font-size: clamp(0.95rem, 1vw, 1.2rem);
  font-weight: 700;
  align-self: flex-end;
  padding: 6px 10px;
  border-radius: 999px;
  background: #dbe8ff;
}

.estado-vazio {
  min-height: 190px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  font-size: clamp(2rem, 4vw, 4rem);
}

.metricas-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-top: 22px;
  flex: 1;
  min-height: 0;
}

.metrica {
  min-height: 0;
  padding: clamp(16px, 1.4vw, 24px);
  border-radius: 8px;
  background: rgba(5, 8, 23, 0.26);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.metrica span {
  color: #dfe4ff;
  font-size: clamp(1rem, 1.35vw, 1.55rem);
  font-weight: 700;
  text-transform: uppercase;
}

.metrica strong {
  max-width: 100%;
  font-size: clamp(2.4rem, 4.2vw, 4.4rem);
  line-height: 1;
  overflow-wrap: anywhere;
}

.pulse {
  animation: chamarPulse 1.8s ease-in-out infinite;
}

@keyframes chamarPulse {
  0%, 100% { box-shadow: 0 18px 42px rgba(7, 10, 32, 0.24); }
  50% { box-shadow: 0 18px 60px rgba(255, 226, 197, 0.52); }
}

@media (max-width: 1100px) {
  .hero-grid,
  .painel-corpo {
    grid-template-columns: 1fr;
  }

  .painel-tv {
    height: auto;
    min-height: 100vh;
    overflow: auto;
    grid-template-rows: auto;
  }

  .ultimas-lista {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    height: auto;
  }
}

@media (max-width: 700px) {
  .painel-tv {
    padding: 14px;
  }

  .painel-topbar,
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-area {
    flex-wrap: wrap;
    white-space: normal;
  }

  .card-heading,
  .card-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .info-card {
    min-height: 260px;
  }

  .metricas-grid {
    grid-template-columns: 1fr;
  }

  .metrica {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>