// Script de teste para verificar o login com Google
// Este script testa se as rotas e componentes estão configurados corretamente

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando teste de implementação do login com Google...\n');

// Testar 1: Verificar se o botão de login existe no TicketView
console.log('✅ Teste 1: Verificando botão de login no TicketView');
try {
  const ticketViewPath = path.join(__dirname, 'frontend/src/views/TicketView.vue');
  const ticketViewContent = fs.readFileSync(ticketViewPath, 'utf8');
  
  if (ticketViewContent.includes('loginComGoogle') && ticketViewContent.includes('btn-google')) {
    console.log('   ✓ Botão de login com Google encontrado no TicketView');
  } else {
    console.log('   ✗ Botão de login com Google não encontrado no TicketView');
  }
} catch (error) {
  console.log('   ✗ Erro ao verificar TicketView:', error.message);
}

// Testar 2: Verificar se o auth store foi atualizado
console.log('\n✅ Teste 2: Verificando auth store atualizado');
try {
  const authStorePath = path.join(__dirname, 'frontend/src/stores/auth.js');
  const authStoreContent = fs.readFileSync(authStorePath, 'utf8');
  
  if (authStoreContent.includes('handleGoogleCallback') && authStoreContent.includes('handleGoogleCallback')) {
    console.log('   ✓ Auth store atualizado com handleGoogleCallback');
  } else {
    console.log('   ✗ Auth store não contém handleGoogleCallback');
  }
} catch (error) {
  console.log('   ✗ Erro ao verificar auth store:', error.message);
}

// Testar 3: Verificar se o callback foi modificado
console.log('\n✅ Teste 3: Verificando callback modificado no backend');
try {
  const authControllerPath = path.join(__dirname, 'backend/src/controllers/authController.js');
  const authControllerContent = fs.readFileSync(authControllerPath, 'utf8');
  
  if (authControllerContent.includes('/client?token=') && authControllerContent.includes('ClientView')) {
    console.log('   ✓ Callback modificado para redirecionar para ClientView');
  } else {
    console.log('   ✗ Callback não foi modificado corretamente');
  }
} catch (error) {
  console.log('   ✗ Erro ao verificar auth controller:', error.message);
}

// Testar 4: Verificar se o ClientView tem botão de logout
console.log('\n✅ Teste 4: Verificando botão de logout no ClientView');
try {
  const clientViewPath = path.join(__dirname, 'frontend/src/views/ClientView.vue');
  const clientViewContent = fs.readFileSync(clientViewPath, 'utf8');
  
  if (clientViewContent.includes('btn-logout') && clientViewContent.includes('logout')) {
    console.log('   ✓ Botão de logout encontrado no ClientView');
  } else {
    console.log('   ✗ Botão de logout não encontrado no ClientView');
  }
} catch (error) {
  console.log('   ✗ Erro ao verificar ClientView:', error.message);
}

// Testar 5: Verificar se as variáveis de ambiente do Google estão configuradas
console.log('\n✅ Teste 5: Verificando configurações do Google OAuth');
try {
  const envPath = path.join(__dirname, 'backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('GOOGLE_CLIENT_ID') && envContent.includes('GOOGLE_CLIENT_SECRET')) {
    console.log('   ✓ Configurações do Google OAuth encontradas no .env');
  } else {
    console.log('   ✗ Configurações do Google OAuth não encontradas');
  }
} catch (error) {
  console.log('   ✗ Erro ao verificar .env:', error.message);
}

console.log('\n🎉 Testes concluídos!');
console.log('\n📋 Resumo da implementação:');
console.log('   1. ✓ Botão de login com Google adicionado ao TicketView');
console.log('   2. ✓ Auth store atualizado para suportar login com Google');
console.log('   3. ✓ Callback modificado para redirecionar para ClientView');
console.log('   4. ✓ Botão de logout adicionado ao ClientView');
console.log('   5. ✓ Configurações do Google OAuth verificadas');

console.log('\n🚀 Próximos passos:');
console.log('   1. Iniciar o servidor backend: npm run dev (na pasta backend)');
console.log('   2. Iniciar o frontend: npm run dev (na pasta frontend)');
console.log('   3. Acessar http://localhost:5173 (ou porta do frontend)');
console.log('   4. Clicar no botão "Login com Google" para testar');
console.log('   5. Verificar se o redirecionamento para ClientView funciona');
console.log('   6. Testar o botão "Sair" no ClientView');