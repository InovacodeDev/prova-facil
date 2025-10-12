#!/bin/bash

# 🐳 Prova Fácil - Docker Compose Helper Script
# Facilita o gerenciamento dos containers Docker para desenvolvimento local

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de utilidade
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        echo "Instale Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando!"
        echo "Inicie o Docker Desktop"
        exit 1
    fi
    
    print_success "Docker está rodando"
}

# Verificar se docker-compose está disponível
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "docker-compose não está disponível!"
        exit 1
    fi
}

# Iniciar serviços
start_services() {
    print_info "Iniciando PostgreSQL e Redis..."
    docker compose up -d postgres redis
    
    echo ""
    print_info "Aguardando serviços ficarem prontos..."
    sleep 3
    
    # Verificar se PostgreSQL está pronto
    if docker compose exec postgres pg_isready -U postgres &> /dev/null; then
        print_success "PostgreSQL está pronto (localhost:5432)"
    else
        print_warning "PostgreSQL pode não estar pronto ainda. Execute: docker compose logs postgres"
    fi
    
    # Verificar se Redis está pronto
    if docker compose exec redis redis-cli ping &> /dev/null; then
        print_success "Redis está pronto (localhost:6379)"
    else
        print_warning "Redis pode não estar pronto ainda. Execute: docker compose logs redis"
    fi
    
    echo ""
    print_info "Conexões:"
    echo "  PostgreSQL: postgresql://postgres:postgres@localhost:5432/prova_facil"
    echo "  Redis: redis://localhost:6379"
}

# Iniciar com ferramentas web
start_with_tools() {
    print_info "Iniciando todos os serviços incluindo ferramentas web..."
    docker compose --profile tools up -d
    
    sleep 3
    
    echo ""
    print_success "Serviços web disponíveis:"
    echo "  Adminer (PostgreSQL): http://localhost:8080"
    echo "  Redis Commander: http://localhost:8081"
}

# Parar serviços
stop_services() {
    print_info "Parando serviços..."
    docker compose stop
    print_success "Serviços parados"
}

# Parar e remover containers
down_services() {
    print_info "Removendo containers..."
    docker compose down
    print_success "Containers removidos (volumes mantidos)"
}

# Resetar tudo (remove volumes)
reset_all() {
    print_warning "⚠️  ATENÇÃO: Isso vai apagar TODOS os dados do banco!"
    read -p "Tem certeza? (digite 'sim' para confirmar): " confirm
    
    if [ "$confirm" != "sim" ]; then
        print_info "Operação cancelada"
        exit 0
    fi
    
    print_info "Removendo tudo..."
    docker compose down -v
    print_success "Tudo removido. Execute 'setup' para recriar"
}

# Ver logs
logs() {
    if [ -z "$1" ]; then
        docker compose logs -f
    else
        docker compose logs -f "$1"
    fi
}

# Status dos serviços
status() {
    echo ""
    print_info "Status dos containers:"
    docker compose ps
    
    echo ""
    print_info "Conexões PostgreSQL:"
    docker compose exec postgres psql -U postgres -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null || print_warning "PostgreSQL não está rodando"
    
    echo ""
    print_info "Info Redis:"
    docker compose exec redis redis-cli INFO stats | grep -E "total_connections|keyspace" || print_warning "Redis não está rodando"
}

# Setup completo
setup() {
    print_info "🚀 Setup completo do ambiente de desenvolvimento"
    echo ""
    
    # 1. Verificar Docker
    check_docker
    check_docker_compose
    echo ""
    
    # 2. Iniciar serviços
    start_services
    echo ""
    
    # 3. Verificar .env.local
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local não encontrado"
        
        if [ -f ".env.local.example" ]; then
            read -p "Deseja copiar .env.local.example para .env.local? (s/n): " copy_env
            if [ "$copy_env" = "s" ]; then
                cp .env.local.example .env.local
                print_success ".env.local criado"
                print_warning "Edite .env.local com suas credenciais (Stripe, Google AI, etc)"
            fi
        fi
    else
        print_success ".env.local encontrado"
    fi
    echo ""
    
    # 4. Executar migrations
    print_info "Deseja executar migrations agora? (s/n): "
    read -p "> " run_migrations
    
    if [ "$run_migrations" = "s" ]; then
        echo ""
        print_info "Executando migrations..."
        
        # Aguardar PostgreSQL estar 100% pronto
        sleep 2
        
        # Migration principal
        if [ -f "db/migrations/0001_stripe_integration_remove_plan_fields.sql" ]; then
            docker compose exec -T postgres psql -U postgres -d prova_facil < db/migrations/0001_stripe_integration_remove_plan_fields.sql 2>/dev/null || print_warning "Erro na migration (pode já estar aplicada)"
            print_success "Migration aplicada"
        fi
        
        # Inserts
        if [ -f "db/inserts.sql" ]; then
            docker compose exec -T postgres psql -U postgres -d prova_facil < db/inserts.sql 2>/dev/null || print_warning "Erro nos inserts (pode já existir)"
            print_success "Inserts executados"
        fi
        
        # Policies
        if [ -f "db/policies.sql" ]; then
            docker compose exec -T postgres psql -U postgres -d prova_facil < db/policies.sql 2>/dev/null || print_warning "Erro nas policies (pode já existir)"
            print_success "Policies aplicadas"
        fi
        
        # Triggers
        if [ -f "db/triggers.sql" ]; then
            docker compose exec -T postgres psql -U postgres -d prova_facil < db/triggers.sql 2>/dev/null || print_warning "Erro nos triggers (pode já existir)"
            print_success "Triggers aplicados"
        fi
    fi
    
    echo ""
    print_success "✅ Setup completo!"
    echo ""
    print_info "Próximos passos:"
    echo "  1. Edite .env.local com suas credenciais"
    echo "  2. Execute: pnpm install"
    echo "  3. Execute: pnpm dev"
    echo ""
    print_info "Comandos úteis:"
    echo "  ./dev.sh logs       - Ver logs"
    echo "  ./dev.sh status     - Ver status"
    echo "  ./dev.sh psql       - Acessar PostgreSQL"
    echo "  ./dev.sh redis-cli  - Acessar Redis"
}

# Acessar PostgreSQL
psql_access() {
    print_info "Conectando ao PostgreSQL..."
    docker compose exec postgres psql -U postgres -d prova_facil
}

# Acessar Redis
redis_access() {
    print_info "Conectando ao Redis..."
    docker compose exec redis redis-cli
}

# Backup do PostgreSQL
backup_db() {
    timestamp=$(date +%Y%m%d_%H%M%S)
    filename="backup_${timestamp}.sql"
    
    print_info "Criando backup: $filename"
    docker compose exec -T postgres pg_dump -U postgres prova_facil > "$filename"
    print_success "Backup criado: $filename"
}

# Restore do PostgreSQL
restore_db() {
    if [ -z "$1" ]; then
        print_error "Uso: ./dev.sh restore <arquivo.sql>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        print_error "Arquivo não encontrado: $1"
        exit 1
    fi
    
    print_warning "⚠️  Isso vai sobrescrever o banco atual!"
    read -p "Tem certeza? (digite 'sim' para confirmar): " confirm
    
    if [ "$confirm" != "sim" ]; then
        print_info "Operação cancelada"
        exit 0
    fi
    
    print_info "Restaurando backup: $1"
    docker compose exec -T postgres psql -U postgres prova_facil < "$1"
    print_success "Backup restaurado"
}

# Menu de ajuda
show_help() {
    echo ""
    echo "🐳 Prova Fácil - Docker Compose Helper"
    echo ""
    echo "Uso: ./dev.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  setup           - Setup completo do ambiente (primeira vez)"
    echo "  start           - Iniciar PostgreSQL e Redis"
    echo "  start-tools     - Iniciar com ferramentas web (Adminer + Redis Commander)"
    echo "  stop            - Parar serviços"
    echo "  down            - Parar e remover containers"
    echo "  reset           - ⚠️  Resetar tudo (apaga dados!)"
    echo "  logs [service]  - Ver logs (all, postgres, redis)"
    echo "  status          - Ver status dos serviços"
    echo "  psql            - Acessar PostgreSQL CLI"
    echo "  redis-cli       - Acessar Redis CLI"
    echo "  backup          - Criar backup do PostgreSQL"
    echo "  restore <file>  - Restaurar backup do PostgreSQL"
    echo "  help            - Mostrar esta ajuda"
    echo ""
}

# Main
case "$1" in
    setup)
        setup
        ;;
    start)
        check_docker
        check_docker_compose
        start_services
        ;;
    start-tools)
        check_docker
        check_docker_compose
        start_with_tools
        ;;
    stop)
        stop_services
        ;;
    down)
        down_services
        ;;
    reset)
        reset_all
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    psql)
        psql_access
        ;;
    redis-cli)
        redis_access
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando inválido: $1"
        show_help
        exit 1
        ;;
esac
