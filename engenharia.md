#  Documentação de Engenharia de Software

**Sistema de Senhas Online para Atendimento**  
Instituto Federal Catarinense — Campus Videira | Ciência da Computação | 2026

> Alessandra Corrêa · Célia Raizer · Everton Serighelli

---

## Sumário

- [1. Plano de Projeto](#1-plano-de-projeto)
- [2. Regras de Negócio](#2-regras-de-negócio)
- [3. Requisitos de Sistema](#3-requisitos-de-sistema)
  - [3.1 Requisitos Funcionais](#31-requisitos-funcionais)
  - [3.2 Requisitos Não-Funcionais](#32-requisitos-não-funcionais)
- [4. Usuários, Perfis e Permissões](#4-usuários-perfis-e-permissões)
- [5. Protótipos de Alto Nível](#5-protótipos-de-alto-nível)
- [6. Interface Web — UI/UX e Responsividade](#6-interface-web--uiux-e-responsividade)
- [7. Projeto aos Moldes da FICE](#7-projeto-aos-moldes-da-fice)

---

## 1. Plano de Projeto

### Visão Geral

Desenvolvimento de um sistema para gerenciamento digital de filas de atendimento. A solução permite que usuários retirem senhas remotamente, 
acompanhem a fila em tempo real e visualizem a estimativa de horário de atendimento. Atendentes gerenciam as chamadas pelo frontend web,
e um painel local exibe a senha chamada e o tempo médio de espera.

### Escopo

**Incluído:**
- Backend REST em Node.js + TypeScript com comunicação em tempo real via WebSocket (Socket.IO)
- Frontend web (Vue.js) para atendentes e painel de exibição local
- Banco de dados relacional PostgreSQL
- Infraestrutura com Docker e controle de versão via GitHub


### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + TypeScript, Express, Socket.IO |
| Frontend Web | Vue.js 3 (Composition API) |
| Banco de Dados | PostgreSQL 16 |
| Infraestrutura | Docker, Docker Compose, GitHub |
| Prototipação | Figma |

### Cronograma

| Atividade | Fev | Mar | Abr | Mai | Jun |
|---|:---:|:---:|:---:|:---:|:---:|
| Levantamento de requisitos | ✅ | | | | |
| Estudo de tecnologias e ferramentas | ✅ | ✅ | | | |
| Prototipação no Figma | | | ✅ | ✅ | |
| Configuração da infraestrutura (Docker, CI) | | | | ✅ | ✅ |
| Desenvolvimento — Backend (API REST + WebSocket) | | | ✅ | ✅ | ✅ |
| Desenvolvimento — Frontend Web (Vue.js) | | | ✅ | ✅ | ✅ |
| Testes de funcionamento e integração | | | | ✅ | ✅ |
| Ajustes e correções pós-teste | | | | | ✅ |
| Finalização da documentação e entrega | | | | | ✅ |

---

## 2. Regras de Negócio

### Gestão de Senhas

| Código | Regra |
|---|---|
| **RN-01** | Cada senha emitida recebe um número sequencial único por serviço e por dia. |
| **RN-02** | Uma senha pode ser do tipo **Normal (N)** ou **Prioritária (P)**. Senhas prioritárias são intercaladas na fila com preferência de chamada 3x1. |
| **RN-03** | O sistema admite no máximo uma senha ativa por pessoa por serviço simultaneamente. Tentativas de retirada duplicada são bloqueadas. |
| **RN-04** | O usuário pode cancelar sua própria senha pelo aplicativo mobile enquanto ela não tiver sido chamada. |
| **RN-05** | Não é possível editar o número ou tipo de uma senha após a emissão. |

### Chamada de Atendimento

| Código | Regra |
|---|---|
| **RN-06** | Somente usuários com perfil **Atendente** podem chamar a próxima senha de uma fila. |
| **RN-07** | O atendente pode marcar uma senha como **cancelada** quando o usuário não comparecer. A senha é então cancelada. |
| **RN-08** | Ao chamar uma senha, o sistema emite alerta visual no painel local e notificação push no aplicativo do usuário. |
| **RN-09** | O tempo de atendimento é registrado automaticamente: início (quando a senha é chamada) e fim (quando o atendente encerra o atendimento). |

### Estimativa de Tempo de Espera

| Código | Regra |
|---|---|
| **RN-10** | O Tempo Médio de Atendimento (TMA) é calculado com base nos **últimos 10 atendimentos finalizados** do serviço no dia corrente. |
| **RN-11** | O Tempo Estimado de Espera (TEE) é calculado como: `TEE = posição na fila × TMA`. O valor é exibido no aplicativo e no painel. |
| **RN-12** | Quando o histórico do dia for menor que 5 atendimentos, utiliza-se o **TMA padrão** configurado pelo administrador. |

### Serviços e Configurações

| Código | Regra |
|---|---|
| **RN-15** | Um estabelecimento pode ter múltiplos serviços, cada um com sua própria fila independente. |
| **RN-16** | Um serviço pode ser ativado ou desativado pelo administrador. Serviços desativados não aceitam novas senhas. |
| **RN-17** | A fila de cada serviço pode ter um limite máximo de senhas configurável. Ao atingir o limite, novas emissões são bloqueadas. |

---

