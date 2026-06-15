# Sistema de Senhas Online para Atendimento

Documentacao tecnica do projeto **Sistema de Senhas Online para Atendimento**, desenvolvido como Projeto Aplicado do curso de Ciencia da Computacao do IFC Campus Videira.

> Alessandra Correa, Celia Raizer e Everton Serighelli - 2026

---

## Sumario

- [Sobre o projeto](#sobre-o-projeto)
- [Arquitetura atual](#arquitetura-atual)
- [Estrutura do repositorio](#estrutura-do-repositorio)
- [Regras de negocio](#regras-de-negocio)
- [Requisitos funcionais](#requisitos-funcionais)
- [Requisitos nao funcionais](#requisitos-nao-funcionais)
- [Endpoints](#endpoints)
- [Eventos Socket.IO](#eventos-socketio)
- [Banco de dados](#banco-de-dados)
- [Usuarios e permissoes](#usuarios-e-permissoes)
- [Interface web e mobile](#interface-web-e-mobile)
- [Execucao e verificacao](#execucao-e-verificacao)
- [Situacao do projeto](#situacao-do-projeto)
- [Projeto aos moldes da FICE](#projeto-aos-moldes-da-fice)

---

## Sobre o projeto

O sistema permite que clientes retirem senhas, acompanhem a fila em tempo real, recebam estimativa de espera e sejam notificados quando a senha for chamada. Atendentes chamam, finalizam e cancelam senhas pela interface web. Administradores gerenciam a fila, usuarios internos e configuracoes de atendimento. Um painel publico de TV exibe a chamada atual e as ultimas chamadas.

O projeto hoje possui tres frentes principais:

- **Frontend web**: Vue 3, Vite, Pinia, Vue Router e Socket.IO Client.
- **Backend API**: Node.js, Express, TypeScript, PostgreSQL, JWT, Passport Google OAuth e Socket.IO.
- **Mobile**: Flutter com HTTP e Socket.IO, atualmente concentrado em `mobile/lib/main.dart`.

---

## Arquitetura atual

```text
Usuario web/mobile
      |
      v
Nginx porta 80
      |
      +-- Frontend web Vue 3
      |
      +-- Backend Node.js/Express porta 3000
              |
              +-- REST API
              +-- Socket.IO
              +-- Passport Google OAuth
              |
              v
        PostgreSQL 15
```

A infraestrutura roda com Docker Compose. O nginx publica o frontend e faz proxy para a API e para o Socket.IO.

Arquivos principais:

- `docker-compose.yml`: orquestracao dos servicos.
- `nginx/default.conf`: proxy HTTP e WebSocket.
- `backend/src/server.ts`: ponto de entrada do backend.
- `backend/src/app.ts`: configuracao do Express.
- `backend/src/websocket/socket.ts`: inicializacao do Socket.IO e salas.
- `database/init.sql`: schema inicial e dados padrao.

---

## Estrutura do repositorio

```text
backend/
  src/
    controllers/
      authController.ts
      senhaController.ts
      userController.ts
    models/
      senhaModel.ts
    routes/
      authRoutes.ts
      senhaRoutes.ts
      userRoutes.ts
    middlewares/
      authMiddleware.ts
      adminMiddleware.ts
      atendenteMiddleware.ts
    websocket/
      socket.ts
    config/
      db.ts
      passport.ts

frontend/
  src/
    views/
      TicketView.vue
      ClientView.vue
      AtendenteView.vue
      AdminView.vue
      PainelView.vue
      LoginView.vue
    stores/
      auth.js
      queue.js
    composables/
      useSocket.js
    router/
      index.js
      guards.js

mobile/
  lib/
    main.dart

database/
  init.sql
```

---

## Regras de negocio

As regras abaixo consolidam o escopo descrito no `Pre Projeto Aplicado v2.docx` com o que esta implementado no repositorio. A coluna de implementacao aponta o principal local do codigo onde a regra aparece.

### Senhas e fila

| Codigo | Regra | Implementacao no codigo |
|---|---|---|
| RN-01 | Senhas podem ser dos tipos `normal` ou `prioritario`. | `database/init.sql` define o `CHECK`; `backend/src/models/senhaModel.ts` usa o tipo para gerar prefixo e prioridade; `frontend/src/views/TicketView.vue` e `mobile/lib/main.dart` exibem a selecao. |
| RN-02 | Numeracao usa prefixo `N` para normal e `P` para prioritario, com tres digitos: `N001`, `P001`. | `backend/src/models/senhaModel.ts`, funcao `criarSenha`. |
| RN-03 | A numeracao e sequencial por tipo e por `data_atendimento`. | `backend/src/models/senhaModel.ts`, consulta da ultima senha do mesmo tipo no dia; `database/init.sql` e `backend/src/server.ts` garantem `data_atendimento` e indice unico por numero/data. |
| RN-04 | Uma senha ativa e qualquer senha com status `esperando` ou `chamando`. | `backend/src/models/senhaModel.ts`, consultas em `criarSenha`, `buscarMinhaSenha` e `cancelarMinhaSenha`; `AGENTS.md` registra a definicao operacional. |
| RN-05 | Um `dispositivo_id` so pode ter uma senha ativa por dia. | `backend/src/models/senhaModel.ts`, validacao em `criarSenha`; `frontend/src/stores/queue.js` e `TicketView.vue` mantem o `deviceId` no cliente. |
| RN-06 | Status validos: `esperando`, `chamando`, `atendido`, `cancelado`. | `database/init.sql` define o `CHECK`; `backend/src/models/senhaModel.ts` atualiza os status. |
| RN-07 | Ao chamar uma nova senha, todas as senhas do dia em `chamando` sao marcadas como `atendido`. | `backend/src/models/senhaModel.ts`, funcao `chamarProxima`, CTE `finalizarAnterior`. |
| RN-08 | O guiche pode ser informado na chamada e fica salvo na senha chamada. | `database/init.sql` e `backend/src/server.ts` garantem coluna `guiche`; `backend/src/models/senhaModel.ts` salva o valor; `AtendenteView.vue`, `PainelView.vue`, `ClientView.vue` e `mobile/lib/main.dart` exibem. |
| RN-09 | Cancelamentos e finalizacoes registram timestamps e historico em `atendimentos`. | `backend/src/models/senhaModel.ts`, funcoes `registrarInicioAtendimento`, `registrarConclusaoAtendimento`, `finalizarSenha`, `cancelarSenha` e `cancelarMinhaSenha`; tabela `atendimentos` em `database/init.sql`. |

### Regra de prioridade

| Codigo | Regra | Implementacao no codigo |
|---|---|---|
| RN-10 | A chamada prioriza senhas `prioritario`. | `backend/src/models/senhaModel.ts`, funcao `chamarProxima`, ordenacao por `tipo`. |
| RN-11 | A regra de alternancia e 3x1: ate tres prioritarias consecutivas e depois uma normal, quando existir normal aguardando. | `backend/src/models/senhaModel.ts`, variavel `contadorPrioritarias` e logica de busca em `chamarProxima`. |
| RN-12 | O contador 3x1 (`contadorPrioritarias`) fica em memoria no processo Node.js e reinicia junto com o backend. | `backend/src/models/senhaModel.ts`, variavel de modulo `contadorPrioritarias`; ponto de atencao para multiplas instancias. |
| RN-13 | A simulacao de ordem da fila usa a mesma regra 3x1 para calcular posicao e estimativa. | `backend/src/models/senhaModel.ts`, funcoes `simularOrdemChamada`, `calcularEstimativaDaFila`, `calcularTempoEstimado` e `calcularEstimativaNovaSenha`. |

### Configuracao de atendimento e estimativas

| Codigo | Regra | Implementacao no codigo |
|---|---|---|
| RN-14 | As configuracoes ficam em `sistema_config`, chave `dias_atendimento`. | `database/init.sql`, `backend/src/server.ts`, `backend/src/models/senhaModel.ts` (`obterConfigAtendimento`, `salvarConfigAtendimento`). |
| RN-15 | Campos configuraveis: `diasAtendimento`, `horaInicioEntrega`, `horaInicioAtendimento`, `horaFimAtendimento`, `tempoMedioAtendimentoMinutos`. | `backend/src/models/senhaModel.ts` normaliza e persiste os campos; `backend/src/controllers/senhaController.ts` expoe GET/PUT; `frontend/src/views/AdminView.vue` edita. |
| RN-16 | A retirada de senha e bloqueada fora dos dias de atendimento. | `backend/src/models/senhaModel.ts`, funcao `criarSenha` com `verificarDiaAtendimento`; mensagens convertidas para 403 em `senhaController.ts`. |
| RN-17 | A retirada de senha e bloqueada antes de `horaInicioEntrega`. | `backend/src/models/senhaModel.ts`, funcao `criarSenha`. |
| RN-18 | A retirada de senha e bloqueada quando a previsao ultrapassa `horaFimAtendimento`. | `backend/src/models/senhaModel.ts`, funcoes `calcularPrevisaoAtendimento`, `calcularEstimativaNovaSenha` e `criarSenha`. |
| RN-19 | A estimativa considera pessoas na frente, regra 3x1, tempo medio configurado e quantidade de atendentes conectados. | `backend/src/models/senhaModel.ts`, funcoes de estimativa; `backend/src/websocket/socket.ts` conta atendentes; `TicketView.vue`, `ClientView.vue` e `mobile/lib/main.dart` exibem. |
| RN-20 | O tempo efetivo usado na estimativa e `tempoMedioAtendimentoMinutos / atendentesLogados`, com minimo de 1 atendente para evitar divisao por zero. | `backend/src/models/senhaModel.ts`, funcoes `obterQuantidadeAtendentesLogados` e `calcularTempoMedioEfetivo`; `backend/src/websocket/socket.ts` emite `attendants-online-updated`. |

---

## Requisitos funcionais

Os requisitos funcionais foram derivados do objetivo do `Pre Projeto Aplicado v2.docx`: retirada remota/local de senhas, acompanhamento em tempo real, estimativa de atendimento, chamada por atendente, painel local e gestao do atendimento.

| Codigo | Requisito funcional | Implementacao no codigo | Situacao |
|---|---|---|---|
| RF-01 | Permitir retirada de senha sem cadastro, usando identificacao por dispositivo. | `POST /api/senha/publica` em `senhaRoutes.ts`; `criarPublica` em `senhaController.ts`; `criarSenha` em `senhaModel.ts`; `TicketView.vue` e `mobile/lib/main.dart`. | Implementado |
| RF-02 | Permitir retirada de senha por usuario autenticado via Google. | `GET /auth/google`, `GET /auth/google/callback`, `POST /api/senha`; `authController.ts`; `config/passport.ts`; `ClientView.vue`, `TicketView.vue` e `mobile/lib/main.dart`. | Implementado |
| RF-03 | Permitir escolha entre senha normal e prioritaria. | `TicketView.vue`, `mobile/lib/main.dart`; validacao/modelagem em `database/init.sql` e `senhaModel.ts`. | Implementado |
| RF-04 | Exibir a senha gerada, codigo de verificacao, status e dados de acompanhamento ao cliente. | `senhaModel.ts` retorna `numero`, `codigo_verificacao`, `pessoasNaFrente`, `tempoEstimadoMinutos`; `TicketView.vue`, `ClientView.vue`, `SenhaCard.vue` e `mobile/lib/main.dart`. | Implementado |
| RF-05 | Permitir que o cliente acompanhe sua posicao na fila e estimativa de atendimento. | `GET /api/minha-senha/publica`, `GET /api/minha-senha`; funcoes `buscarMinhaSenha` e `calcularTempoEstimado` em `senhaModel.ts`; views de cliente e mobile. | Implementado |
| RF-06 | Atualizar fila, cliente e painel em tempo real. | `backend/src/websocket/socket.ts`; emissoes em `senhaController.ts`; consumo em `frontend/src/composables/useSocket.js`, `PainelView.vue`, `ClientView.vue`, `AtendenteView.vue`, `AdminView.vue` e `mobile/lib/main.dart`. | Implementado |
| RF-07 | Permitir cancelamento da propria senha pelo cliente. | `PUT /api/minha-senha/cancelar/publica`, `PUT /api/minha-senha/cancelar`; `cancelarMinhaSenhaPublica`, `cancelarMinhaSenha`; `senhaModel.ts`; `TicketView.vue`, `ClientView.vue`, `mobile/lib/main.dart`. | Implementado |
| RF-08 | Permitir consulta do historico de senhas do dispositivo. | `GET /api/meu-historico`; `meuHistorico` em `senhaController.ts`; `buscarHistoricoSenhas` em `senhaModel.ts`; `frontend/src/stores/queue.js`. | Implementado |
| RF-09 | Permitir login de atendente e administrador com email e senha. | `POST /auth/login-atendente`, `POST /auth/login-admin`; `authController.ts`; `LoginView.vue`; `frontend/src/stores/auth.js`. | Implementado |
| RF-10 | Permitir que atendente visualize a fila e estatisticas. | `GET /api/fila`; `obterFila` em `senhaController.ts`; `AtendenteView.vue`. | Implementado |
| RF-11 | Permitir que atendente chame a proxima senha. | `PUT /api/chamar`; `chamar` em `senhaController.ts`; `chamarProxima` em `senhaModel.ts`; `AtendenteView.vue`. | Implementado |
| RF-12 | Permitir que atendente finalize ou cancele senhas. | `PUT /api/finalizar/:id`, `PUT /api/cancelar/:id`; `finalizar`, `cancelar`; `AtendenteView.vue`. | Implementado |
| RF-13 | Permitir que administrador liste e gerencie a fila. | `GET /api/senhas`, `PUT /api/senha/chamar`, `PUT /api/senha/finalizar/:id`, `PUT /api/senha/cancelar/:id`; `AdminView.vue`; `queue.js`. | Implementado |
| RF-14 | Permitir que administrador gerencie usuarios internos. | `backend/src/routes/userRoutes.ts`, `userController.ts`; montagem em `backend/src/server.ts`; `AdminView.vue`. | Implementado |
| RF-15 | Permitir que administrador configure dias, horarios e tempo medio de atendimento. | `GET /api/config/atendimento`, `PUT /api/config/atendimento`; `salvarConfigAtendimento`; `AdminView.vue`; `sistema_config`. | Implementado |
| RF-16 | Disponibilizar painel local/TV com senha chamada, ultimas chamadas e estatisticas. | `GET /api/painel`; `obterPainelPublico`; `PainelView.vue`; eventos `queue-updated`, `ticket-called`, `ticket-created`, `attendance-finished`, `ticket-cancelled`. | Implementado |
| RF-17 | Registrar metricas de espera e atendimento para apoiar gestao. | Tabela `atendimentos`; funcoes `registrarInicioAtendimento`, `registrarConclusaoAtendimento`; `obterMetricasAtendimento`; `GET /api/fila`, `/api/painel`, `/api/senhas/status`. | Implementado |
| RF-18 | Disponibilizar aplicativo mobile para retirada e acompanhamento de senha. | `mobile/lib/main.dart`, `mobile/pubspec.yaml`, `mobile/Dockerfile`. | Parcial: funcional em arquivo unico, ainda sem modularizacao. |
| RF-19 | Enviar notificacoes ao usuario quando sua senha for chamada ou finalizada. | Eventos Socket.IO `your-turn`, `ticket-called`, `attendance-finished`, `ticket-cancelled`; listeners no web/mobile. | Implementado como notificacao em tempo real na aplicacao; push notification nativo nao implementado. |
| RF-20 | Publicar codigo-fonte e permitir execucao padronizada. | `docker-compose.yml`, `nginx/default.conf`, `frontend/Dockerfile`, `backend/Dockerfile`, `database/init.sql`, `mobile/Dockerfile`. | Implementado no repositorio; publicacao externa depende do GitHub remoto. |

---

## Requisitos nao funcionais

| Codigo | Requisito nao funcional | Implementacao no codigo | Situacao |
|---|---|---|---|
| RNF-01 | Usar arquitetura cliente-servidor com API REST. | `backend/src/server.ts`, `backend/src/routes/*.ts`, `frontend/src/stores/queue.js`, `mobile/lib/main.dart`. | Implementado |
| RNF-02 | Utilizar comunicacao em tempo real para chamadas e atualizacoes da fila. | `backend/src/websocket/socket.ts`, `backend/src/controllers/senhaController.ts`, `frontend/src/composables/useSocket.js`, `mobile/lib/main.dart`. | Implementado |
| RNF-03 | Armazenar dados em banco relacional PostgreSQL. | `database/init.sql`, `backend/src/config/db.ts`, queries em controllers/models. | Implementado |
| RNF-04 | Padronizar ambiente com Docker. | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `nginx/Dockerfile`, `mobile/Dockerfile`. | Implementado |
| RNF-05 | Proteger endpoints restritos com autenticacao e autorizacao por perfil. | `authMiddleware.ts`, `adminMiddleware.ts`, `atendenteMiddleware.ts`, `authController.ts`, `senhaRoutes.ts`, `userRoutes.ts`. | Implementado |
| RNF-06 | Armazenar senhas internas com hash seguro. | `backend/src/utils/passwordHash.ts`, `authController.ts`, `userController.ts`, migracao em `server.ts`. | Implementado |
| RNF-07 | Aplicar protecoes HTTP basicas. | `helmet`, `cors`, `express-session` em `backend/src/server.ts`. | Parcial: rate limit esta importado mas comentado para evitar 429 com polling. |
| RNF-08 | Manter indices para consultas frequentes. | `database/init.sql` e `backend/src/server.ts` criam indices para senha, usuario, atendente e atendimento. | Implementado |
| RNF-09 | Garantir responsividade nas interfaces de cliente e mobile. | CSS scoped em `TicketView.vue`, `ClientView.vue`, `SenhaCard.vue`; layout responsivo em `mobile/lib/main.dart`. | Implementado |
| RNF-10 | Manter painel de TV adequado a fullscreen e sem depender de interacao. | `frontend/src/views/PainelView.vue`; endpoint publico `/api/painel`. | Implementado |
| RNF-11 | Usar tecnologias open-source e sem custo adicional previsto. | Dependencias em `backend/package.json`, `frontend/package.json`, `mobile/pubspec.yaml`; Docker/PostgreSQL/nginx. | Implementado |
| RNF-12 | Facilitar manutencao por separacao de responsabilidades. | Backend separado em `routes`, `controllers`, `models`, `middlewares`, `websocket`; frontend separado em `views`, `stores`, `composables`, `router`. | Implementado no web/backend; mobile ainda parcial por estar em arquivo unico. |
| RNF-13 | Seguir padronizacao visual institucional citada no pre-projeto. | O frontend usa CSS scoped proprio em `frontend/src/views/*.vue` e `frontend/src/style.css`. | Parcial: ha padrao visual consistente, mas nao ha biblioteca/design system Gov.br integrado no codigo atual. |
| RNF-14 | Manter app mobile multiplataforma. | Projeto Flutter em `mobile/`, com `pubspec.yaml`, `mobile/lib/main.dart` e `mobile/Dockerfile`. | Parcial: base Flutter existe, mas o codigo atual usa `dart:html`, o que limita execucao fora do Flutter Web sem adaptacao. |

---

## Endpoints

As rotas de senha estao em `backend/src/routes/senhaRoutes.ts` e sao montadas sob `/api`.
As rotas de autenticacao estao em `backend/src/routes/authRoutes.ts` e sao montadas sob `/auth`.
As rotas de usuarios internos estao em `backend/src/routes/userRoutes.ts` e sao montadas sob `/api/users`.

### Publico

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/api/senha/publica` | Cria senha publica com `tipo` e `deviceId`. |
| GET | `/api/minha-senha/publica?deviceId=` | Busca senha ativa publica do dispositivo. |
| PUT | `/api/minha-senha/cancelar/publica` | Cancela senha publica ativa pelo `deviceId`. |
| GET | `/api/painel` | Retorna dados publicos para o painel de TV. |
| GET | `/api/senhas/status` | Retorna estatisticas publicas da fila. |

### Cliente autenticado por Google

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | `/auth/google` | Inicia login Google OAuth. |
| GET | `/auth/google/callback` | Callback do Google OAuth. |
| POST | `/api/senha` | Cria senha para cliente autenticado. |
| GET | `/api/minha-senha?deviceId=` | Busca senha ativa do dispositivo. |
| PUT | `/api/minha-senha/cancelar` | Cancela a senha ativa do cliente. |
| GET | `/api/meu-historico?deviceId=` | Lista historico do dispositivo. |

### Atendente

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/auth/login-atendente` | Login de atendente por email e senha. |
| GET | `/api/fila` | Retorna senhas do dia e estatisticas. |
| PUT | `/api/chamar` | Chama a proxima senha. |
| PUT | `/api/finalizar/:id` | Finaliza uma senha. |
| PUT | `/api/cancelar/:id` | Cancela uma senha. |

### Administrador

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | `/auth/login-admin` | Login de administrador por email e senha. |
| GET | `/api/senhas` | Lista todas as senhas do dia. |
| GET | `/api/config/atendimento` | Busca configuracao de atendimento. |
| PUT | `/api/config/atendimento` | Salva configuracao de atendimento. |
| PUT | `/api/senha/chamar` | Chama a proxima senha pelo painel admin. |
| PUT | `/api/senha/finalizar/:id` | Finaliza senha pelo painel admin. |
| PUT | `/api/senha/cancelar/:id` | Cancela senha pelo painel admin. |
| GET | `/api/users` | Lista usuarios internos. |
| POST | `/api/users` | Cria atendente ou administrador. |
| PUT | `/api/users/:id` | Atualiza usuario interno. |
| DELETE | `/api/users/:id` | Desativa usuario interno por soft delete. |

---

## Eventos Socket.IO

### Eventos enviados pelo frontend/mobile ao servidor

| Evento | Origem | Descricao |
|---|---|---|
| `register-device` | Cliente publico, cliente Google, mobile | Entra na sala `device-<deviceId>`. |
| `join-admin` | Admin | Entra na sala `admin`. |
| `register-attendant` | Atendente | Registra atendente online e entra na sala `admin`. |
| `unregister-attendant` | Atendente | Remove atendente da contagem online. |

### Eventos emitidos pelo backend

| Evento | Destino | Descricao |
|---|---|---|
| `ticket-created` | `admin`, `device-<deviceId>` | Senha criada. |
| `ticket-called` | `admin`, `device-<deviceId>` | Senha chamada. |
| `your-turn` | `device-<deviceId>` | Notificacao direta para o cliente chamado. |
| `attendance-finished` | `admin`, `device-<deviceId>` | Atendimento finalizado. |
| `ticket-cancelled` | `admin`, `device-<deviceId>` | Senha cancelada. |
| `queue-updated` | Todos | Atualizacao publica resumida da fila. |
| `queue-stats-updated` | Todos | Estatisticas atualizadas com metricas. |
| `attendance-config-updated` | Todos | Configuracao de atendimento alterada. |
| `attendants-online-updated` | Todos | Quantidade de atendentes conectados alterada. |

Observacoes:

- O backend emite os eventos depois das mutacoes no banco.
- Salas por dispositivo usam o formato `device-<deviceId>`.
- A sala `admin` recebe eventos operacionais completos.
- `queue-updated` e `queue-stats-updated` permitem atualizar painel, fila e cards sem depender apenas de polling.

---

## Banco de dados

Schema inicial em `database/init.sql`.

### Tabelas principais

| Tabela | Finalidade |
|---|---|
| `senha` | Senhas emitidas, status, tipo, guiche, dispositivo, timestamps e atendente vinculado. |
| `atendimentos` | Historico de inicio, conclusao, cancelamento e metricas de espera/atendimento. |
| `atendentes` | Usuarios internos de perfil `atendente` ou `administrador`. |
| `usuarios` | Usuarios autenticados via Google OAuth. |
| `sistema_config` | Configuracoes do sistema em JSONB. |
| `admins` | Tabela legada, mantida no schema, mas autenticacao atual usa `atendentes`. |

### Views e indices

- `vw_fila_status`: totais por status e tipo.
- `vw_tempo_medio_espera`: metricas de espera do ultimo dia.
- Indices em `senha.status`, `senha.tipo`, `senha.dispositivo_id`, `senha.numero`, `senha.data_atendimento`, `senha.codigo_verificacao`, `atendimentos.senha_id`, `usuarios.email`, `usuarios.google_id`, `atendentes.email` e `atendentes.perfil`.

### Usuarios padrao

| Perfil | Email | Senha |
|---|---|---|
| Atendente | `atendente@senhas.com` | `senha123` |
| Administrador | `admin@senhas.com` | `admin123` |

---

## Usuarios e permissoes

| Perfil | Autenticacao | Acesso principal |
|---|---|---|
| Publico | Sem login, identificado por `deviceId` | `TicketView` e `/painel`. |
| Usuario Google | Google OAuth com JWT | `ClientView`. |
| Atendente | Email/senha com JWT e perfil `atendente` | `AtendenteView`. |
| Administrador | Email/senha com JWT e perfil `administrador` | `AdminView`. |

### Rotas web

| Rota | View | Perfil |
|---|---|---|
| `/` | `TicketView.vue` | Publico |
| `/login` | `LoginView.vue` | Publico |
| `/client` | `ClientView.vue` | Usuario Google |
| `/atendente` | `AtendenteView.vue` | Atendente autenticado |
| `/admin` | `AdminView.vue` | Administrador autenticado |
| `/painel` | `PainelView.vue` | Publico/TV |

O guard atual verifica `requiresAuth` para `/atendente` e impede usuarios Google de acessarem `/admin` e `/atendente`. A autorizacao forte dos endpoints administrativos e de atendimento fica nos middlewares do backend.

---

## Interface web e mobile

### Frontend web

Stack atual conforme `frontend/package.json`:

- Vue 3.3
- Vite 5
- Pinia 2
- Vue Router 4
- Axios 1.6
- Socket.IO Client 4.8

Responsabilidades:

- `frontend/src/stores/auth.js`: token, usuario e flags de perfil.
- `frontend/src/stores/queue.js`: chamadas REST relacionadas a fila.
- `frontend/src/composables/useSocket.js`: conexao Socket.IO, registro de dispositivo, admin e atendente.
- `TicketView.vue`: retirada publica e acompanhamento inicial.
- `ClientView.vue`: acompanhamento do cliente autenticado.
- `AtendenteView.vue`: chamada, finalizacao e cancelamento por atendente.
- `AdminView.vue`: gestao da fila, usuarios internos e configuracao de atendimento.
- `PainelView.vue`: painel publico/TV em tela cheia.

### Mobile Flutter

O app mobile atual esta implementado em `mobile/lib/main.dart`, com:

- retirada de senha publica ou autenticada;
- login Google via redirecionamento web;
- acompanhamento por `deviceId`;
- cancelamento de senha;
- Socket.IO para `queue-updated`, `your-turn`, `ticket-called`, `attendance-finished` e `ticket-cancelled`.

Observacao: o `pubspec.yaml` atual usa SDK Dart `>=2.12.0 <3.0.0` e dependencias `http` e `socket_io_client`. Nao ha implementacao Firebase/push notification no estado atual do repositorio.

---

## Execucao e verificacao

### Docker

```bash
docker compose up
docker compose ps
docker compose logs
docker compose build
```

### Frontend

```bash
cd frontend
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
```

### Backend

```bash
cd backend
npm.cmd run build
npm.cmd run typecheck
```

Para checagens pontuais de sintaxe em arquivos TypeScript:

```bash
cd backend
npx tsc --noEmit
```

---

## Situacao do projeto

### Implementado

- Backend REST com Express e TypeScript.
- Autenticacao JWT para atendente/admin.
- Google OAuth para usuario cliente.
- Socket.IO com salas por dispositivo e sala administrativa.
- Retirada publica de senha por `deviceId`.
- Controle de senha ativa por dispositivo e por dia.
- Chamada, finalizacao e cancelamento de senhas.
- Regra 3x1 para priorizacao.
- Painel publico `/painel`.
- Configuracao administrativa de dias, horarios e tempo medio de atendimento.
- Estimativa dinamica baseada em fila, regra 3x1 e atendentes online.
- Historico e metricas na tabela `atendimentos`.
- CRUD de usuarios internos pelo admin.
- App mobile Flutter funcional em arquivo unico.

### Pontos de atencao

- O contador da regra 3x1 ainda fica em memoria; em multiplas instancias do backend ele pode divergir.
- A tabela `admins` existe como legado, mas login admin atual usa `atendentes`.
- O mobile ainda esta concentrado em `main.dart`; pode ser modularizado em services, screens e state management.
- Nao ha Firebase/push notification implementado no mobile atual.
- O guard do frontend protege parcialmente por rota, mas a seguranca real deve continuar no backend.
- Senhas padrao do seed devem ser alteradas em ambiente real.

---

## Projeto aos moldes da FICE

### Identificacao

| Campo | Informacao |
|---|---|
| Titulo | Sistema de Senhas Online para Atendimento |
| Area | Ciencias Exatas e da Terra - Ciencia da Computacao |
| Subarea | Engenharia de Software / Sistemas Distribuidos |
| Instituicao | Instituto Federal Catarinense - Campus Videira |
| Curso | Bacharelado em Ciencia da Computacao |
| Autores | Alessandra Correa, Celia Raizer e Everton Serighelli |
| Periodo | Fevereiro a Julho de 2026 |

### Problema

Sistemas de senha tradicionais obrigam o usuario a se deslocar fisicamente apenas para retirar uma senha, reduzem a previsibilidade da espera e dificultam o acompanhamento remoto. Para a organizacao, a ausencia de dados dificulta acompanhar fluxo, tempo medio e alocacao de atendentes.

### Objetivo geral

Desenvolver um sistema digital de gerenciamento de filas que permita retirada de senha, acompanhamento em tempo real, chamada por atendentes, painel publico e estimativa de atendimento.

### Objetivos especificos

1. Implementar API REST com Node.js, Express, TypeScript e PostgreSQL.
2. Implementar comunicacao em tempo real com Socket.IO.
3. Criar interface web com Vue 3 para cliente, atendente, administrador e painel publico.
4. Criar app mobile Flutter para retirada e acompanhamento de senha.
5. Disponibilizar execucao padronizada com Docker Compose e nginx.
6. Registrar metricas de atendimento para apoiar analise do fluxo.

### Resultados esperados

- Sistema integrado com backend, frontend web, banco e mobile.
- Acompanhamento em tempo real da fila.
- Reducao do tempo de espera percebido pelo usuario.
- Dados de atendimento para apoiar gestao.
- Solucao replicavel em outros ambientes via Docker.

### Checklist FICE

- [x] Projeto com aplicacao pratica e relevancia social.
- [x] Backend, frontend, banco e tempo real integrados.
- [x] Autores vinculados ao IFC Campus Videira.
- [x] Uso de tecnologias atuais e open-source.
- [x] Documentacao tecnica do estado atual.
- [ ] Poster/banner para apresentacao.
- [ ] Revisao final de seguranca para ambiente real.

---

*IFC Campus Videira - Ciencia da Computacao - 2026*
