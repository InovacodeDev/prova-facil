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
