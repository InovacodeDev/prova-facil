// generate-word-sequence.ts

/**
 * @file Um script TypeScript que gera uma sequência de palavras aleatórias.
 * @description Evoca palavras de múltiplos léxicos arcanos, incluindo a Terra-Média e as Crônicas de Olam.
 * @version 4.0.0 - A Edição do Mago. Grimório finalizado com o conhecimento das Crônicas de Olam.
 */

// --- TOMOS DE PODER ---

// Tomo I: O Conhecimento Antigo (Alfabeto Grego)
const GREEK_RUNES: string[] = [
  "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta",
  "iota", "kappa", "lambda", "mu", "nu", "xi", "omicron", "pi",
  "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega",
];

// Tomo II: O Espectro Cromático (Cores e Metais)
const COLOR_RUNES: string[] = [
  "anil", "azul", "amarelo", "bronze", "ciano", "cinza", "cobre", "dourado",
  "escarlate", "esmeralda", "indigo", "jade", "laranja", "lilas", "magenta",
  "marfim", "marrom", "preto", "prata", "purpura", "rosa", "roxo", "rubi",
  "safira", "turquesa", "verde", "vermelho", "violeta", "branco",
];

// Tomo III: A Ordem Celestial (Cosmos)
const CELESTIAL_RUNES: string[] = [
  "sol", "lua", "estrela", "terra", "marte", "venus", "saturno", "netuno",
  "cometa", "asteroide", "galaxia", "nebulosa", "quasar", "supernova",
  "orbita", "zenite", "nadire", "eclipse", "aurora", "crepusculo", "universo",
];

// Tomo IV: O Coração Elemental (Natureza)
const ELEMENTAL_RUNES: string[] = [
  "agua", "ar", "fogo", "terra", "vento", "trovao", "raio", "tempestade",
  "nevasca", "terremoto", "vulcao", "oceano", "rio", "lago", "montanha",
  "floresta", "deserto", "caverna", "cristal", "magma", "gelo", "nevoa",
];

// Tomo V: O Néctar Arcano (Magia e Fantasia)
const ARCANE_RUNES: string[] = [
  "mago", "oraculo", "golem", "portal", "runa", "glifo", "amuleto", "talismã",
  "feitiço", "encanto", "poção", "caldeirao", "espectro", "fantasma", "sombra",
  "demonio", "anjo", "titã", "castelo", "torre", "labirinto", "santuario", "artefato", "reliquia",
];

// Tomo VI: O Fio do Destino (Conceitos Abstratos)
const ABSTRACT_RUNES: string[] = [
  "luz", "sombra", "eco", "espirito", "sonho", "realidade", "fluxo", "essencia",
  "memoria", "esquecimento", "caos", "ordem", "destino", "sorte", "azar",
  "coragem", "medo", "honra", "segredo", "silencio", "infinito", "vazio",
  "verdade", "mentira", "tempo", "espaço", "entropia", "harmonia", "simetria",
];

// Tomo VII: A Centelha da Alma (Qualidades)
const ATTRIBUTE_RUNES: string[] = [
  "sabio", "bravo", "veloz", "forte", "gentil", "puro", "oculto", "revelado",
  "agil", "astuto", "furtivo", "nobre", "leal", "sereno", "antigo", "eterno",
  "efemero", "brilhante", "sombrio", "silencioso", "ressoante", "imortal",
];

// Tomo VIII: A Forja Digital (Tecnologia)
const TECH_RUNES: string[] = [
  "algoritmo", "protocolo", "servidor", "cliente", "compilar", "depurar",
  "framework", "biblioteca", "dominio", "firewall", "recursao", "polimorfismo",
  "abstracao", "heranca", "encapsulamento", "singleton", "fabrica", "ponteiro",
  "kernel", "shell", "terminal", "repositorio", "commit", "branch", "merge",
  "variavel", "constante", "funcao", "classe", "objeto", "metodo", "parametro",
  "argumento", "retorno", "promessa", "observavel", "componente", "modulo",
  "pacote", "dependencia", "cache", "cookie", "token", "sessao", "evento",
  "excecao", "depurador", "iterador", "gerador", "namespace", "middleware",
  "container", "imagem", "docker", "cluster", "pipeline", "webhook",
  "cripto", "pixel", "vetor", "rede", "nuvem", "bits", "bytes", "log", "hash",
  "api", "rest", "graphql", "sdk", "json", "yaml", "html", "css", "sql",
  "nosql", "query", "index", "schema", "migracao", "deploy", "build",
];

// Tomo IX: O Legado do Anel (Runas da Terra-Média)
const LORD_OF_THE_RINGS_RUNES: string[] = [
    "gandalf", "frodo", "aragorn", "legolas", "gimli", "sauron", "saruman", "gollum",
    "bilbo", "galadriel", "elrond", "boromir", "samwise", "merry", "pippin",
    "mordor", "gondor", "rohan", "shire", "rivendell", "isengard", "moria", "lothlorien",
    "erebor", "fangorn", "helmsdeep", "minas", "tirith", "baraddur",
    "hobbit", "elfo", "anao", "orc", "balrog", "ent", "nazgul", "urukhai",
    "anel", "mithril", "palantir", "sting", "anduril", "narsil", "silmaril", "valar", "maiar"
];

// Tomo X: As Crônicas de Olam (A Sabedoria do Mago)
const CRONICAS_DE_OLAM_RUNES: string[] = [
    "olam", "ayla", "kael", "malik", "kenan", "elina", "zack", "mestre", "cacador",
    "general", "reino", "norte", "sul", "alianca", "guerra", "sombra", "exilio",
    "legado", "profecia", "despertar", "fragmento", "guardiao", "cacada"
];


// --- O GRIMÓRIO COMPLETO ---
// Une todos os tomos em um único léxico de poder.
const RUNES: string[] = [
  ...GREEK_RUNES,
  ...COLOR_RUNES,
  ...CELESTIAL_RUNES,
  ...ELEMENTAL_RUNES,
  ...ARCANE_RUNES,
  ...ABSTRACT_RUNES,
  ...ATTRIBUTE_RUNES,
  ...TECH_RUNES,
  ...LORD_OF_THE_RINGS_RUNES,
  ...CRONICAS_DE_OLAM_RUNES,
];

/**
 * Gera uma sequência de palavras aleatórias.
 *
 * @param count O número de palavras na sequência (padrão: 3).
 * @param separator O separador entre as palavras (padrão: "_").
 * @returns Uma string contendo a sequência de palavras.
 * @throws {Error} Se a lista de RUNES for insuficiente para o número de palavras solicitado.
 */
function generateWordSequence(count: number = 3, separator: string = "_"): string {
  if (count <= 0) {
    throw new Error("O número de palavras deve ser maior que zero.");
  }
  
  const uniqueRunes = [...new Set(RUNES)]; // Garante que não há duplicatas
  
  if (uniqueRunes.length < count) {
    throw new Error(`A lista de RUNES é insuficiente. Necessário ${count} palavras únicas, mas possui apenas ${uniqueRunes.length}.`);
  }

  const selectedWords: string[] = [];
  const availableRunes = [...uniqueRunes];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * availableRunes.length);
    const selectedRune = availableRunes[randomIndex].trim();
    selectedWords.push(selectedRune);
    availableRunes.splice(randomIndex, 1);
  }

  return selectedWords.join(separator);
}

// Demonstração da magia final:
if (require.main === module) {
  try {
    const uniqueRuneCount = [...new Set(RUNES)].length;
    console.log(`O Grimório Completo agora contém ${uniqueRuneCount} runas de poder únicas.`);
    console.log("O Tomo das Crônicas de Olam foi aberto e suas runas foram integradas!");

    const sequence1 = generateWordSequence();
    console.log("\nSequência gerada (3 palavras):", sequence1);

    const sequence2 = generateWordSequence(5, "-");
    console.log("Sequência gerada (5 palavras, separador '-'):", sequence2);

  } catch (error: any) {
    console.error("Um erro ocorreu durante a conjuração:", error.message);
  }
}