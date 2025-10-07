# 🧪 Guia de Testes - Sistema de Logs e Melhorias de Autenticação

## Pré-requisitos

Antes de testar, certifique-se de que:

1. ✅ A migração do banco foi aplicada
2. ✅ O servidor está rodando
3. ✅ As variáveis de ambiente estão configuradas

```bash
# Verificar se a migração foi aplicada
pnpm db:check

# Se necessário, aplicar a migração manualmente no Supabase
# Copie o conteúdo de: db/migrations/0001_chunky_logan.sql
# E execute no SQL Editor do Supabase
```

---

## 📝 Checklist de Testes

### ✅ 1. Testar Tabela error_logs

**Objetivo:** Verificar se a tabela foi criada corretamente

```sql
-- No Supabase SQL Editor
SELECT * FROM error_logs LIMIT 5;

-- Verificar estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'error_logs';
```

**Resultado Esperado:**
- Tabela existe com colunas: id, message, stack, level, context, created_at
- Enum `error_level` com valores: error, warn, fatal, info

---

### ✅ 2. Testar Criação Automática de Profile no Signup

**Passo a Passo:**

1. **Limpar dados de teste (opcional):**
```sql
-- Deletar usuário de teste anterior (se existir)
DELETE FROM auth.users WHERE email = 'teste-profile@example.com';
DELETE FROM profiles WHERE email = 'teste-profile@example.com';
```

2. **Acessar:** `http://localhost:8800/auth`

3. **Clicar na aba "Criar Conta"**

4. **Preencher o formulário:**
   - Nome: `João Teste Profile`
   - Email: `teste-profile@example.com`
   - Nível Acadêmico: `Ensino Médio`
   - Senha: `senha123456`

5. **Clicar em "Criar Conta"**

6. **Verificar no banco:**
```sql
SELECT 
  u.id as user_id,
  u.email as auth_email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.plan,
  p.email_verified
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'teste-profile@example.com';
```

**Resultado Esperado:**
- ✅ Usuário criado em `auth.users`
- ✅ Profile criado em `profiles` com:
  - `plan = 'starter'`
  - `renew_status = 'none'`
  - `email_verified = false` (antes de confirmar email)
  - `full_name = 'João Teste Profile'`

---

### ✅ 3. Testar Auto-Login após Signup

**Cenário A: Email que não requer confirmação (raro)**

Se o domínio do email estiver configurado para não requerer confirmação:

1. Após criar conta, você deve ser **redirecionado automaticamente** para `/dashboard`
2. Não deve precisar fazer login novamente

**Cenário B: Email que requer confirmação (comum)**

1. Após criar conta, você verá: ✉️ "Enviamos um email de confirmação..."
2. **Abrir o email** (verifique spam/promoções)
3. **Clicar no link de confirmação**
4. Você deve ser **redirecionado para `/dashboard` automaticamente**
5. **Não** deve precisar inserir email/senha novamente

**Verificar:**
```sql
-- Após confirmar email
SELECT email_confirmed_at FROM auth.users 
WHERE email = 'teste-profile@example.com';

-- Deve ter uma data/hora
```

---

### ✅ 4. Testar Criação de Profile no Login (Fallback)

**Objetivo:** Verificar que o profile é criado automaticamente se não existir ao fazer login

**Passo a Passo:**

1. **Criar usuário SEM profile (simular erro):**
```sql
-- 1. Criar usuário manualmente no auth
INSERT INTO auth.users (
  instance_id, 
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'teste-fallback@example.com',
  crypt('senha123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- 2. NÃO criar profile (proposital)
-- O sistema deve criar automaticamente no login
```

2. **Fazer login:**
   - Ir para `/auth`
   - Email: `teste-fallback@example.com`
   - Senha: `senha123456`
   - Clicar em "Entrar"

3. **Verificar:**
```sql
SELECT * FROM profiles WHERE email = 'teste-fallback@example.com';
```

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Profile criado automaticamente
- ✅ Redirecionado para `/dashboard`

---

### ✅ 5. Testar Verificação de Email na Página de Perfil

**Passo a Passo:**

1. **Fazer login** com uma conta que ainda não verificou o email

2. **Acessar:** `/profile`

3. **Verificar a interface:**
   - Deve mostrar ⚠️ "Status de Verificação de Email"
   - Ícone laranja de alerta
   - Botão "Enviar Verificação"

4. **Clicar em "Enviar Verificação"**

5. **Verificar toast:**
   - Deve aparecer: ✉️ "Email Enviado! Verifique sua caixa de entrada..."

6. **Abrir email de verificação**

7. **Clicar no link**

8. **Voltar para `/profile`**

9. **Verificar:**
   - Ícone deve estar verde ✅
   - Texto: "Seu email está verificado e ativo."
   - Data de verificação deve aparecer
   - Botão "Enviar Verificação" não deve mais aparecer

**Verificar no banco:**
```sql
SELECT 
  email,
  email_verified,
  email_verified_at
FROM profiles 
WHERE email = 'seu-email@example.com';
```

---

### ✅ 6. Testar Sistema de Logs de Erro

**Teste 1: Forçar erro em API Route**

1. **Criar arquivo de teste:**
```typescript
// app/api/test-error/route.ts
import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Forçar erro
    throw new Error('Teste de log de erro - API Route');
  } catch (error) {
    return handleApiError(error, request);
  }
}
```

2. **Acessar:** `http://localhost:8800/api/test-error`

3. **Verificar resposta:**
```json
{
  "error": "Internal Server Error",
  "status": 500
}
```

4. **Verificar no banco:**
```sql
SELECT 
  id,
  message,
  level,
  context->>'endpoint' as endpoint,
  created_at
FROM error_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultado Esperado:**
- ✅ Erro registrado na tabela `error_logs`
- ✅ `message = 'Teste de log de erro - API Route'`
- ✅ `level = 'error'`
- ✅ `context` contém `endpoint`, `method`, `statusCode`

**Teste 2: Log do Frontend**

1. **Abrir console do navegador** (F12)

2. **Executar:**
```javascript
fetch('/api/errors/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Teste de log do frontend',
    level: 'warn',
    context: {
      component: 'DevTools',
      url: window.location.href
    }
  })
}).then(r => r.json()).then(console.log);
```

3. **Verificar no banco:**
```sql
SELECT * FROM error_logs WHERE message LIKE '%frontend%' 
ORDER BY created_at DESC LIMIT 1;
```

---

### ✅ 7. Teste End-to-End Completo

**Fluxo Completo:**

1. ✅ **Criar nova conta**
   - Ir para `/auth`
   - Criar conta com novo email
   - Verificar toast de confirmação

2. ✅ **Confirmar email**
   - Abrir email
   - Clicar no link
   - Deve redirecionar para `/dashboard` **automaticamente** (sem login)

3. ✅ **Verificar profile**
   ```sql
   SELECT * FROM profiles WHERE email = 'novo-email@example.com';
   ```
   - Deve ter todos os campos preenchidos

4. ✅ **Ir para perfil**
   - Acessar `/profile`
   - Email deve estar verificado ✅

5. ✅ **Fazer logout e login novamente**
   - Fazer logout
   - Fazer login
   - Deve funcionar normalmente

6. ✅ **Verificar logs**
   ```sql
   SELECT COUNT(*) FROM error_logs;
   ```
   - Não deve haver erros relacionados ao fluxo de autenticação

---

## 🐛 Troubleshooting

### Problema: "Profile não criado após signup"

**Solução:**
```sql
-- Verificar se o usuário existe
SELECT * FROM auth.users WHERE email = 'seu-email@example.com';

-- Se existir mas não tiver profile, criar manualmente:
INSERT INTO profiles (
  user_id, 
  email, 
  full_name, 
  plan, 
  renew_status,
  email_verified
) VALUES (
  'user-id-aqui',
  'seu-email@example.com',
  'Seu Nome',
  'starter',
  'none',
  false
);
```

### Problema: "Email de verificação não chega"

**Verificações:**
1. Conferir spam/promoções
2. Verificar configuração SMTP no Supabase
3. Verificar logs no Supabase Dashboard > Logs

### Problema: "Erro ao inserir na tabela error_logs"

**Solução:**
```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'error_logs'
);

-- Se não existir, executar a migração:
-- Copiar conteúdo de db/migrations/0001_chunky_logan.sql
```

---

## 📊 Métricas de Sucesso

Após todos os testes, você deve ter:

- ✅ Pelo menos 3 registros na tabela `error_logs` (dos testes)
- ✅ Todos os usuários de teste com profiles criados
- ✅ Emails verificados após clicar no link
- ✅ Nenhum erro crítico no console do navegador
- ✅ Logs estruturados com contexto útil

---

## 🎉 Conclusão

Se todos os testes passaram:

1. ✅ Sistema de logs está funcionando
2. ✅ Profiles são criados automaticamente
3. ✅ Auto-login após signup funciona
4. ✅ Verificação de email está operacional

**Próximos Passos:**
- Aplicar logs em outras partes da aplicação (ver `ERROR_LOGGING_USAGE_EXAMPLES.md`)
- Considerar criar dashboard de admin para visualizar logs
- Configurar alertas para erros críticos
