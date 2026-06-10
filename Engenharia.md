
# Sistema de Senhas Online para Atendimento

Sistema distribuído para gerenciamento digital de filas de atendimento,
desenvolvido como Projeto Aplicado do curso de Ciência da Computação do IFC Campus Videira.

> **Alessandra Corrêa · Célia Raizer · Everton Serighelli** — 2026

---

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Plano de Projeto](#plano-de-projeto)
- [Regras de Negócio](#regras-de-negócio)
- [Requisitos de Sistema](#requisitos-de-sistema)
- [Usuários, Perfis e Permissões](#usuários-perfis-e-permissões)
- [Protótipos de Alto Nível](#protótipos-de-alto-nível)
- [Interface Web — UI/UX e Responsividade](#interface-web--uiux-e-responsividade)
- [Projeto aos Moldes da FICE](#projeto-aos-moldes-da-fice)

---

## Sobre o Projeto

O sistema permite que usuários retirem senhas **remotamente** pelo aplicativo mobile, acompanhem sua posição na fila em tempo real e recebam uma estimativa de horário de atendimento. Atendentes gerenciam as chamadas pela interface web, e um painel local (TV/monitor) exibe automaticamente a senha em atendimento via WebSocket.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      Nginx (porta 80)                   │
│              Reverse Proxy + Serve Frontend             │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
     ┌───────▼──────┐       ┌────────▼────────┐
     │  Frontend    │       │    Backend API  │
     │  Vue.js 3    │       │  Node.js + Exp  │
     │  Pinia       │◄─────►│  Socket.IO      │
     │  Vue Router  │  WS   │  Passport/JWT   │
     │  Socket.IO   │       │  porta 3000     │
     └──────────────┘       └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL 15  │
                            │   porta 5432     │
                            └─────────────────┘

     ┌──────────────┐
     │  Mobile App  │
     │  Flutter     │──────────────────────────► Backend API
     │  Provider    │          HTTP + WS
     │  go_router   │
     └──────────────┘
```

Toda a infraestrutura roda em **Docker Compose** com rede interna `senhas_network`.

---

## Plano de Projeto

### Escopo

**Incluído:**
- Backend REST (Node.js + Express) com autenticação JWT e Google OAuth
- WebSocket em tempo real com Socket.IO
- Frontend web (Vue.js 3 + Pinia) com 5 views distintas por perfil
- App mobile multiplataforma (Flutter) com notificações push via Firebase
- Banco de dados PostgreSQL com views e índices otimizados
- Infraestrutura completa com Docker Compose e Nginx


### Cronograma

| Atividade | Fev | Mar | Abr | Mai | Jun |
|---|:---:|:---:|:---:|:---:|:---:|
| Levantamento de requisitos | ✅ | | | | |
| Estudo de tecnologias | ✅ | ✅ | | | |
| Prototipação no Figma | | | ✅ | ✅ | |
| Configuração infraestrutura (Docker, CI) | | | ✅ | | |
| Desenvolvimento Backend (API + WebSocket) | | | ✅ | ✅ | ✅ |
| Desenvolvimento Frontend Web (Vue.js) | | | ✅ | ✅ | ✅ |
| Desenvolvimento Mobile (Flutter) | | |  | ✅ | ✅ |
| Testes de integração | | | | ✅ | ✅ |
| Ajustes pós-teste | | | | | ✅ |
| Documentação e entrega | | | | | ✅ |

---

## Regras de Negócio

As regras abaixo foram implementadas principalmente em `backend/src/models/senhaModel.js`.

### Gestão de Senhas

| Código | Regra |
|---|---|
| **RN-01** | Cada senha recebe número sequencial único por tipo e dia, com prefixo `N` (normal) ou `P` (prioritário). Ex.: `N001`, `P001`. A numeração é contínua e não reseta por dia na versão atual. |
| **RN-02** | Senhas são do tipo `normal` ou `prioritario`. A fila segue a **regra 3×1**: a cada 3 prioritárias chamadas consecutivas, 1 normal é forçada. |
| **RN-03** | Um dispositivo (`dispositivo_id`) só pode ter **uma senha ativa** (`esperando` ou `chamando`) por vez. Tentativa duplicada retorna erro. |
| **RN-04** | Senha com status `chamando` ao chamar a próxima é automaticamente marcada como `atendido`. |
| **RN-05** | O usuário pode cancelar sua senha pelo app enquanto o status for `esperando`. Senhas com status `chamando` não podem ser canceladas. |
| **RN-06** | O número e tipo de uma senha não podem ser alterados após a emissão. |

### Cálculo de Tempo Estimado de Espera

| Código | Regra |
|---|---|
| **RN-07** | O Tempo Estimado de Espera (TEE) é calculado como: `posição na fila (simulada pela ordem 3×1) × TEMPO_MEDIO_ATENDIMENTO`. |
| **RN-08** | O tempo médio fixo está definido em `5 minutos` por atendimento (`TEMPO_MEDIO_ATENDIMENTO = 5` em `senhaModel.js`). |
| **RN-09** | A posição é simulada iterando a fila atual e aplicando a regra 3×1 para descobrir em que lugar a senha será chamada. |

### Chamada de Atendimento

| Código | Regra |
|---|---|
| **RN-10** | Somente perfis `atendente` ou `administrador` podem chamar a próxima senha (`PUT /api/chamar`). |
| **RN-11** | O contador 3×1 (`contadorPrioritarias`) é mantido em memória no processo Node.js. Reinicia se o servidor for reiniciado. |
| **RN-12** | O atendente finaliza a senha chamando `PUT /api/finalizar/:id`, que muda o status para `atendido`. |
| **RN-13** | Atendentes e administradores podem cancelar qualquer senha via `PUT /api/cancelar/:id`. |

---

## Requisitos de Sistema

### Requisitos Funcionais

#### Acesso Público (sem autenticação)

| Código | Endpoint | Descrição | Prioridade |
|---|---|---|:---:|
| **RF-01** | `POST /api/senha/publica` | Retirar senha sem login, identificado por `deviceId` | Alta |
| **RF-02** | `GET /api/minha-senha/publica?deviceId=` | Ver posição e tempo estimado sem login | Alta |
| **RF-03** | `GET /api/senhas/status` | Status público da fila (esperando, chamando, totais) | Alta |

#### Usuário (Google OAuth)

| Código | Endpoint | Descrição | Prioridade |
|---|---|---|:---:|
| **RF-04** | `GET /auth/google` | Iniciar autenticação Google OAuth 2.0 | Alta |
| **RF-05** | `POST /api/senha` | Retirar senha como usuário autenticado | Alta |
| **RF-06** | `GET /api/minha-senha?deviceId=` | Acompanhar posição na fila | Alta |
| **RF-07** | `PUT /api/minha-senha/cancelar` | Cancelar própria senha | Alta |
| **RF-08** | `GET /api/meu-historico?deviceId=` | Histórico de senhas do dispositivo | Média |

#### Atendente

| Código | Endpoint | Descrição | Prioridade |
|---|---|---|:---:|
| **RF-09** | `POST /auth/login-atendente` | Login com e-mail e senha | Alta |
| **RF-10** | `GET /api/fila` | Obter fila com estatísticas em tempo real | Alta |
| **RF-11** | `PUT /api/chamar` | Chamar próxima senha (regra 3×1) | Alta |
| **RF-12** | `PUT /api/finalizar/:id` | Encerrar atendimento da senha | Alta |
| **RF-13** | `PUT /api/cancelar/:id` | Cancelar senha da fila | Alta |

#### Administrador

| Código | Endpoint | Descrição | Prioridade |
|---|---|---|:---:|
| **RF-14** | `POST /auth/login-admin` | Login de administrador | Alta |
| **RF-15** | `GET /api/senhas` | Listar todas as senhas | Alta |
| **RF-16** | `PUT /api/senha/chamar` | Chamar próxima (via painel admin) | Alta |
| **RF-17** | `PUT /api/senha/finalizar/:id` | Finalizar senha (via painel admin) | Alta |
| **RF-18** | `PUT /api/senha/cancelar/:id` | Cancelar senha (via painel admin) | Alta |
| **RF-19** | `GET /api/users` | Listar atendentes | Alta |
| **RF-20** | `POST /api/users` | Criar atendente ou admin | Alta |
| **RF-21** | `PUT /api/users/:id` | Editar atendente | Alta |
| **RF-22** | `DELETE /api/users/:id` | Desativar atendente (soft delete) | Alta |

#### WebSocket (Socket.IO)

| Código | Evento | Direção | Descrição |
|---|---|:---:|---|
| **RF-23** | `join-queue` | Cliente → Servidor | Entrar na sala da fila com e-mail e número |
| **RF-24** | `leave-queue` | Cliente → Servidor | Sair da sala da fila |
| **RF-25** | `call-next` | Servidor → Cliente | Notificar usuário que sua senha foi chamada |
| **RF-26** | `queue-updated` | Servidor → Todos | Broadcast de atualização da fila |
| **RF-27** | `finish-attendance` | Servidor → Cliente | Notificar fim do atendimento |
| **RF-28** | `ticket-cancelled` | Servidor → Cliente | Notificar cancelamento de senha |
| **RF-29** | `queue-stats-updated` | Servidor → Todos | Atualizar estatísticas para painéis |

### Requisitos Não-Funcionais

| Código | Categoria | Descrição |
|---|:---:|---|
| **RNF-01** | Segurança | Autenticação via JWT (expiração 8h para atendentes/admin, 1d para Google OAuth). Tokens verificados pelos middlewares `authMiddleware`, `adminMiddleware` e `atendenteMiddleware`. |
| **RNF-02** | Segurança | Helmet configurado para headers HTTP seguros. Rate limiting: 100 requisições por IP a cada 15 minutos. |
| **RNF-03** | Desempenho | Índices no PostgreSQL em `status`, `tipo`, `dispositivo_id`, `numero` e `codigo_verificacao` da tabela `senha`. |
| **RNF-04** | Portabilidade | App Flutter compatível com Android 8.0+ e iOS 14+ (SDK `>=3.0.0 <4.0.0`). |
| **RNF-05** | Escalabilidade | WebSocket via Socket.IO com salas por e-mail de usuário, evitando broadcast desnecessário. |


---

## Usuários, Perfis e Permissões

O sistema possui quatro perfis, controlados pelos middlewares em `backend/src/middlewares/`.

### Perfis

| Perfil | Autenticação | Acesso Principal |
|---|---|---|
| **Público** | Nenhuma | `TicketView` — retirada e acompanhamento de senha por `deviceId` |
| **Usuário Google** | Google OAuth → JWT | `ClientView` — acompanhamento com conta vinculada |
| **Atendente** | Login e-mail/senha → JWT (perfil `atendente`) | `AtendenteView` — chamadas e gestão da fila |
| **Administrador** | Login e-mail/senha → JWT (perfil `administrador` ou `admin`) | `AdminView` — gestão completa |

### Rotas do Frontend por Perfil

| Rota | View | Perfil Necessário |
|---|---|---|
| `/` | `TicketView` | Público |
| `/login` | `LoginView` | Público |
| `/client` | `ClientView` | Usuário Google |
| `/atendente` | `AtendenteView` | Atendente (requiresAuth) |
| `/admin` | `AdminView` | Administrador |

### Matriz de Permissões por Endpoint

| Funcionalidade | Público | Google | Atendente | Admin |
|---|:---:|:---:|:---:|:---:|
| Retirar senha pública | ✅ | ✅ | ✅ | ✅ |
| Ver status da fila | ✅ | ✅ | ✅ | ✅ |
| Ver minha senha / posição | ✅ | ✅ | — | — |
| Cancelar minha senha | ✅ | ✅ | — | — |
| Ver histórico próprio | ✅ | ✅ | — | — |
| Ver fila com estatísticas | — | — | ✅ | ✅ |
| Chamar próxima senha | — | — | ✅ | ✅ |
| Finalizar / cancelar senha | — | — | ✅ | ✅ |
| Listar todas as senhas | — | — | — | ✅ |
| Gerenciar atendentes (CRUD) | — | — | — | ✅ |

---

## Protótipos de Alto Nível

Os protótipos interativos de alta fidelidade estão disponíveis no Figma:

### 🔗 [https://www.figma.com/design/KSGf5r77BULROEpJnaQmTU/Senhas-Online?node-id=0-1&t=RcbmXVCFRWuwXF4H-1)

---

O protótipo cobre os seguintes fluxos e telas, espelhando as views implementadas no Vue.js e Flutter:

### Frontend Web

| View | Arquivo | Telas/Fluxos Contemplados |
|---|---|---|
| Retirada pública | `TicketView.vue` | Seleção de tipo (normal/prioritário), exibição da senha gerada, código de verificação, acompanhamento por `deviceId` |
| Login | `LoginView.vue` | Login atendente/admin com e-mail e senha |
| Painel do atendente | `AtendenteView.vue` | Lista da fila, botão chamar próxima, estatísticas (esperando, chamando, atendidos) |
| Painel administrativo | `AdminView.vue` | Visão geral, gerenciamento de atendentes, chamada e finalização de senhas |
| Área do cliente Google | `ClientView.vue` | Acompanhamento de fila pós-login Google, posição e tempo estimado |

### App Mobile (Flutter)

| Screen | Arquivo | Descrição |
|---|---|---|
| Home | `home_screen.dart` | Tela inicial: status da fila e ações rápidas |
| Retirar senha | `get_ticket_screen.dart` | Seleção de tipo e confirmação da senha retirada |
| Minha senha | `my_ticket_screen.dart` | Posição na fila, tempo estimado, opção de cancelar |
| Login | `login_screen.dart` | Login Google para usuários com conta |
| Admin | `admin_screen.dart` | Funcionalidades administrativas no mobile |

---

## Interface Web — UI/UX e Responsividade

### Stack de Interface

O frontend web utiliza **Vue.js 3** com Composition API, **Pinia** para gerenciamento de estado e **Vue Router 4** com guards de navegação.

Dependências de UI:
- `vue` 3.3.4
- `pinia` 2.1.6 — estado global (auth + queue)
- `vue-router` 4.2.5 — roteamento com guards por perfil
- `axios` 1.6.2 — requisições HTTP
- `socket.io-client` 4.8.3 — eventos em tempo real
- Build com `vite` 5 + `@vitejs/plugin-vue`

### Separação de Responsabilidades

```
src/stores/auth.js    → token JWT, dados do usuário, flags isAdmin/isGoogleUser
src/stores/queue.js   → estado da fila, senhas, estatísticas
src/router/guards.js  → proteção de rotas conforme perfil
src/views/            → uma view por perfil de usuário
```

### Responsividade e Fluxo de Navegação

O roteamento protege cada perfil: usuários sem token são redirecionados para `/login` ao tentar acessar `/atendente`. O estado de autenticação é persistido no `localStorage` (token, user, isAdmin, isGoogleUser).

As views são independentes e carregadas sob demanda pelo Vue Router, evitando carregamento desnecessário de componentes de outros perfis.

### Comunicação em Tempo Real

O cliente Socket.IO no frontend se conecta ao mesmo servidor Node.js. Eventos relevantes para o usuário atual são recebidos via salas nomeadas por e-mail (`queue-{email}`), minimizando tráfego desnecessário.

---

## Projeto aos Moldes da FICE

### Identificação

| Campo | Informação |
|---|---|
| **Título** | Sistema de Senhas Online para Atendimento |
| **Área** | Ciências Exatas e da Terra — Ciência da Computação |
| **Subárea** | Engenharia de Software / Sistemas Distribuídos |
| **Instituição** | Instituto Federal Catarinense — Campus Videira |
| **Curso** | Bacharelado em Ciência da Computação |
| **Autores** | Alessandra Corrêa · Célia Raizer · Everton Serighelli |
| **Período** | Fevereiro – Julho de 2026 |

### Problema e Justificativa

Sistemas de senha tradicionais obrigam o usuário ao deslocamento físico apenas para retirar uma senha, impedem atividades paralelas durante a espera e oferecem pouca previsibilidade sobre o tempo de espera. Esses problemas impactam a qualidade do serviço e a experiência do usuário (WINGSYS, 2024; NEXTQS, 2026).

Do ponto de vista organizacional, a ausência de dados sobre o fluxo de atendimento dificulta a alocação eficiente de equipes (IDWORKS, 2026). O projeto propõe uma solução tecnológica gratuita e open-source para modernizar o atendimento presencial.

### Objetivos

**Geral:** Desenvolver um sistema de gerenciamento digital de filas que permita retirada remota de senhas, acompanhamento em tempo real e estimativa de horário de atendimento.

**Específicos:**
1. Implementar app mobile (Flutter) para retirada e acompanhamento remoto de senhas
2. Desenvolver frontend web (Vue.js 3) para atendentes e painel administrativo
3. Criar API REST (Node.js + TypeScript) com comunicação em tempo real via Socket.IO
4. Utilizar PostgreSQL como banco relacional e Docker para padronização do ambiente
5. Publicar código-fonte no GitHub com documentação de instalação e uso

### Resultados Esperados

- Sistema funcional com os três módulos integrados (backend, frontend web e mobile)
- Redução do tempo de espera percebido por meio de notificações e estimativas em tempo real
- Coleta automática de métricas de atendimento (estatísticas via `vw_fila_status` e `vw_tempo_medio_espera`)
- Código aberto e documentado, replicável em outros estabelecimentos via Docker

### Impacto Social e Inovação

A solução é **gratuita**, **open-source** e implantável com `docker compose up`, viabilizando uso por organizações com recursos limitados: órgãos públicos, clínicas, instituições de ensino e empresas de serviços. O acesso sem cadastro (`TicketView` + `deviceId`) reduz a barreira de entrada para qualquer usuário.

### Checklist de Conformidade FICE

- [x] Projeto com aplicação prática e relevância social
- [x] Documentação técnica completa (pré-projeto, requisitos, protótipos)
- [x] Autores vinculados ao IFC Campus Videira
- [x] Código-fonte disponível e versionado no GitHub
- [x] Uso de tecnologias atuais e relevantes
- [x] Sem custos para a instituição (ferramentas open-source)
- [ ] Poster/banner para apresentação na FICE *(a produzir)*

---

*IFC Campus Videira — Ciência da Computação — 2026*
