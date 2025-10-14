#!/bin/bash

# apply-migrations.sh
# Script para aplicar todas as migrations e setup files
# Uso: ./db/apply-migrations.sh [--local|--remote]
# --local: aplica no banco local do Supabase (padrão)
# --remote: aplica no banco remoto (produção)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to local
TARGET="local"
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Parse arguments
if [ "$1" = "--remote" ]; then
    TARGET="remote"
    echo -e "${YELLOW}⚠️  ATENÇÃO: Você está prestes a aplicar migrations no banco REMOTO!${NC}"
    read -p "Tem certeza que deseja continuar? (digite 'sim' para confirmar): " confirm
    if [ "$confirm" != "sim" ]; then
        echo -e "${RED}❌ Operação cancelada${NC}"
        exit 1
    fi

    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ Erro: DATABASE_URL não está definida${NC}"
        echo "Execute: export DATABASE_URL='sua-connection-string'"
        exit 1
    fi
    DB_URL="$DATABASE_URL"
fi

echo -e "${BLUE}🚀 Iniciando aplicação de migrations e setup files...${NC}"
echo -e "${BLUE}Target: $([ "$TARGET" = "remote" ] && echo "REMOTE (produção)" || echo "LOCAL")${NC}"
echo ""

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2

    echo -e "${YELLOW}📄 Executando: ${file}${NC}"
    echo -e "   ${description}"

    # Execute using psql
    psql "$DB_URL" -f "$file" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao executar $file${NC}"
        echo -e "${RED}Execute manualmente para ver o erro: psql \"$DB_URL\" -f \"$file\"${NC}"
        exit 1
    fi
    echo ""
}

# =====================================================
# PHASE 1: MIGRATIONS (in order)
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 FASE 1: MIGRATIONS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

execute_sql "db/migrations/0001_create_enums.sql" "Criando enums (plan, support_type, question_type, etc.)"
execute_sql "db/migrations/0002_create_academic_levels.sql" "Criando tabela academic_levels"
execute_sql "db/migrations/0003_create_profiles.sql" "Criando tabela profiles"
execute_sql "db/migrations/0004_create_assessments.sql" "Criando tabela assessments"
execute_sql "db/migrations/0005_create_questions.sql" "Criando tabela questions"
execute_sql "db/migrations/0006_create_logs.sql" "Criando tabela logs"
execute_sql "db/migrations/0007_create_plans.sql" "Criando tabela plans"
execute_sql "db/migrations/0008_create_profile_logs_cycle.sql" "Criando tabela profile_logs_cycle"
execute_sql "db/migrations/0009_create_error_logs.sql" "Criando tabela error_logs"

# =====================================================
# PHASE 2: TRIGGERS
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⚡ FASE 2: TRIGGERS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

execute_sql "db/triggers.sql" "Criando triggers (updated_at, cache invalidation, log tracking)"

# =====================================================
# PHASE 3: POLICIES (RLS)
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 FASE 3: ROW LEVEL SECURITY POLICIES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

execute_sql "db/policies.sql" "Criando RLS policies para todas as tabelas"

# =====================================================
# PHASE 4: SEED DATA (INSERTS)
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌱 FASE 4: SEED DATA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

execute_sql "db/inserts.sql" "Inserindo dados iniciais (5 plans + 13 academic levels)"

# =====================================================
# SUCCESS
# =====================================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ TODAS AS MIGRATIONS FORAM APLICADAS COM SUCESSO! ✨${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Resumo:${NC}"
echo -e "   ✅ 9 migrations aplicadas"
echo -e "   ✅ Triggers configurados"
echo -e "   ✅ RLS policies ativadas"
echo -e "   ✅ Seed data inserido"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "   1. Verifique as tabelas: ${BLUE}supabase db diff${NC}"
echo -e "   2. Teste as policies: Execute queries como usuário autenticado"
echo -e "   3. Verifique os dados: ${BLUE}SELECT * FROM plans;${NC}"
echo ""
