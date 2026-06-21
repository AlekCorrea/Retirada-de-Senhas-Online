//Swagger UI, direto no backend (porta exposta no docker-compose.yml)
http://localhost:3000/api-docs
//Swagger UI, direto no backend (porta exposta no docker-compose.yml)
http://localhost/api-docs

{
  "email": "admin@senhas.com",
  "senha": "admin123"
}

POST /api/users Cria novo usuário
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456",
  "perfil": "atendente"
}

PUT /api/users/{id} Atualiza usuário existente
{
  "email": "joaosilva@gmail.com"
}

PUBLICAR /api /senha /publica Retirar uma senha pública sem login
{
  "tipo": "normal",
  "deviceId": "123e4567-e89b-12d3-a456-426614174000"
}

GET /api/minha-senha/publica Retorna a senha pública atual
Name	Description
deviceId *
string
(query)
ID do dispositivo do usuário

123e4567-e89b-12d3-a456-426614174000

//tela login
http://localhost
http://127.0.0.1

//tela atendente
http://localhost/atendente
http://127.0.0.1/atendente

tela admin
http://localhost/admin
http://127.0.0.1/admin

tela painel
http://localhost/painel
http://127.0.0.1/painel

Documentação API
http://localhost:3000/api-docs
http://localhost/api-docs


PUT
/api/minha-senha/cancelar/publica
Cancela a senha pública ativa do dispositivo

Parameters
Cancel
Name	Description
deviceId *
string
(query)
ID do dispositivo do usuário

123e4567-e89b-12d3-a456-426614174000
Execute
Clear
Responses
Curl

curl -X 'PUT' \
  'http://localhost:3000/api/minha-senha/cancelar/publica?deviceId=123e4567-e89b-12d3-a456-426614174000' \
  -H 'accept: */*'
Request URL
http://localhost:3000/api/minha-senha/cancelar/publica?deviceId=123e4567-e89b-12d3-a456-426614174000
Server response
Code	Details
500
Undocumented
Error: Internal Server Error

Response body
Download
{
  "erro": "Cannot destructure property 'deviceId' of 'req.body' as it is undefined."
}
Response headers
 access-control-allow-credentials: true 
 connection: keep-alive 
 content-length: 83 
 content-security-policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests 
 content-type: application/json; charset=utf-8 
 cross-origin-opener-policy: same-origin 
 cross-origin-resource-policy: same-origin 
 date: Sun,21 Jun 2026 17:19:03 GMT 
 etag: W/"53-6RfhE+XdXoeYBKoFDRtxaz1H7to" 
 keep-alive: timeout=5 
 origin-agent-cluster: ?1 
 referrer-policy: no-referrer 
 strict-transport-security: max-age=15552000; includeSubDomains 
 vary: Origin 
 x-content-type-options: nosniff 
 x-dns-prefetch-control: off 
 x-download-options: noopen 
 x-frame-options: SAMEORIGIN 
 x-permitted-cross-domain-policies: none 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
Senha cancelada

No links
404	
Nenhuma senha ativa encontrada


PUT
/api/minha-senha/cancelar
Cancela a senha do usuário


Parameters
Cancel
Name	Description
deviceId *
string
(query)
ID do dispositivo do usuário (mesmo usado ao retirar a senha)

123e4567-e89b-12d3-a456-426614174002
Execute
Clear
Responses
Curl

curl -X 'PUT' \
  'http://localhost:3000/api/minha-senha/cancelar?deviceId=123e4567-e89b-12d3-a456-426614174002' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwibm9tZSI6IkFkbWluaXN0cmFkb3IgUGFkcsOjbyIsImVtYWlsIjoiYWRtaW5Ac2VuaGFzLmNvbSIsInBlcmZpbCI6ImFkbWluaXN0cmFkb3IiLCJpYXQiOjE3ODIwNjE5NTYsImV4cCI6MTc4MjA5MDc1Nn0.GUPumUQ0D0moFNgVzk31UweDMO5qLi5dVPXmYXRYreY'
Request URL
http://localhost:3000/api/minha-senha/cancelar?deviceId=123e4567-e89b-12d3-a456-426614174002
Server response
Code	Details
500
Undocumented
Error: Internal Server Error

Response body
Download
{
  "erro": "Cannot destructure property 'deviceId' of 'req.body' as it is undefined."
}
Response headers
 access-control-allow-credentials: true 
 connection: keep-alive 
 content-length: 83 
 content-security-policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests 
 content-type: application/json; charset=utf-8 
 cross-origin-opener-policy: same-origin 
 cross-origin-resource-policy: same-origin 
 date: Sun,21 Jun 2026 17:22:47 GMT 
 etag: W/"53-6RfhE+XdXoeYBKoFDRtxaz1H7to" 
 keep-alive: timeout=5 
 origin-agent-cluster: ?1 
 referrer-policy: no-referrer 
 strict-transport-security: max-age=15552000; includeSubDomains 
 vary: Origin 
 x-content-type-options: nosniff 
 x-dns-prefetch-control: off 
 x-download-options: noopen 
 x-frame-options: SAMEORIGIN 
 x-permitted-cross-domain-policies: none 
 x-xss-protection: 0 
Responses
Code	Description	Links
200	
Senha cancelada

No links
400	
deviceId é obrigatório

No links
401	
Não autenticado

No links
404	
Nenhuma senha ativa encontrada

No links

GET
/api/meu-historico

GET
/auth/google
Login com Google

Parameters
Cancel
No parameters

Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:3000/auth/google' \
  -H 'accept: */*'
Request URL
http://localhost:3000/auth/google
Server response
Code	Details
Undocumented
Failed to fetch.
Possible Reasons:

CORS
Network Failure
URL scheme must be "http" or "https" for CORS request.
Responses
Code	Description	Links
200	
Redireciona para autenticação Google

No links

GET
/auth/google/callback
Callback do login Google

Parameters
Cancel
No parameters

Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:3000/auth/google/callback' \
  -H 'accept: */*'
Request URL
http://localhost:3000/auth/google/callback
Server response
Code	Details
Undocumented
Failed to fetch.
Possible Reasons:

CORS
Network Failure
URL scheme must be "http" or "https" for CORS request.
Responses
Code	Description	Links
200	
Login realizado com sucesso