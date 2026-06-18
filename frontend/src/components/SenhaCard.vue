<template>
  <div class="senha-card">
    <div class="senha-card-main">
      <div>
        <p class="label">Sua senha</p>
        <strong class="numero">{{ senha?.numero || '--' }}</strong>
      </div>
      <span class="tipo" :class="senha?.tipo">
        {{ senha?.tipo === 'prioritario' ? 'Prioritaria' : 'Normal' }}
      </span>
    </div>

    <div class="detalhes">
      <div>
        <span>Status</span>
        <strong>{{ statusLabel }}</strong>
      </div>
      <div>
        <span>Codigo</span>
        <strong>{{ senha?.codigo_verificacao || '--' }}</strong>
      </div>
      <div>
        <span>Na frente</span>
        <strong>{{ senha?.pessoasNaFrente ?? 0 }}</strong>
      </div>
    </div>

    <button type="button" class="btn-cancelar-card" @click="$emit('cancelar')">
      Cancelar senha
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  senha: {
    type: Object,
    required: true
  }
})

defineEmits(['cancelar'])

const statusLabel = computed(() => {
  const labels = {
    esperando: 'Esperando',
    chamando: 'Chamando',
    atendido: 'Atendido',
    cancelado: 'Cancelado'
  }

  return labels[props.senha?.status] || props.senha?.status || 'Ativa'
})
</script>

<style scoped>
.senha-card {
  background: #fff;
  border: 1px solid rgba(15, 26, 82, 0.12);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 26px rgba(15, 26, 82, 0.08);
}

.senha-card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.label {
  margin: 0 0 6px;
  color: #555;
  font-size: 0.82rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.numero {
  display: block;
  color: #0f1a52;
  font-family: 'Inter', sans-serif;
  font-size: 3rem;
  line-height: 1;
}

.tipo {
  border-radius: 999px;
  background: #ccd4ff;
  color: #0f1a52;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 8px 14px;
  white-space: nowrap;
}

.tipo.prioritario {
  background: #fee2e2;
  color: #991b1b;
}

.detalhes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.detalhes div {
  background: #f0f3fc;
  border-radius: 12px;
  padding: 12px;
}

.detalhes span {
  display: block;
  color: #555;
  font-size: 0.78rem;
  margin-bottom: 4px;
}

.detalhes strong {
  color: #0f1a52;
  font-size: 0.95rem;
}

.btn-cancelar-card {
  width: 100%;
  border: none;
  border-radius: 10px;
  background: #e93a32;
  color: #fff;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 12px;
}

.btn-cancelar-card:hover {
  background: #c0392b;
}

@media (max-width: 600px) {
  .senha-card-main {
    flex-direction: column;
  }

  .detalhes {
    grid-template-columns: 1fr;
  }
}
</style>
