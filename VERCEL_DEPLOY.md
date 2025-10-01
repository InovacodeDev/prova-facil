# Como Resolver o Erro 500 no Deploy da Vercel

O erro `MIDDLEWARE_INVOCATION_FAILED` acontece porque as **variáveis de ambiente não estão configuradas** no projeto da Vercel.

## 🔧 Solução: Configurar Variáveis de Ambiente na Vercel

### Passo 1: Acessar o Dashboard da Vercel

1. Acesse https://vercel.com/dashboard
2. Clique no seu projeto `prova-facil`
3. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar as Variáveis Necessárias

Adicione **todas** as seguintes variáveis de ambiente:

#### 1. Supabase (OBRIGATÓRIO)

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

#### 2. Database (OBRIGATÓRIO)

```
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

#### 3. Google AI / Genkit (OBRIGATÓRIO)

```
GOOGLE_AI_API_KEY=sua_google_ai_api_key_aqui
```

#### 4. Hypertune (Opcional)

```
NEXT_PUBLIC_HYPERTUNE_TOKEN=seu_token_hypertune
```

### Passo 3: Onde Encontrar Cada Valor

#### Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
    - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **Connection String** → `DATABASE_URL`

#### Google AI API Key

1. Acesse https://makersuite.google.com/app/apikey
2. Clique em **Create API Key**
3. Copie a chave gerada

#### Hypertune (Opcional)

1. Acesse https://app.hypertune.com
2. Vá em seu projeto
3. Copie o token de produção

### Passo 4: Configurar os Ambientes

**IMPORTANTE**: Para cada variável, selecione em qual ambiente ela deve estar disponível:

-   ✅ **Production** (obrigatório)
-   ✅ **Preview** (recomendado)
-   ✅ **Development** (opcional)

### Passo 5: Fazer Redeploy

Após adicionar todas as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Clique em **Redeploy**
4. Confirme a ação

## ✅ Verificação

Após o redeploy, seu site deve funcionar normalmente. O middleware agora:

-   ✅ Verifica se as variáveis existem antes de usar
-   ✅ Retorna erro amigável se algo falhar
-   ✅ Não quebra todo o site por falta de variáveis

## 🚨 Checklist Antes do Deploy

-   [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
-   [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
-   [ ] `DATABASE_URL` configurado
-   [ ] `GOOGLE_AI_API_KEY` configurado
-   [ ] Todas as variáveis estão em **Production**
-   [ ] Fez o redeploy após adicionar as variáveis

## 📝 Notas Importantes

1. **Prefixo NEXT*PUBLIC***: Variáveis com este prefixo são expostas no cliente (browser)
2. **Variáveis sem prefixo**: São apenas server-side (mais seguras)
3. **Nunca commite** arquivos `.env.local` no Git
4. **DATABASE_URL**: Use a Connection String do Supabase (aba SQL Editor → Connect)

## 🆘 Ainda Com Problemas?

Se o erro persistir após configurar as variáveis:

1. Verifique os **logs do deployment** na Vercel
2. Confirme que copiou as variáveis corretamente (sem espaços extras)
3. Verifique se o projeto Supabase está ativo
4. Teste a Google AI API Key em https://makersuite.google.com

## 📸 Tutorial Visual

### Como adicionar variável na Vercel:

1. Settings → Environment Variables
2. Clique em "Add New"
3. Preencha:
    - **Name**: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
    - **Value**: O valor da variável
    - **Environment**: Marque Production, Preview e Development
4. Clique em "Save"
5. Repita para todas as variáveis

### Como fazer redeploy:

1. Deployments (menu lateral)
2. Último deployment → 3 pontos (⋮)
3. "Redeploy" → "Redeploy"
4. Aguarde o build completar (2-3 minutos)
5. Acesse seu site!

---

**Última atualização**: 2025-10-01
