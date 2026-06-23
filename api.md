# API - Retirada de Senhas Online

Referencia rapida dos endpoints da API, com exemplos reais de payload. Para
explorar a API de forma interativa (incluindo respostas e schemas completos),
use o Swagger UI:

| Ambiente | URL |
|---|---|
| Via Docker (nginx, porta 80) | `http://localhost/api-docs` ou `http://127.0.0.1/api-docs` |
| Backend direto (porta exposta no `docker-compose.yml`) | `http://localhost:3000/api-docs` |

---

## Autenticacao

### `POST /auth/login-admin`

Login de administrador por email e senha.

```json
{
  "email": "admin@senhas.com",
  "senha": "admin123"
}
```

Resposta `200`: `{ "token": "...", "usuario": { ... } }`.
Resposta `401`: credenciais invalidas.

### `POST /auth/login-atendente`

Login de atendente por email e senha.

```json
{
  "email": "atendente@senhas.com",
  "senha": "senha123"
}
```

Mesmo formato de resposta do login-admin.

### `GET /auth/google`

Inicia o login OAuth com Google. Acesse direto no navegador (nao funciona pelo
"Try it out" do Swagger, pois o fluxo depende de redirect com login externo):

```
http://127.0.0.1/auth/google
```

### `GET /auth/google/callback`

Callback chamado pelo Google apos o login. Nao deve ser chamado manualmente.

---

## Senhas - rotas publicas (sem login)

### `POST /api/senha/publica`

Retira uma senha publica, sem autenticacao.

```json
{
  "tipo": "normal",
  "deviceId": "123e4567-e89b-12d3-a456-426614174000"
}
```

- `tipo`: `"normal"` ou `"prioritario"`.
- `deviceId`: opcional; se omitido, o backend gera um novo.

Resposta `201`: senha criada. Resposta `400`: tipo nao informado ou retirada
bloqueada por regra de horario/dia (ver `RN-16` a `RN-18` no `Engenharia.md`).

### `GET /api/minha-senha/publica`

Retorna a senha publica ativa do dispositivo.

| Parametro | Tipo | Onde | Obrigatorio |
|---|---|---|---|
| `deviceId` | string | query | sim |

```
GET /api/minha-senha/publica?deviceId=123e4567-e89b-12d3-a456-426614174000
```

### `PUT /api/minha-senha/cancelar/publica`

Cancela a senha publica ativa do dispositivo.

```json
{
  "deviceId": "123e4567-e89b-12d3-a456-426614174000"
}
```

> O `deviceId` vai no corpo da requisicao (`body`), nao na query string.

### `GET /api/painel`

Dados publicos para o painel de TV. Sem parametros.

### `GET /api/senhas/status`

Estatisticas publicas da fila (contagem por status/tipo). Sem parametros.

---

## Senhas - cliente autenticado (Google OAuth)

Todas as rotas abaixo exigem o header `Authorization: Bearer <token>`,
obtido apos o login com Google.

### `POST /api/senha`

Cria senha para o cliente autenticado.

```json
{
  "tipo": "normal",
  "deviceId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### `GET /api/minha-senha`

Retorna a senha ativa do dispositivo do cliente autenticado.

```
GET /api/minha-senha?deviceId=123e4567-e89b-12d3-a456-426614174000
```

### `PUT /api/minha-senha/cancelar`

Cancela a senha ativa do cliente autenticado.

```json
{
  "deviceId": "123e4567-e89b-12d3-a456-426614174002"
}
```

### `GET /api/meu-historico`

Lista o historico de senhas do dispositivo.

```
GET /api/meu-historico?deviceId=123e4567-e89b-12d3-a456-426614174000
```

---

## Fila - atendente

Rotas que exigem `Authorization: Bearer <token>` de um usuario com perfil
`atendente` (administradores tambem tem acesso).

### `GET /api/fila`

Retorna as senhas do dia e estatisticas da fila. Sem parametros.

### `PUT /api/chamar`

Chama a proxima senha da fila.

```json
{
  "guiche": "Guiche 3"
}
```

> `guiche` e opcional; se omitido, a senha e chamada sem guiche associado.

### `PUT /api/finalizar/{id}`

Finaliza a senha com o `id` informado no path. Sem corpo.

### `PUT /api/cancelar/{id}`

Cancela a senha com o `id` informado no path. Sem corpo.

---

## Fila - administrador

Rotas que exigem `Authorization: Bearer <token>` de um usuario com perfil
`administrador`.

### `GET /api/senhas`

Lista todas as senhas do dia. Sem parametros.

### `GET /api/config/atendimento`

Retorna a configuracao atual de dias e horarios de atendimento. Sem parametros.

### `PUT /api/config/atendimento`

Salva a configuracao de atendimento.

```json
{
  "diasAtendimento": [1, 2, 3, 4, 5],
  "horaInicioEntrega": "08:00",
  "horaInicioAtendimento": "08:00",
  "horaFimAtendimento": "18:00",
  "tempoMedioAtendimentoMinutos": 5
}
```

- `diasAtendimento`: lista de dias da semana (0 = domingo ... 6 = sabado).

### `PUT /api/senha/chamar`

Equivalente administrativo de `PUT /api/chamar` (mesmo payload, `guiche` opcional).

### `PUT /api/senha/finalizar/{id}`

Equivalente administrativo de `PUT /api/finalizar/{id}`.

### `PUT /api/senha/cancelar/{id}`

Equivalente administrativo de `PUT /api/cancelar/{id}`.

---

## Usuarios internos (administrador)

Rotas que exigem `Authorization: Bearer <token>` de um usuario com perfil
`administrador`.

### `GET /api/users`

Lista os usuarios internos (atendentes e administradores). Sem parametros.

### `POST /api/users`

Cria um novo usuario interno.

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456",
  "perfil": "atendente"
}
```

- `perfil`: `"atendente"` ou `"administrador"`.
- Todos os campos sao obrigatorios. Resposta `400` se algum estiver ausente
  ou se `perfil` for invalido.

### `PUT /api/users/{id}`

Atualiza um usuario interno existente. Aceita atualizacao parcial — envie
apenas os campos que deseja alterar.

```json
{
  "email": "joaosilva@gmail.com"
}
```

Tambem aceita `nome`, `senha` e `perfil` no mesmo formato. Resposta `404` se
o `id` nao existir.

### `DELETE /api/users/{id}`

Desativa (soft delete) um usuario interno — define `ativo = false`, sem
remover o registro do banco. Sem corpo.

---

## Telas (frontend, ambiente Docker)

Referencia rapida das URLs do frontend, util para QA manual.

| Tela | URLs |
|---|---|
| Login | `http://localhost` / `http://127.0.0.1` |
| Cliente (apos login Google) | `http://localhost/client` / `http://127.0.0.1/client` |
| Atendente | `http://localhost/atendente` / `http://127.0.0.1/atendente` |
| Admin | `http://localhost/admin` / `http://127.0.0.1/admin` |
| Painel | `http://localhost/painel` / `http://127.0.0.1/painel` |

---

## Usuarios padrao (seed)

| Perfil | Email | Senha |
|---|---|---|
| Atendente | `atendente@senhas.com` | `senha123` |
| Administrador | `admin@senhas.com` | `admin123` |

> Trocar essas credenciais antes de qualquer ambiente real/producao.
