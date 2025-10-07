# prova-facil

![Deploy Status](https://github.com/InovacodeDev/prova-facil/actions/workflows/deploy.yml/badge.svg?branch=main) ![License](https://img.shields.io/badge/license-ISC-blue.svg) ![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)

> A plataforma definitiva para criação e gestão de avaliações escolares — simplificando o processo para educadores e instituições.

## 📜 Sobre o Projeto

`prova-facil` é uma aplicação web construída com Next.js e TypeScript para ajudar professores e coordenadores a gerar, organizar e distribuir avaliações escolares. A plataforma integra IA (via Genkit / Google AI) para geração automática de questões, um painel para gerenciamento de avaliações, e rastreamento de interações (cópias, gerações) armazenado no banco de dados.

O sistema utiliza Supabase para autenticação e armazenamento, Drizzle ORM para migrações e tipos do banco, e Vercel Analytics para eventos personalizados. O foco é reduzir o tempo que educadores gastam criando avaliações, ao oferecer geração rápida de questões, um banco de questões e ferramentas de administração.

## ✨ Features

-   Geração automática de questões por IA (vários tipos: múltipla escolha, verdadeiro/falso, dissertativa, sumário)
-   Upload e análise de documentos (PDF) para gerar questões a partir do conteúdo
-   Banco de questões e dashboard com filtros por tipo
-   Tracking de cópias e gerações (logs automatizados via triggers SQL)
-   Autenticação via Supabase
-   Integração com Vercel Analytics para eventos customizados

## 🛠️ Tecnologias Utilizadas

-   Linguagem: TypeScript (project configured via `tsconfig.json`)
-   Framework: Next.js (app router)
-   UI: React, Tailwind CSS, Radix UI
-   Database: PostgreSQL (Supabase) + Drizzle ORM
-   Auth/Storage: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
-   Dev tooling: pnpm (lockfile present), TypeScript, ESLint
-   AI: Genkit / Google AI (`@genkit-ai/googleai`)
-   Analytics: Vercel Analytics

## 🚀 Começando (Do Zero ao 'Rodável')

### Pré-requisitos

-   Node.js >= 22 (ver `package.json` engines)
-   pnpm >= 9 (project uses `pnpm@10.17.1` as packageManager)
-   PostgreSQL (or Supabase project)
-   (Opcional) Docker & Docker Compose — caso queira rodar dependências localmente em containers

### Instalação

1. Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
cd prova-facil
```

2. Instale as dependências (pnpm):

```bash
pnpm install
```

3. Configure variáveis de ambiente:

```bash
cp .env.example .env.local
# Edit .env.local and fill values
```

Variáveis encontradas em `.env.example`:

| Variável                      | Descrição                                              |
| ----------------------------- | ------------------------------------------------------ |
| NEXT_PUBLIC_SUPABASE_URL      | URL do projeto Supabase (ex.: https://xyz.supabase.co) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave pública anônima do Supabase                      |
| DATABASE_URL                  | Connection string do banco (usado por Drizzle)         |
| NEXT_PUBLIC_HYPERTUNE_TOKEN   | Token Hypertune (migrado/obsoleto em alguns setups)    |
| GOOGLE_AI_API_KEY             | API key para o Genkit / Google AI                      |

> Nota: O repositório inclui `.vercelignore` que exclui `.env.local` por padrão. Não faça commit de segredos.

4. (Opcional) Inicie serviços de dependência com Docker (se você tiver um Docker setup):

```bash
# Se existir um docker-compose.yml
docker-compose up -d
```

5. Migrações do banco de dados (Drizzle):

```bash
pnpm db:gen
# Use drizzle-kit commands to create/apply migrations as configured in drizzle.config.ts
```

## ⚡ Uso

Principais scripts disponíveis em `package.json`:

-   `pnpm dev` — Inicia o servidor de desenvolvimento (Next.js) na porta 8800
-   `pnpm build` — Gera o build de produção
-   `pnpm start` — Inicia o servidor Next.js preparado para produção
-   `pnpm lint` — Executa o linter (ESLint)
-   `pnpm db:gen` — Gera tipos/migrations com Drizzle
-   `pnpm db:check` — Valida configurações do Drizzle

### Rodando em desenvolvimento

```bash
pnpm dev
# Abra http://localhost:8800
```

## � CI/CD e Deployments

O projeto utiliza GitHub Actions + Vercel para deploy automatizado baseado em branches:

| Branch    | Ambiente            | Deploy Automático | URL                                    |
| --------- | ------------------- | ----------------- | -------------------------------------- |
| `main`    | **Production**      | ✅                | https://prova-facil.vercel.app         |
| `staging` | **Preview/Staging** | ✅                | https://staging-prova-facil.vercel.app |
| `dev`     | **Development**     | ✅                | https://dev-prova-facil.vercel.app     |
| Outras    | Local apenas        | ❌                | Desenvolvimento local                  |

### Setup CI/CD

Para configurar o CI/CD pela primeira vez:

```bash
# Execute o script de setup
chmod +x setup-cicd.sh
./setup-cicd.sh

# Siga as instruções para configurar:
# 1. GitHub Secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
# 2. Variáveis de ambiente no Vercel Dashboard
```

📖 **Documentação completa:** [`CICD_SETUP.md`](./CICD_SETUP.md)  
⚡ **Guia rápido:** [`CICD_QUICKSTART.md`](./CICD_QUICKSTART.md)

## �📡 Endpoints da API (resumo)

O projeto usa o App Router (`app/api/*`). Endpoints principais observados:

| Método | Rota                      | Descrição                                                                        |
| ------ | ------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/generate-questions` | Gera questões via IA a partir de prompt/assessment; cria assessment e questions. |
| POST   | `/api/copy-question`      | Atualiza `copy_count` para a questão (trigger SQL incrementa logs).              |
| GET    | `/api/stats`              | Retorna estatísticas de uso (revalidate 1h).                                     |

> Outros endpoints podem existir em `app/api/` (ex.: auth callbacks, templates, stats). Consulte a pasta `app/api` para detalhes.

## 📂 Estrutura do Projeto (visão curta)

Top-level relevante (resumido):

```
app/
  ├─ api/           # Endpoints do servidor (Next.js App Router)
  ├─ auth/          # Páginas de autenticação
  ├─ dashboard/     # Painel do usuário
  ├─ my-assessments/ # Biblioteca de avaliações
components/        # Componentes React reutilizáveis (Hero, Header, QuestionCard...)
db/                # Drizzle schema, migrations, triggers.sql
lib/               # Suporte (supabase client, utils, logs helpers)
public/            # Assets estáticos (imagens, favicon)
README.md
package.json
pnpm-lock.yaml
```

Breve descrição dos diretórios:

-   `app/` — Roteamento e páginas (Next.js App Router)
-   `components/` — Componentes UIs
-   `db/` — Migrations e schema Drizzle
-   `lib/` — Helpers (Supabase clients, logging, utils)
-   `public/` — Assets públicos

## 🤝 Como Contribuir

Contribuições são bem-vindas!

1. Fork o repositório
2. Crie uma branch com um nome descritivo: `git checkout -b feat/nova-feature`
3. Faça commits atômicos com mensagens claras
4. Abra um Pull Request descrevendo a mudança e por que é necessária

Siga as convenções do projeto e adicione testes quando possível.

## 📄 Licença

Este repositório não contém um arquivo `LICENSE`. O campo `license` não está presente em `package.json`.
Se desejar publicar este projeto publicamente, adicione um arquivo `LICENSE` apropriado (ex.: MIT) e atualize `package.json`.

---

Se precisar, posso:

-   Adicionar exemplos de uso das APIs (payloads e responses)
-   Gerar um pequeno arquivo `CONTRIBUTING.md` e um template de Pull Request
-   Inserir instruções de deploy no Vercel e como aplicar as migrations/triggers no Supabase

Conjuração realizada por: Tito
Conjuração realizada em: 01 de Outubro de 2025

# ProvaFácil AI - Next.js

Sistema de criação e gestão de avaliações educacionais com Inteligência Artificial.

## 🚀 Status da Migração

Este projeto foi **migrado de Vite/React para Next.js 15** com App Router.

**📊 Progresso: 30% Completo (3/10 páginas)**

-   ✅ Estrutura Next.js configurada
-   ✅ Supabase SSR configurado
-   ✅ Middleware de autenticação funcionando
-   ✅ Páginas migradas: `/`, `/auth`, `/dashboard`
-   ⚠️ 7 páginas pendentes (30 min - 2h de trabalho)

### 🎯 Para Finalizar a Migração

```bash
# 1. Verificar status
./check-migration.sh

# 2. Seguir guia de finalização
# Veja FINALIZE.md para instruções passo a passo
```

**📚 Documentação da Migração:**

-   **[FINALIZE.md](./FINALIZE.md)** ⭐ **COMECE AQUI** - Guia rápido de finalização
-   [MIGRATION.md](./MIGRATION.md) - Guia detalhado completo
-   [FINAL_STATUS.md](./FINAL_STATUS.md) - Status técnico detalhado
-   [CHECKLIST.md](./CHECKLIST.md) - Checklist interativo

## 🛠 Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Linguagem**: TypeScript
-   **Estilização**: Tailwind CSS
-   **UI Components**: Radix UI + shadcn/ui
-   **Autenticação**: Supabase Auth
-   **Database**: PostgreSQL (Supabase)
-   **ORM**: Drizzle ORM
-   **Feature Flags**: Hypertune (configurar)

## 📋 Pré-requisitos

-   Node.js 18+
-   npm, yarn, ou pnpm
-   Conta Supabase (para autenticação e banco de dados)

## 🏃‍♂️ Como Executar

### 1. Clone o repositório

```bash
git clone <YOUR_GIT_URL>
cd prova-facil
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase.

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🗂 Estrutura do Projeto

```
prova-facil/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Rotas da aplicação
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes UI (shadcn)
│   └── providers/        # Providers (React Query, etc)
├── lib/                   # Utilitários
│   └── supabase/         # Clientes Supabase (server/client)
├── hooks/                 # Custom hooks
├── src/                   # ⚠️ Código antigo do Vite (migrar)
│   ├── pages/            # Páginas React Router (migrar)
│   ├── db/               # Configuração Drizzle
│   └── components/       # ✅ Já copiado para /components
├── public/                # Assets estáticos
├── middleware.ts          # Middleware de autenticação
├── next.config.js         # Configuração Next.js
├── tailwind.config.ts     # Configuração Tailwind
└── tsconfig.json          # Configuração TypeScript
```

## 📝 Scripts Disponíveis

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

└── tsconfig.json # Configuração TypeScript

````

## 📝 Scripts Disponíveis

```bash
npm run dev        # Inicia o servidor de desenvolvimento
npm run build      # Cria build de produção
npm start          # Inicia servidor de produção
npm run lint       # Executa o linter
````

## 🔐 Autenticação

A autenticação é gerenciada pelo Supabase Auth com:

-   Sign up / Sign in com email e senha
-   Middleware para proteção de rotas
-   Refresh automático de sessões
-   SSR-ready (Server-Side Rendering)

Rotas protegidas:

-   `/dashboard`
-   `/new-assessment`
-   `/my-assessments`
-   `/templates`
-   `/profile`
-   `/change-password`
-   `/plan`
-   `/usage`

## 📚 Documentação

-   [Guia de Migração Completo](./MIGRATION.md)
-   [Next.js Documentation](https://nextjs.org/docs)
-   [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
-   [Drizzle ORM](https://orm.drizzle.team/docs/overview)
-   [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ⚠️ Notas Importantes

-   Este projeto está em processo de migração de Vite para Next.js
-   Algumas páginas ainda precisam ter sua lógica migrada (ver MIGRATION.md)
-   Não use `src/integrations/supabase/client.ts` - use `lib/supabase/client.ts` ou `lib/supabase/server.ts`
-   Sempre use 'use client' em componentes que usam hooks ou eventos

## 📄 Licença

Este projeto está sob licença privada.

## 💬 Suporte

Para dúvidas ou problemas:

1. Consulte [MIGRATION.md](./MIGRATION.md)
2. Veja a documentação oficial do Next.js
3. Abra uma issue no repositório

```
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/250a25d9-7849-4342-9771-2e313f03ad2e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
```
