#!/usr/bin/env node

/**
 * Teste do Sistema de Sincronização de Subscriptions
 *
 * Este script testa o endpoint de sincronização manualmente
 * para garantir que está funcionando corretamente.
 *
 * Uso:
 *   node scripts/test-subscription-sync.js <customer_id> [profile_id]
 *
 * Exemplo:
 *   node scripts/test-subscription-sync.js cus_XXX
 *   node scripts/test-subscription-sync.js cus_XXX user-uuid-here
 */

const https = require('https');
const http = require('http');

// Configuração
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ENDPOINT = '/api/stripe/sync-customer-subscription';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

async function testSync(customerId, profileId = null) {
  logSection('🧪 Testando Sincronização de Subscription');

  log(`Customer ID: ${customerId}`, 'yellow');
  if (profileId) {
    log(`Profile ID: ${profileId}`, 'yellow');
  }
  log(`App URL: ${APP_URL}`, 'yellow');
  log(`Endpoint: ${ENDPOINT}`, 'yellow');

  const url = new URL(ENDPOINT, APP_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const body = JSON.stringify({
    customerId,
    profileId,
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  logSection('📤 Enviando Requisição');
  log(`POST ${url.href}`, 'magenta');
  log(`Body: ${body}`, 'magenta');

  return new Promise((resolve, reject) => {
    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        logSection('📥 Resposta Recebida');
        log(`Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');

        try {
          const json = JSON.parse(data);
          log('Response Body:', 'magenta');
          console.log(JSON.stringify(json, null, 2));

          if (res.statusCode === 200 && json.success) {
            logSection('✅ TESTE PASSOU');
            log(`Subscription ID: ${json.subscriptionId || 'null (starter)'}`, 'green');
            log(`Plan ID: ${json.planId}`, 'green');
            log(`Message: ${json.message}`, 'green');
            resolve(json);
          } else {
            logSection('❌ TESTE FALHOU');
            log(`Error: ${json.error}`, 'red');
            if (json.details) {
              log(`Details: ${json.details}`, 'red');
            }
            reject(new Error(json.error || 'Unknown error'));
          }
        } catch (error) {
          logSection('❌ ERRO AO PARSEAR RESPOSTA');
          log(`Error: ${error.message}`, 'red');
          log('Raw Response:', 'yellow');
          console.log(data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      logSection('❌ ERRO DE REDE');
      log(`Error: ${error.message}`, 'red');
      log('Verifique se o servidor está rodando:', 'yellow');
      log('  npm run dev', 'yellow');
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

// Validação de argumentos
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
${colors.blue}Teste do Sistema de Sincronização de Subscriptions${colors.reset}

${colors.yellow}Uso:${colors.reset}
  node scripts/test-subscription-sync.js <customer_id> [profile_id]

${colors.yellow}Argumentos:${colors.reset}
  customer_id    ID do cliente no Stripe (obrigatório)
                 Exemplo: cus_XXX

  profile_id     UUID do profile no banco (opcional)
                 Se não fornecido, busca pelo customer_id

${colors.yellow}Exemplos:${colors.reset}
  # Buscar profile pelo customer_id
  node scripts/test-subscription-sync.js cus_P4ZKmQz8FaLUJY

  # Especificar profile_id diretamente
  node scripts/test-subscription-sync.js cus_P4ZKmQz8FaLUJY 123e4567-e89b-12d3-a456-426614174000

${colors.yellow}Variáveis de Ambiente:${colors.reset}
  NEXT_PUBLIC_APP_URL    URL da aplicação (padrão: http://localhost:3000)

${colors.yellow}O que este script faz:${colors.reset}
  1. Envia uma requisição POST para /api/stripe/sync-customer-subscription
  2. O endpoint busca as subscriptions do Stripe para o customer
  3. Identifica a subscription ativa mais recente
  4. Atualiza o profile no banco de dados
  5. Invalida o cache
  6. Retorna o resultado

${colors.green}Teste bem-sucedido:${colors.reset}
  ✅ Status 200
  ✅ success: true
  ✅ subscriptionId e planId retornados

${colors.red}Teste falhou:${colors.reset}
  ❌ Status diferente de 200
  ❌ success: false
  ❌ Erro retornado
  `);
  process.exit(0);
}

const customerId = args[0];
const profileId = args[1] || null;

if (!customerId) {
  log('❌ Erro: customer_id é obrigatório', 'red');
  log('Use --help para ver instruções', 'yellow');
  process.exit(1);
}

// Validar formato do customer_id
if (!customerId.startsWith('cus_')) {
  log('⚠️  Aviso: customer_id não parece ser um ID válido do Stripe', 'yellow');
  log('   Formato esperado: cus_XXX', 'yellow');
}

// Validar formato do profile_id (se fornecido)
if (profileId) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(profileId)) {
    log('⚠️  Aviso: profile_id não parece ser um UUID válido', 'yellow');
    log('   Formato esperado: 123e4567-e89b-12d3-a456-426614174000', 'yellow');
  }
}

// Executar teste
testSync(customerId, profileId)
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.log('');
    process.exit(1);
  });
