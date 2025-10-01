# Exemplos de Variáveis de Ambiente por Ambiente

## 📋 Estrutura Recomendada

Mantenha ambientes separados para evitar afetar dados de produção durante testes.

---

## 🟢 Production (branch: main)

```env
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...prod

# Database Production
DATABASE_URL=postgresql://postgres.xxx-prod:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Google AI Production
GOOGLE_AI_API_KEY=AIzaSyXXX...prod

# Vercel Analytics (automático)
# VERCEL_ANALYTICS_ID - Injetado automaticamente pelo Vercel
```

**Onde configurar:**

-   Vercel Dashboard → Environment Variables → **Production**

---

## 🟡 Preview/Staging (branch: staging)

```env
# Supabase Staging
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...staging

# Database Staging
DATABASE_URL=postgresql://postgres.xxx-staging:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Google AI Staging (pode usar mesmo key ou separado)
GOOGLE_AI_API_KEY=AIzaSyXXX...staging

# Vercel Analytics (automático)
```

**Onde configurar:**

-   Vercel Dashboard → Environment Variables → **Preview**

**Opções para banco staging:**

1. **Projeto Supabase separado** (recomendado)
2. **Mesmo projeto, schema diferente** (ex: `staging` schema)
3. **Branch database** (se Supabase suportar)

---

## 🔵 Development (branch: dev)

```env
# Supabase Development
NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...dev

# Database Development
DATABASE_URL=postgresql://postgres.xxx-dev:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Google AI Development
GOOGLE_AI_API_KEY=AIzaSyXXX...dev

# Vercel Analytics (automático)
```

**Onde configurar:**

-   Vercel Dashboard → Environment Variables → **Development**

---

## 💻 Local (todas as branches)

Arquivo: `.env.local` (não fazer commit!)

```env
# Supabase Local (pode usar dev ou local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...local

# Ou usar o ambiente de development:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...dev

# Database Local
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Google AI Local/Dev
GOOGLE_AI_API_KEY=AIzaSyXXX...dev
```

---

## 🔐 Gerenciamento de Secrets

### Hierarquia de Variáveis

```
Vercel (Production/Preview/Development)
  ↓
.env.local (apenas desenvolvimento local)
  ↓
.env.example (template público, sem valores reais)
```

### Sincronização

#### Vercel → Local

```bash
# Pull das variáveis de um ambiente específico
vercel env pull .env.production --environment=production
vercel env pull .env.staging --environment=preview
vercel env pull .env.development --environment=development
```

#### Local → Vercel

```bash
# Adicionar/atualizar variável
vercel env add NOME_DA_VARIAVEL

# Listar variáveis
vercel env ls

# Remover variável
vercel env rm NOME_DA_VARIAVEL
```

---

## 📊 Tabela de Comparação

| Variável         | Production       | Staging             | Development     | Local           |
| ---------------- | ---------------- | ------------------- | --------------- | --------------- |
| **Supabase URL** | prod.supabase.co | staging.supabase.co | dev.supabase.co | localhost:54321 |
| **Database**     | Production DB    | Staging DB          | Dev DB          | Local DB        |
| **API Keys**     | Production keys  | Staging keys        | Dev keys        | Dev keys        |
| **Cache**        | Redis Production | Redis Staging       | Redis Dev       | Sem cache       |
| **Logs**         | Full logging     | Full logging        | Verbose         | Debug           |

---

## 🛡️ Segurança

### ✅ Boas Práticas

1. **Nunca compartilhe secrets de produção**

    ```bash
    # ❌ NUNCA
    echo $PROD_API_KEY  # Pode vazar em logs

    # ✅ SEMPRE
    # Use Vercel/GitHub Secrets
    ```

2. **Rotacione keys regularmente**

    - API keys a cada 90 dias
    - Database passwords a cada 6 meses
    - Tokens de serviço mensalmente

3. **Use keys diferentes por ambiente**

    ```
    Production:  AIzaSy...prod
    Staging:     AIzaSy...staging  ← Diferente!
    Development: AIzaSy...dev      ← Diferente!
    ```

4. **Limite permissões**
    - Staging/Dev: Apenas recursos de teste
    - Production: Acesso completo, mas monitorado

### 🚫 O que NÃO fazer

-   ❌ Usar mesmas credenciais em todos ambientes
-   ❌ Fazer commit de `.env.local`
-   ❌ Compartilhar secrets via Slack/Email
-   ❌ Usar secrets de produção localmente
-   ❌ Deixar secrets em plaintext em code

---

## 🔄 Workflow Completo

### 1. Criar novo ambiente

```bash
# 1. Criar projeto no Supabase
# 2. Anotar URL e anon key
# 3. Adicionar no Vercel Dashboard
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Selecione o ambiente correto
```

### 2. Testar localmente

```bash
# Pull das variáveis
vercel env pull .env.local

# Testar
pnpm dev
```

### 3. Deploy

```bash
git push origin staging  # Deploy automático
```

---

## 📚 Recursos

-   [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
-   [Supabase CLI](https://supabase.com/docs/guides/cli)
-   [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Tip:** Use um gerenciador de senhas (1Password, LastPass) para armazenar secrets de forma segura.

**Criado em:** 01 de Outubro de 2025  
**Autor:** Tito
