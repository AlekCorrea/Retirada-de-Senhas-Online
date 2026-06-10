# Contexto do Projeto

Este arquivo e um briefing rapido para agentes de IA. Leia primeiro antes de fazer mudancas no projeto.

## Visao geral

Sistema de Senhas Online para Atendimento.

O sistema permite que clientes retirem senhas, acompanhem a fila, atendentes chamem/finalizem senhas, administradores gerenciem a fila e um painel de TV exiba a senha chamada em tempo real.

## Stack

- Frontend: Vue 3 + Vite + Pinia + Vue Router
- Backend: Node.js + Express
- Banco: PostgreSQL
- Tempo real: Socket.IO
- Ambiente: Docker Compose com nginx

## Estrutura principal

- `frontend/src/views/TicketView.vue`: tela publica para retirar senha
- `frontend/src/views/ClientView.vue`: tela do cliente logado
- `frontend/src/views/AtendenteView.vue`: tela do atendente
- `frontend/src/views/AdminView.vue`: tela administrativa
- `frontend/src/views/PainelView.vue`: painel de TV/local
- `frontend/src/stores/queue.js`: store de senhas/fila
- `frontend/src/composables/useSocket.js`: conexao Socket.IO
- `backend/src/controllers/senhaController.js`: endpoints principais da fila
- `backend/src/models/senhaModel.js`: regras de banco/fila
- `backend/src/routes/senhaRoutes.js`: rotas da API de senhas

## Regras de negocio importantes

- Tipos de senha:
  - `normal`
  - `prioritario`

- Status de senha:
  - `esperando`
  - `chamando`
  - `atendido`
  - `cancelado`

- Regra de chamada:
  - priorizar senhas preferenciais
  - apos chamadas preferenciais, alternar com senha normal conforme regra do projeto

- Uma senha ativa e qualquer senha com status:
  - `esperando`
  - `chamando`

- Ao chamar uma nova senha, uma senha anterior em `chamando` pode ser marcada como `atendido`.

## Endpoints uteis

- `GET /api/painel`: dados publicos para `PainelView`
- `GET /api/senhas`: lista senhas
- `POST /api/senha`: cria senha autenticada
- `POST /api/senha/publica`: cria senha publica
- `PUT /api/chamar`: chama proxima senha
- `PUT /api/finalizar/:id`: finaliza senha
- `PUT /api/cancelar/:id`: cancela senha
- `GET /api/minha-senha`: busca senha ativa do dispositivo
- `GET /api/senhas/status`: estatisticas da fila

## Eventos Socket.IO

Eventos usados no frontend:

- `queue-updated`
- `ticket-created`
- `ticket-called`
- `your-turn`
- `attendance-finished`
- `ticket-cancelled`
- `queue-stats-updated`

Quando mexer em fluxo de senha, verificar se o evento correto esta sendo emitido e escutado.

## Convencoes de UI

- O projeto usa CSS scoped dentro das views.
- Manter estilo visual atual: tons azulados, cards claros, bordas arredondadas.
- `PainelView.vue` e uma tela para TV, deve ocupar tela cheia e funcionar bem em fullscreen.
- Evitar depender de hover/interacao no painel de TV.
- Telas de cliente devem funcionar bem em mobile.

## Comandos comuns

Frontend:

```bash
cd frontend
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
```

Backend:

```bash
cd backend
node --check src/controllers/senhaController.js
```

Docker:

```bash
docker compose up
docker compose ps
docker compose logs
```

## Cuidados

- O repositorio pode ter alteracoes locais nao commitadas. Nao reverter mudancas sem pedir.
- Nao editar arquivos gerados como `frontend/dist`, salvo pedido explicito.
- Antes de alterar uma tela, verificar a view correspondente e o store/composable relacionado.
- Antes de alterar regras de fila, verificar `senhaController.js`, `senhaModel.js` e eventos Socket.IO.
