 

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
