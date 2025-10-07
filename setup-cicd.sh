#!/bin/bash

# Script de setup para CI/CD com Vercel
# Uso: ./setup-cicd.sh

set -e

echo "🚀 Setup CI/CD - Vercel + GitHub Actions"
echo "========================================"
echo ""

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado"
    echo "📦 Instalando Vercel CLI..."
    pnpm add -g vercel
    echo "✅ Vercel CLI instalado"
else
    echo "✅ Vercel CLI já instalado"
fi

echo ""
echo "🔗 Conectando projeto ao Vercel..."
echo ""

# Fazer login no Vercel
vercel login

echo ""
echo "📁 Linkando projeto..."
vercel link

echo ""
echo "✅ Projeto linkado com sucesso!"
echo ""

# Mostrar IDs
if [ -f ".vercel/project.json" ]; then
    echo "📋 Seus IDs do projeto:"
    echo "======================"
    echo ""
    cat .vercel/project.json | grep -E '"(orgId|projectId)"'
    echo ""
    echo "📝 Adicione estes valores como GitHub Secrets:"
    echo "  - orgId    → VERCEL_ORG_ID"
    echo "  - projectId → VERCEL_PROJECT_ID"
    echo ""
fi

echo "🔐 Próximos passos:"
echo "==================="
echo ""
echo "1. Crie um token no Vercel:"
echo "   https://vercel.com/account/tokens"
echo ""
echo "2. Adicione os seguintes secrets no GitHub:"
echo "   Repository → Settings → Secrets and variables → Actions"
echo ""
echo "   - VERCEL_TOKEN (token criado no passo 1)"
echo "   - VERCEL_ORG_ID (do arquivo .vercel/project.json)"
echo "   - VERCEL_PROJECT_ID (do arquivo .vercel/project.json)"
echo ""
echo "3. Configure as variáveis de ambiente no Vercel Dashboard:"
echo "   https://vercel.com/dashboard → Seu Projeto → Settings → Environment Variables"
echo ""
echo "   Para cada ambiente (Production, Preview, Development):"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - DATABASE_URL"
echo "   - GOOGLE_AI_API_KEY"
echo ""
echo "4. Faça push para testar:"
echo "   git checkout dev"
echo "   git push origin dev"
echo ""
echo "✅ Setup completo! Consulte CICD_SETUP.md para mais detalhes."
echo ""
