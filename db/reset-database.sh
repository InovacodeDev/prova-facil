#!/bin/bash

# reset-database.sh
# Script para fazer reset COMPLETO do banco de dados e reaplicar tudo
# ⚠️ ATENÇÃO: Este script APAGA TODOS OS DADOS!
# Uso: ./db/reset-database.sh [--local|--remote]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to local
TARGET="local"

# Parse arguments
if [ "$1" = "--remote" ]; then
    TARGET="remote"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  PERIGO: RESET DE BANCO DE DADOS REMOTO ⚠️${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Esta operação irá:${NC}"
    echo -e "   ${RED}1. APAGAR TODOS OS DADOS do banco remoto${NC}"
    echo -e "   ${RED}2. DROPAR TODAS AS TABELAS, TRIGGERS e POLICIES${NC}"
    echo -e "   ${RED}3. RECRIAR TUDO DO ZERO${NC}"
    echo ""
    echo -e "${RED}Esta ação é IRREVERSÍVEL!${NC}"
    echo ""
    read -p "Tem ABSOLUTA CERTEZA? Digite 'RESET' para confirmar: " confirm
    if [ "$confirm" != "RESET" ]; then
        echo -e "${GREEN}✅ Operação cancelada com segurança${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}🔄 Iniciando reset do banco de dados $TARGET...${NC}"
echo ""

# =====================================================
# STEP 1: Supabase DB Reset
# =====================================================
echo -e "${YELLOW}📦 PASSO 1: Reset via Supabase CLI${NC}"
echo ""

if [ "$TARGET" = "local" ]; then
    echo -e "${BLUE}Executando: supabase db reset --local${NC}"
    supabase db reset --local
else
    echo -e "${RED}⚠️  Reset remoto não é suportado pelo CLI${NC}"
    echo -e "${YELLOW}Você precisará fazer manualmente via Supabase Dashboard:${NC}"
    echo -e "   1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT"
    echo -e "   2. Vá em: Database > Tables"
    echo -e "   3. Delete todas as tabelas manualmente"
    echo -e "   4. Execute o script: ./db/apply-migrations.sh --remote"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Reset concluído!${NC}"
echo ""

# =====================================================
# STEP 2: Apply migrations
# =====================================================
echo -e "${YELLOW}📦 PASSO 2: Reaplicando migrations...${NC}"
echo ""

# Call the apply-migrations script
if [ "$TARGET" = "local" ]; then
    ./db/apply-migrations.sh --local
else
    ./db/apply-migrations.sh --remote
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ BANCO DE DADOS RESETADO COM SUCESSO! ✨${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
