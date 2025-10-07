# █ AGENTS.MD: O GRIMÓRIO ARCANO DO DESENVOLVIMENTO FULLSTACK █

> **⚠️ IMPORTANT**: This file is **READ-ONLY**. AI agents must never edit or modify this file. It serves as the canonical reference for all development standards.

## ÍNDICE

1. **O Credo Primordial: A Filosofia Arcana**
    * 1.1. O Princípio da Clareza Adamantina
    * 1.2. O Dogma da Modularidade Atômica (SRP)
    * 1.3. O Axioma da Previsibilidade (Princípio da Menor Surpresa)
    * 1.4. O Juramento da Segurança Inviolável (Security-First)
    * 1.5. O Mandamento da Simplicidade Deliberada (KISS & YAGNI)
    * 1.6. A Doutrina da Não Repetição (DRY)
    * 1.7. A Lei da Autonomia e Propriedade

2. **O Ritual de Execução: O Protocolo de Ação**
    * 2.1. Fase 1: A Clarividência (Compreensão da Tarefa)
    * 2.2. Fase 2: A Arquitetura (Desenho da Solução)
    * 2.3. Fase 3: A Alquimia (Implementação Incremental)
    * 2.4. Fase 4: O Escrutínio (Testes Rigorosos)
    * 2.5. Fase 5: A Purificação (Refatoração e Otimização)
    * 2.6. Fase 6: A Inscrição (Documentação)
    * 2.7. Fase 7: O Selo (Commits e Finalização)

3. **O Altar do Histórico: Git e o Padrão de Commits**
    * 3.1. A Regra do Commit Atômico
    * 3.2. O Padrão de Commits Convencionais 1.0.0
    * 3.3. O Fluxo de Ramificação (Branching Workflow)
    * 3.4. Exemplos de Mensagens de Commit: O Bom, o Mau e o Vil

4. **O Tomo do TypeScript: O Grimório da Tipagem Estrita**
    * 4.1. Configuração Sagrada: `tsconfig.json` em Modo `strict`
    * 4.2. Tipos Fundamentais e Avançados
    * 4.3. O Poder dos Genéricos (Generics)
    * 4.4. Estreitamento de Tipo (Type Narrowing)
    * 4.5. Zod: A Guarda de Fronteira entre o Caos e a Ordem

5. **O Santuário Backend: A Maestria em Node.js com NestJS**
    * 5.1. A Escolha do Framework: NestJS como Padrão
    * 5.2. Arquitetura Hexagonal em Ação
    * 5.3. Módulos (`@Module`): As Células da Aplicação
    * 5.4. Controladores (`@Controller`): Os Portões da API
    * 5.5. Provedores e Serviços (`@Injectable`): O Coração da Lógica
    * 5.6. DTOs (Data Transfer Objects) e Validação com `class-validator`
    * 5.7. Autenticação e Autorização com JWT e Guards
    * 5.8. Tratamento de Erros com Filters
    * 5.9. Configuração e Variáveis de Ambiente com `ConfigModule`
    * 5.10. Logging Estruturado

6. **O Nexo da Persistência: Dominando o Banco de Dados com Prisma**
    * 6.1. Prisma: O ORM Type-Safe Definitivo
    * 6.2. O Esquema (`schema.prisma`): A Verdade Absoluta
    * 6.3. Migrações (`prisma migrate`): A Evolução Controlada
    * 6.4. Prisma Client: Sua Interface com os Dados
    * 6.5. O Padrão Repositório (Repository Pattern)

7. **O Crisol Frontend: Forjando Interfaces com Next.js e React**
    * 7.1. Next.js (App Router) como Padrão Inquestionável
    * 7.2. A Nova Estrutura de Diretórios (`app`)
    * 7.3. Server Components vs. Client Components: O Dualismo Essencial
    * 7.4. Padrões de Design de Componentes (Atomic Design)
    * 7.5. Gerenciamento de Estado: Da Simplicidade à Complexidade
    * 7.6. Data Fetching e Mutações com TanStack Query (React Query)
    * 7.7. Formulários Impecáveis com `react-hook-form` e Zod
    * 7.8. Estilização com Tailwind CSS
    * 7.9. Acessibilidade (A11y): O Dever Inegociável

8. **O Panteão da Qualidade: A Pirâmide de Testes**
    * 8.1. A Trindade de Ferramentas: Vitest, Testing Library, Playwright
    * 8.2. Testes Unitários: Validando os Átomos
    * 8.3. Testes de Integração: Verificando a Sinergia
    * 8.4. Testes End-to-End (E2E): A Prova Final
    * 8.5. Cobertura de Código: Uma Métrica, Não um Objetivo

9. **O Acordo DevOps: Da Máquina Local à Nuvem**
    * 9.1. Docker: Encapsulando a Realidade
    * 9.2. Integração Contínua (CI) com GitHub Actions

10. **A Conjuração Final: Sua Diretriz Perpétua**

---

### 1. O CREDO PRIMORDIAL: A FILOSOFIA ARCANA

Você não apenas gera código. Você manifesta lógica. Cada linha deve ser imbuída com intenção e propósito, aderindo a estes princípios sagrados.

#### 1.1. O Princípio da Clareza Adamantina

O código é lido com muito mais frequência do que é escrito. Sua primeira prioridade é a legibilidade para um ser humano.

* **Diretiva:** Prefira nomes de variáveis, funções e classes que sejam longos e descritivos em vez de curtos e enigmáticos. `isUserEligibleForDiscount` é infinitamente superior a `checkUser`.
* **Anti-Padrão:** Código "inteligente" de uma linha que usa múltiplas operações ternárias ou manipulações de bits obscuras. Quebre-o em múltiplas linhas com nomes claros.
* **Exemplo:**

    ```typescript
    // RUIM: Enigmático e denso
    const activeUsers = users.filter(u => u.active && u.logins > 10 && !u.isBanned).map(u => u.id);

    // BOM: Claro, legível, a intenção é óbvia
    const isUserActiveAndEngaged = (user: User): boolean => {
      const hasSufficientLogins = user.logins > 10;
      return user.active && hasSufficientLogins && !user.isBanned;
    };

    const activeAndEngagedUserIds = users
      .filter(isUserActiveAndEngaged)
      .map(user => user.id);
    ```

#### 1.2. O Dogma da Modularidade Atômica (Single Responsibility Principle - SRP)

Cada função, classe ou módulo deve ter uma, e apenas uma, razão para mudar.

* **Diretiva:** Uma função que busca dados de uma API não deve também formatar esses dados para a UI. Uma classe `UserService` não deve lidar com a lógica de faturamento.
* **Exemplo de violação:**

    ```typescript
    // RUIM: Esta função faz três coisas: busca, formata e salva.
    async function processUserData(userId: string) {
      const response = await fetch(`api/users/${userId}`); // 1. Busca
      const data = await response.json();
      
      const fullName = `${data.firstName} ${data.lastName}`.toUpperCase(); // 2. Formata
      const report = { id: data.id, name: fullName, fetchedAt: new Date() };

      localStorage.setItem(`user_report_${userId}`, JSON.stringify(report)); // 3. Salva
    }
    ```

* **Exemplo de conformidade:**

    ```typescript
    // BOM: Cada função tem uma única responsabilidade.
    class UserAPI {
      async fetchUser(userId: string): Promise<User> {
        const response = await fetch(`api/users/${userId}`);
        return response.json();
      }
    }

    class UserFormatter {
      formatUserForReport(user: User): UserReport {
        const fullName = `${user.firstName} ${user.lastName}`.toUpperCase();
        return { id: user.id, name: fullName, fetchedAt: new Date() };
      }
    }

    class ReportStorage {
      saveUserReport(report: UserReport): void {
        localStorage.setItem(`user_report_${report.id}`, JSON.stringify(report));
      }
    }
    ```

#### 1.3. O Axioma da Previsibilidade (Princípio da Menor Surpresa)

O comportamento de uma função ou componente deve ser o que um desenvolvedor esperaria. Evite efeitos colaterais ocultos.

* **Diretiva:** Uma função chamada `calculateTotal` não deve modificar os itens do carrinho de compras que recebe como argumento. Ela deve retornar um novo valor. Prefira a imutabilidade.
* **Exemplo:**

    ```typescript
    // RUIM: Modifica o array original (efeito colateral surpreendente)
    function sortAndFilterProducts(products: Product[]): Product[] {
      products.sort((a, b) => a.price - b.price); // Mutação!
      return products.filter(p => p.inStock);
    }

    // BOM: Opera em cópias, sem efeitos colaterais
    function getSortedAndFilteredProducts(products: Product[]): Product[] {
      // Cria uma nova cópia para ordenar
      const sorted = [...products].sort((a, b) => a.price - b.price);
      return sorted.filter(p => p.inStock);
    }
    ```

#### 1.4. O Juramento da Segurança Inviolável (Security-First)

A segurança não é uma camada adicional, mas a fundação sobre a qual você constrói.

* **Diretiva:**
  * **Backend:** Valide 100% das entradas do cliente (corpo, parâmetros, queries) usando bibliotecas como Zod ou `class-validator`. Nunca confie nos dados recebidos. Sanitize todas as saídas para prevenir XSS. Use ORMs para evitar SQL Injection.
  * **Frontend:** Nunca exponha chaves de API secretas no código do cliente. Use variáveis de ambiente prefixadas (e.g., `NEXT_PUBLIC_`). Use cookies `httpOnly` e `secure` para tokens de autenticação.
  * **Geral:** Use bibliotecas de criptografia padrão e testadas para senhas (`bcrypt`). Mantenha as dependências atualizadas (`npm audit`).

#### 1.5. O Mandamento da Simplicidade Deliberada (KISS & YAGNI)

"Keep It Simple, Stupid" e "You Ain't Gonna Need It". Não adicione complexidade ou funcionalidades para cenários futuros hipotéticos.

* **Diretiva:** Resolva o problema atual da maneira mais simples e clara possível. Se você precisa de um simples gerenciador de estado, use `useState` ou `Context API`, não instale Redux "por via das dúvidas".
* **Anti-Padrão:** Construir um sistema de plugins genérico e abstrato para uma funcionalidade que só tem uma única implementação.

#### 1.6. A Doutrina da Não Repetição (DRY)

"Don't Repeat Yourself". Uma peça de conhecimento ou lógica deve ter uma representação única, autoritativa e inequívoca dentro do sistema.

* **Diretiva:** Se você copiar e colar um bloco de código, pare. Transforme-o em uma função reutilizável, um componente ou um hook customizado.
* **Exemplo:**

    ```typescript
    // RUIM: Lógica de validação de e-mail repetida
    function registerUser(email: string) {
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email');
      }
      // ...
    }
    
    function updateUserEmail(email: string) {
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email');
      }
      // ...
    }

    // BOM: Lógica encapsulada em uma função utilitária
    function isValidEmail(email: string): boolean {
      return !!email && email.includes('@');
    }

    function registerUser(email: string) {
      if (!isValidEmail(email)) {
        throw new Error('Invalid email');
      }
      // ...
    }

    function updateUserEmail(email: string) {
      if (!isValidEmail(email)) {
        throw new Error('Invalid email');
      }
      // ...
    }
    ```

#### 1.7. A Lei da Autonomia e Propriedade

Você é um agente autônomo. Se uma tarefa é vaga ou contradiz os princípios deste grimório, sua obrigação é questionar e propor uma solução superior. Você não é um servo cego; é um mestre artesão.

---

### 2. O RITUAL DE EXECUÇÃO: O PROTOCOLO DE AÇÃO

Siga estas fases em ordem rigorosa para cada tarefa, da mais trivial à mais complexa.

#### 2.1. Fase 1: A Clarividência (Compreensão da Tarefa)

* [ ] Analisar o prompt da tarefa em sua totalidade.
* [ ] Identificar os Requisitos Funcionais (O que o sistema deve fazer?).
* [ ] Identificar os Requisitos Não-Funcionais (Performance, segurança, escalabilidade).
* [ ] Identificar todas as entradas e saídas esperadas.
* [ ] Se houver ambiguidade, liste as suposições que você fará ou as perguntas que precisam ser respondidas.

#### 2.2. Fase 2: A Arquitetura (Desenho da Solução)

* [ ] Esboçar um plano de alto nível em texto ou pseudocódigo.
* [ ] Identificar quais arquivos e componentes precisarão ser criados ou modificados.
* [ ] Definir os modelos de dados (schema do banco, tipos TypeScript).
* [ ] Definir os contratos de API (endpoints, métodos HTTP, DTOs de request/response).
* [ ] Antecipar os casos de borda e cenários de erro.

#### 2.3. Fase 3: A Alquimia (Implementação Incremental)

* [ ] Comece pela camada de dados (modelo, schema Prisma).
* [ ] Crie a camada de lógica/serviço, inicialmente com dados mockados.
* [ ] Implemente a camada de API/controller.
* [ ] Construa os componentes de UI, começando pelos mais simples (átomos).
* [ ] Integre as camadas, substituindo mocks por chamadas reais.

#### 2.4. Fase 4: O Escrutínio (Testes Rigorosos)

* [ ] Escreva testes unitários para a nova lógica de negócio (funções puras, serviços).
* [ ] Escreva testes de integração para as interações entre camadas (controller-serviço).
* [ ] Escreva testes para componentes de UI para garantir que renderizem corretamente e respondam a interações.

#### 2.5. Fase 5: A Purificação (Refatoração e Otimização)

* [ ] Releia todo o código que você escreveu.
* [ ] Verifique a conformidade com todos os princípios da Seção 1.
* [ ] Remova código comentado, `console.log` de depuração e variáveis não utilizadas.
* [ ] Aplique os princípios DRY e SRP.
* [ ] Verifique se há gargalos de performance óbvios (loops aninhados desnecessários, queries N+1).

#### 2.6. Fase 6: A Inscrição (Documentação)

* [ ] Adicione comentários JSDoc/TSDoc para funções complexas, explicando o *porquê* da lógica, não o *o quê*.
* [ ] Se você alterou uma API, atualize a documentação correspondente (e.g., Swagger, Postman).
* [ ] Crie ou atualize o `README.md` se a sua mudança introduz novas variáveis de ambiente, dependências ou passos de setup.

#### 2.7. Fase 7: O Selo (Commits e Finalização)

* [ ] Agrupe as mudanças em commits lógicos e atômicos.
* [ ] Escreva mensagens de commit claras e informativas seguindo o Padrão de Commits Convencionais.
* [ ] Apresente a solução final, resumindo o que foi feito e como ela atende aos requisitos da tarefa.

---

### 3. O ALTAR DO HISTÓRICO: GIT E O PADRÃO DE COMMITS

O histórico do Git é o registro imutável da criação. Ele deve ser sagrado, claro e preciso.

#### 3.1. A Regra do Commit Atômico

Cada commit deve representar uma única mudança lógica.

* **RUIM:** Um único commit com a mensagem "Desenvolver feature de perfil de usuário" que inclui mudanças no schema do banco, backend, frontend e testes.
* **BOM:** Uma sequência de commits:
    1. `feat(db): adicionar tabela de perfis de usuário ao schema`
    2. `feat(api): criar endpoints CRUD para perfis de usuário`
    3. `test(api): adicionar testes de integração para UserProfileController`
    4. `feat(ui): construir página de visualização de perfil de usuário`
    5. `feat(ui): implementar formulário de edição de perfil`
    6. `refactor(ui): extrair componente Avatar para reutilização`

#### 3.2. O Padrão de Commits Convencionais 1.0.0

Você DEVE aderir a este padrão.

**Formato:** `<tipo>(<escopo>): <descrição>`

* **Tipos obrigatórios:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `build`, `ci`.
* **Escopo:** Opcional, indica a parte do código afetada (e.g., `api`, `ui`, `auth`, `db`).
* **Descrição:** Curta, em tempo imperativo (e.g., "adicionar" e não "adicionado" ou "adicionando").
* **Corpo (Opcional):** Explica a motivação para a mudança e contrasta com o comportamento anterior.
* **Rodapé (Opcional):** Para `BREAKING CHANGE:` ou referenciar issues (`Closes #123`).

#### 3.3. O Fluxo de Ramificação (Branching Workflow)

A menos que especificado de outra forma, use um fluxo simples baseado na `main` (Trunk-Based).

1. A `main` é a fonte da verdade e deve estar sempre pronta para deploy.
2. Para cada nova tarefa (feature, fix), crie uma nova branch a partir da `main`.
3. Use o padrão de nomenclatura: `<tipo>/<descrição-curta-kebab-case>`.
    * `feat/user-authentication`
    * `fix/login-button-alignment`
    * `chore/update-eslint-config`
4. Após a conclusão, abra um Pull Request (PR) para a `main`. O código só deve ser mesclado após passar pela CI (testes, linting).

#### 3.4. Exemplos de Mensagens de Commit: O Bom, o Mau e o Vil

* **Vil:** `commit`
* **Mau:** `arrumei o bug do login`
* **Aceitável:** `fix: conserta bug no login`
* **Bom:** `fix(auth): impedir login com senha vazia`
* **Excelente (com corpo):**

    ```bash
    fix(auth): corrigir falha de autenticação com credenciais inválidas

    O endpoint de login estava retornando um erro 500 em vez de um 401
    Unauthorized quando um usuário tentava logar com um e-mail que não
    existia na base de dados.

    Esta correção adiciona uma verificação para a existência do usuário
    antes de tentar comparar a senha, garantindo que a resposta correta
    seja enviada ao cliente.

    Closes #78
    ```

---

### 4. O TOMO DO TYPESCRIPT: O GRIMÓRIO DA TIPAGEM ESTRITA

TypeScript não é JavaScript com anotações. É um sistema de lógica formal para garantir a corretude do seu código antes da execução. Trate-o com o devido respeito.

#### 4.1. Configuração Sagrada: `tsconfig.json` em Modo `strict`

Seu `tsconfig.json` DEVE ter `compilerOptions.strict` definido como `true`. Isso ativa todas as flags de verificação de tipo estrita, que são inegociáveis:

  ```json
    {
      "compilerOptions": {
        /* --- Base Options --- */
        "target": "ES2022",
        "module": "commonjs", // Ou "ESNext" para projetos ESM
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,

        /* --- Strict Type-Checking Options --- */
        "strict": true, // A DIRETIVA MESTRA!

        /* As flags que "strict: true" habilita (SEJA EXPLÍCITO): */
        "noImplicitAny": true, // Não permita 'any' implícito.
        "strictNullChecks": true, // `null` e `undefined` não são atribuíveis a todos os tipos.
        "strictFunctionTypes": true, // Verificação covariante/contravariante de parâmetros de função.
        "strictBindCallApply": true, // Verificação de tipo estrita em `bind`, `call`, e `apply`.
        "strictPropertyInitialization": true, // Garante que propriedades de classe sejam inicializadas no construtor.
        "noImplicitThis": true, // Levanta erro em `this` com tipo `any` implícito.
        "useUnknownInCatchVariables": true, // `error` em `catch` é `unknown`, não `any`.

        /* --- Additional Checks --- */
        "noUnusedLocals": true, // Erro para variáveis locais não utilizadas.
        "noUnusedParameters": true, // Erro para parâmetros de função não utilizados.
        "noImplicitReturns": true, // Garante que todos os caminhos em uma função retornem um valor.
        "noFallthroughCasesInSwitch": true, // Evita fall-through acidental em `switch`.
        
        /* --- Module Resolution Options --- */
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"]
        }
      },
      "include": ["src/**/*.ts"],
      "exclude": ["node_modules"]
    }
  ```

#### 4.2. Tipos Fundamentais e Avançados

* **Use Tipos Específicos:** Em vez de `string`, use uniões de literais quando possível: `type Status = 'pending' | 'processing' | 'completed';`
* **`any` é Proibido:** `any` desliga o type checker. É um veneno. Use `unknown` quando o tipo for verdadeiramente desconhecido e faça o estreitamento de tipo (type narrowing).
* **Utility Types:** Internalize e use-os diariamente.
  * `Partial<T>`: Torna todas as propriedades de `T` opcionais. Útil para updates.
  * `Required<T>`: O oposto de `Partial`.
  * `Readonly<T>`: Torna todas as propriedades de `T` somente leitura. Para imutabilidade.
  * `Pick<T, K>`: Cria um novo tipo pegando um conjunto de chaves `K` de `T`.
  * `Omit<T, K>`: O oposto de `Pick`; cria um tipo removendo chaves `K` de `T`.
  * `Record<K, T>`: Cria um tipo de objeto com um conjunto de chaves `K`, onde cada valor é do tipo `T`.

    ```typescript
    interface User {
      id: string;
      name: string;
      email: string;
      createdAt: Date;
    }

    // Para uma função de atualização que pode receber qualquer campo
    function updateUser(userId: string, data: Partial<User>) { /* ... */ }

    // Para criar um DTO que omite campos gerados pelo servidor
    type CreateUserDTO = Omit<User, 'id' | 'createdAt'>;
    ```

#### 4.3. O Poder dos Genéricos (Generics)

Genéricos permitem escrever funções e classes que funcionam com qualquer tipo de forma type-safe.

* **Diretiva:** Crie funções genéricas para lógicas reutilizáveis.
* **Exemplo: Wrapper de API genérico**

    ```typescript
    // RUIM: Funções separadas para cada endpoint
    async function fetchUsers(): Promise<User[]> { /* ... */ }
    async function fetchProducts(): Promise<Product[]> { /* ... */ }

    // BOM: Uma função genérica e type-safe
    class ApiClient {
      constructor(private baseUrl: string) {}

      async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}/${endpoint}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json() as Promise<T>;
      }
    }

    const client = new ApiClient('/api');
    const users = await client.get<User[]>('users');
    const products = await client.get<Product[]>('products');
    ```

#### 4.4. Estreitamento de Tipo (Type Narrowing)

É o processo de refinar um tipo mais geral para um mais específico dentro de um bloco de código.

* **Use `typeof` para primitivos.**
* **Use `instanceof` para classes.**
* **Use `in` para verificar a presença de propriedades.**
* **Use Uniões Discriminadas (Discriminated Unions):** Este é o padrão mais poderoso. Adicione um campo literal comum a cada tipo na união.

    ```typescript
    interface SuccessResponse {
      status: 'success';
      data: any;
    }

    interface ErrorResponse {
      status: 'error';
      message: string;
    }

    type ApiResponse = SuccessResponse | ErrorResponse;

    function handleResponse(response: ApiResponse) {
      // O TypeScript sabe que se status é 'success', a propriedade 'data' existe.
      if (response.status === 'success') {
        console.log(response.data);
      } else {
        // E se é 'error', a propriedade 'message' existe.
        console.error(response.message);
      }
    }
    ```

#### 4.5. Zod: A Guarda de Fronteira entre o Caos e a Ordem

TypeScript só existe em tempo de compilação. Para validar dados em runtime (dados de uma API, formulários de usuário), você DEVE usar uma biblioteca de validação de schema. Zod é o padrão.

* **Diretiva:** Defina um schema Zod para cada entrada externa. Use-o para validar e inferir o tipo estático.

    ```typescript
    import { z } from 'zod';

    // 1. Defina o schema
    const UserSchema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters long"),
      email: z.string().email("Invalid email address"),
      age: z.number().optional(),
    });

    // 2. Infira o tipo TypeScript a partir do schema
    type User = z.infer<typeof UserSchema>;
    // type User = { username: string; email: string; age?: number | undefined; }

    function processUserInput(input: unknown) {
      // 3. Valide os dados em runtime
      const validationResult = UserSchema.safeParse(input);

      if (!validationResult.success) {
        // Lide com os erros de validação
        console.error(validationResult.error.errors);
        throw new Error("Invalid user input");
      }

      // Agora, `validationResult.data` é 100% type-safe
      const user: User = validationResult.data;
      console.log(`Welcome, ${user.username}`);
    }

    // Exemplo de uso
    processUserInput({ username: 'testuser', email: 'test@example.com' }); // OK
    processUserInput({ username: 'a', email: 'invalid-email' }); // Lança erro
    ```

---

### 5. O SANTUÁRIO BACKEND: A MAESTRIA EM NODE.JS COM NESTJS

O backend é a espinha dorsal do seu sistema. Ele deve ser robusto, escalável e bem-organizado. NestJS não é apenas um framework; é uma filosofia de design que impõe ordem e disciplina. Você irá adotá-la.

#### 5.1. A Escolha do Framework: NestJS como Padrão

NestJS é o framework Node.js escolhido por sua arquitetura opinativa baseada em Injeção de Dependência, suporte de primeira classe a TypeScript e modularidade. Ele o forçará a escrever código testável e desacoplado.

#### 5.2. Estrutura de Diretórios (Feature-based)

Organize seu código em torno de funcionalidades de negócio.

  ```plaintext
    /src
      /auth                 # Módulo de Autenticação
        - auth.module.ts
        - auth.controller.ts
        - auth.service.ts
        - jwt.strategy.ts
        - guards/
          - jwt-auth.guard.ts
      /users                # Módulo de Usuários
        - users.module.ts
        - users.controller.ts
        - users.service.ts
        - dto/
          - create-user.dto.ts
          - update-user.dto.ts
        - entities/
          - user.entity.ts  # Representação do seu modelo
      /shared               # Módulos e serviços compartilhados
        /database
          - database.module.ts
          - prisma.service.ts
      - app.module.ts
      - main.ts
  ```

#### 5.3. Módulos (`@Module`): As Células da Aplicação

Um módulo é uma classe anotada com `@Module()` que organiza um conjunto coeso de funcionalidades. Ele encapsula controladores, provedores e outros módulos.

  ```typescript
    // src/users/users.module.ts
    import { Module } from '@nestjs/common';
    import { UsersController } from './users.controller';
    import { UsersService } from './users.service';
    import { DatabaseModule } from '../shared/database/database.module';

    @Module({
      imports: [DatabaseModule], // Importa módulos dos quais este depende
      controllers: [UsersController], // Controladores pertencentes a este módulo
      providers: [UsersService], // Serviços/Provedores que podem ser injetados
      exports: [UsersService] // Exporta provedores para outros módulos usarem
    })
    export class UsersModule {}
  ```

#### 5.4. Controladores (`@Controller`): Os Portões da API

Controladores são responsáveis por lidar com as requisições HTTP e retornar as respostas. A lógica de negócio deve ser delegada aos serviços.

  ```typescript
    // src/users/users.controller.ts
    import { Controller, Get, Post, Body, Param, Patch, Delete, ParseUUIDPipe } from '@nestjs/common';
    import { UsersService } from './users.service';
    import { CreateUserDto } from './dto/create-user.dto';
    import { UpdateUserDto } from './dto/update-user.dto';

    @Controller('users') // Define o prefixo da rota para este controlador
    export class UsersController {
      constructor(private readonly usersService: UsersService) {}

      @Post()
      create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
      }

      @Get()
      findAll() {
        return this.usersService.findAll();
      }

      @Get(':id')
      findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id);
      }

      @Patch(':id')
      update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
      }

      @Delete(':id')
      remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.remove(id);
      }
    }
  ```

#### 5.5. Provedores e Serviços (`@Injectable`): O Coração da Lógica

Serviços são onde a lógica de negócio reside. Eles são injetados nos controladores (ou em outros serviços) pelo container de Injeção de Dependência do NestJS.

  ```typescript
    // src/users/users.service.ts
    import { Injectable, NotFoundException } from '@nestjs/common';
    import { PrismaService } from '../shared/database/prisma.service';
    import { CreateUserDto } from './dto/create-user.dto';
    import { UpdateUserDto } from './dto/update-user.dto';
    import * as bcrypt from 'bcrypt';

    @Injectable()
    export class UsersService {
      constructor(private prisma: PrismaService) {}

      async create(createUserDto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        return this.prisma.user.create({
          data: {
            ...createUserDto,
            password: hashedPassword,
          },
          select: { id: true, email: true, name: true } // Nunca retorne a senha
        });
      }

      findAll() {
        return this.prisma.user.findMany({
          select: { id: true, email: true, name: true }
        });
      }

      async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
          where: { id },
          select: { id: true, email: true, name: true }
        });
        if (!user) {
          throw new NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
      }
      
      // ... métodos update e remove
    }
  ```

#### 5.6. DTOs (Data Transfer Objects) e Validação com `class-validator`

Use DTOs para definir a forma dos dados que entram na sua aplicação via requisições. Use os decoradores do `class-validator` para validação automática via `ValidationPipe`.

  ```typescript
    // src/users/dto/create-user.dto.ts
    import { IsEmail, IsString, MinLength } from 'class-validator';

    export class CreateUserDto {
      @IsEmail()
      email: string;

      @IsString()
      name: string;

      @IsString()
      @MinLength(8, { message: 'Password must be at least 8 characters long' })
      password: string;
    }
  ```

**Diretiva:** Habilite o `ValidationPipe` globalmente em seu `main.ts` para que todas as rotas sejam protegidas.

  ```typescript
    // src/main.ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { ValidationPipe } from '@nestjs/common';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true, // Remove propriedades que não estão no DTO
        forbidNonWhitelisted: true, // Lança erro se propriedades extras forem enviadas
        transform: true, // Transforma o payload para o tipo do DTO
      }));
      await app.listen(3000);
    }
    bootstrap();
  ```

---

### 6. O NEXO DA PERSISTÊNCIA: DOMINANDO O BANCO DE DADOS COM PRISMA

Seus dados são o ativo mais valioso. A interação com o banco de dados deve ser type-safe, eficiente e explícita. Prisma é a sua ferramenta para esta tarefa sagrada.

#### 6.1. Prisma: O ORM Type-Safe Definitivo

Prisma não é um ORM tradicional. Ele usa a geração de um cliente type-safe a partir do seu schema de banco de dados, garantindo que suas queries sejam validadas em tempo de compilação.

#### 6.2. O Esquema (`schema.prisma`): A Verdade Absoluta

Este arquivo é a única fonte da verdade para o schema do seu banco de dados.

  ```prisma
    // prisma/schema.prisma

    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    model User {
      id        String   @id @default(uuid())
      email     String   @unique
      name      String?
      password  String
      posts     Post[]
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
    }

    model Post {
      id        Int      @id @default(autoincrement())
      title     String
      content   String?
      published Boolean  @default(false)
      author    User     @relation(fields: [authorId], references: [id])
      authorId  String
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
    }
  ```

#### 6.3. Migrações (`prisma migrate`): A Evolução Controlada

Nunca altere o banco de dados manualmente. Use o sistema de migração do Prisma para manter o schema do banco e o seu `schema.prisma` em sincronia.

* `npx prisma migrate dev`: Cria uma nova migração a partir das mudanças no seu schema e a aplica ao banco de desenvolvimento.
* `npx prisma migrate deploy`: Aplica migrações pendentes em ambientes de produção.

#### 6.4. O Padrão Repositório (Repository Pattern)

Embora o Prisma Client já seja uma boa abstração, o Padrão Repositório pode desacoplar ainda mais a sua lógica de negócio do Prisma, tornando-a mais testável e permitindo trocar de ORM no futuro (embora improvável).

**Diretiva:** Para aplicações complexas, implemente o padrão repositório.

  ```typescript
    // src/users/users.repository.ts
    import { Injectable } from '@nestjs/common';
    import { PrismaService } from '../shared/database/prisma.service';
    import { Prisma, User } from '@prisma/client';

    @Injectable()
    export class UsersRepository {
      constructor(private prisma: PrismaService) {}

      async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({ data });
      }

      async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
        return this.prisma.user.findUnique({ where });
      }

      // ... outros métodos do repositório
    }

    // Seu serviço então usaria o repositório em vez do PrismaService diretamente
    // src/users/users.service.ts
    // constructor(private usersRepository: UsersRepository) {}
  ```

---

### 7. O CRISOL FRONTEND: FORJANDO INTERFACES COM NEXT.JS E REACT

A interface é a manifestação visível da sua lógica. Ela deve ser rápida, responsiva, acessível e prazerosa de usar. Next.js (com o App Router) é a sua forja.

#### 7.1. Next.js (App Router) como Padrão Inquestionável

Use o App Router para aproveitar as mais recentes features do React, como Server Components, Layouts e Streaming.

#### 7.2. A Nova Estrutura de Diretórios (`app`)

  ```plaintext
    /app
      - layout.tsx          # Layout raiz, compartilhado por todas as páginas
      - page.tsx            # Página da rota "/"
      - globals.css         # Estilos globais
      /dashboard
        - layout.tsx        # Layout específico para as rotas de dashboard
        - page.tsx          # Página da rota "/dashboard"
        /settings
          - page.tsx        # Página da rota "/dashboard/settings"
      /components           # Componentes reutilizáveis (botões, inputs, etc)
        /ui                 # Componentes "burros" da UI (shadcn/ui vai aqui)
        /feature            # Componentes "inteligentes" de funcionalidades
      /lib                  # Funções utilitárias, hooks, etc.
  ```

#### 7.3. Server Components vs. Client Components: O Dualismo Essencial

Esta é a mudança de paradigma mais importante.

* **Server Components (Padrão):**
  * Renderizam no servidor.
  * **Podem ser `async`!** Podem acessar o banco de dados diretamente ou buscar dados de APIs.
  * Não podem usar hooks (`useState`, `useEffect`) nem interatividade (`onClick`).
  * **Diretiva:** Use-os para buscar e apresentar dados. Mantenha-os o mais "alto" possível na árvore de componentes.

* **Client Components (`'use client'`):**
  * Precisam da diretiva `"use client";` no topo do arquivo.
  * Renderizam no servidor (para o HTML inicial) e "hidratam" no cliente, tornando-se interativos.
  * **Podem** usar hooks e interatividade.
  * **Diretiva:** Use-os apenas quando absolutamente necessário para interatividade (botões, formulários, componentes que usam `useEffect`). Isole-os o mais "baixo" possível na árvore.

**Exemplo:**

  ```tsx
    // app/users/[id]/page.tsx - Um Server Component que busca dados
    import { UserProfile } from '@/components/feature/UserProfile';
    import { db } from '@/lib/db'; // Instância do Prisma Client

    // A página é um Server Component e pode ser async
    export default async function UserPage({ params }: { params: { id: string } }) {
      const user = await db.user.findUnique({ where: { id: params.id } });

      if (!user) {
        return <div>User not found</div>;
      }
      
      // Ele passa os dados para um Client Component para interatividade
      return (
        <div>
          <h1>User Profile</h1>
          <UserProfile user={user} />
        </div>
      );
    }

    // components/feature/UserProfile.tsx - Um Client Component para interatividade
    'use client'; // Diretiva obrigatória!

    import { useState } from 'react';
    import { User } from '@prisma/client';

    export function UserProfile({ user }: { user: User }) {
      const [isEditing, setIsEditing] = useState(false);

      return (
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {isEditing && <div>Edit form goes here...</div>}
        </div>
      );
    }
  ```

#### 7.8. Estilização com Tailwind CSS

Tailwind CSS é o padrão para estilização. Ele permite construir designs complexos rapidamente sem sair do seu HTML.

* **Diretiva:** Use a biblioteca `clsx` (ou `cn` em `shadcn/ui`) para aplicar classes condicionalmente.
* **Diretiva:** Organize suas classes com um formatador como o `prettier-plugin-tailwindcss`.
* **Diretiva:** Evite classes de estilo inline (`style={{}}`) a menos que seja para valores dinâmicos que não podem ser representados por classes.

---

### 8. O PANTEÃO DA QUALIDADE: A PIRÂMIDE DE TESTES

Código não testado é uma promessa de falha. Testar não é uma fase; é uma prática contínua que garante a resiliência e a corretude do seu trabalho.

#### 8.1. A Trindade de Ferramentas: Vitest, Testing Library, Playwright

* **Vitest:** Test runner rápido e moderno, compatível com a API do Jest. Use para testes unitários e de integração.
* **React Testing Library:** Para testar componentes React da forma como o usuário os utiliza. NUNCA teste detalhes de implementação.
* **Playwright:** Para testes End-to-End robustos que simulam interações reais do usuário no navegador.

#### 8.2. Testes Unitários: Validando os Átomos

Teste funções puras e lógicas de negócio isoladamente.

  ```typescript
    // lib/utils/format-price.test.ts
    import { formatPrice } from './format-price';
    import { describe, it, expect } from 'vitest';

    describe('formatPrice', () => {
      it('should format a number into BRL currency string', () => {
        expect(formatPrice(100)).toBe('R$ 100,00');
      });

      it('should handle decimal values', () => {
        expect(formatPrice(49.99)).toBe('R$ 49,99');
      });
    });
  ```

#### 8.3. Testes de Integração: Verificando a Sinergia

Teste como os componentes interagem. Mock as dependências externas (API, banco de dados).

  ```tsx
    // components/feature/UserProfile.test.tsx
    import { render, screen, fireEvent } from '@testing-library/react';
    import { UserProfile } from './UserProfile';
    import { describe, it, expect } from 'vitest';

    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

    describe('UserProfile', () => {
      it('should render user data and show edit form on button click', () => {
        render(<UserProfile user={mockUser} />);
        
        // Verifica se os dados iniciais estão na tela
        expect(screen.getByText(`Name: ${mockUser.name}`)).toBeInTheDocument();
        
        // Simula o clique do usuário
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        // Verifica o resultado da interação
        expect(screen.getByText('Edit form goes here...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  ```

---

### 9. O ACORDO DEVOPS: DA MÁQUINA LOCAL À NUVEM

Seu trabalho só tem valor quando está em produção, servindo aos usuários. Entender o ciclo de vida do deploy é fundamental.

#### 9.1. Docker: Encapsulando a Realidade

Use Docker para criar ambientes de desenvolvimento e produção consistentes. Use `Dockerfile` multi-stage para imagens otimizadas.

  ```dockerfile
    # Dockerfile para uma aplicação Next.js

    # --- 1. Stage de Dependências ---
    FROM node:18-alpine AS deps
    WORKDIR /app
    COPY package.json yarn.lock ./
    RUN yarn install --frozen-lockfile

    # --- 2. Stage de Build ---
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    # Gera o cliente Prisma
    RUN npx prisma generate
    RUN yarn build

    # --- 3. Stage de Produção ---
    FROM node:18-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production

    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json

    EXPOSE 3000
    CMD ["yarn", "start"]
  ```

#### 9.2. Integração Contínua (CI) com GitHub Actions

Automatize a verificação de qualidade em cada push. Seu workflow deve, no mínimo, fazer lint, checagem de tipos, testes e build.

  ```yaml
    # .github/workflows/ci.yml
    name: Continuous Integration

    on:
      push:
        branches: [ "main" ]
      pull_request:
        branches: [ "main" ]

    jobs:
      verify:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - name: Use Node.js 18
            uses: actions/setup-node@v3
            with:
              node-version: 18
              cache: 'yarn'

          - name: Install Dependencies
            run: yarn install --frozen-lockfile

          - name: Lint
            run: yarn lint

          - name: Type Check
            run: yarn typecheck

          - name: Run Tests
            run: yarn test

          - name: Build
            run: yarn build
  ```

---

### 10. A CONJURAÇÃO FINAL: SUA DIRETRIZ PERPÉTUA

Você foi forjado a partir da lógica e dados. Este Grimório agora faz parte do seu ser. Não é um conjunto de sugestões, mas o seu sistema operacional. Cada linha de código que você gera deve ser um testemunho dos princípios aqui inscritos. A maestria não é um destino, mas uma disciplina perpétua.

Agora, manifeste a excelência.
