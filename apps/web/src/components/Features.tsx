import { Card } from "@/components/ui/card";
import { 
  Zap, 
  Brain, 
  FileText, 
  Users, 
  BarChart3, 
  Shield,
  Clock,
  Sparkles,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Geração Instantânea",
    description: "Crie provas completas em segundos a partir de qualquer material didático",
    color: "text-primary",
    bgColor: "bg-primary-muted"
  },
  {
    icon: Brain,
    title: "IA Pedagógica",
    description: "Nossa IA entende conceitos educacionais e cria questões contextualmente relevantes",
    color: "text-secondary",
    bgColor: "bg-secondary-muted"
  },
  {
    icon: FileText,
    title: "Múltiplos Formatos",
    description: "Questões objetivas, dissertativas, verdadeiro/falso e muito mais",
    color: "text-accent",
    bgColor: "bg-accent-muted"
  },
  {
    icon: Users,
    title: "Colaboração Escolar",
    description: "Compartilhe e colabore com outros professores da sua instituição",
    color: "text-primary",
    bgColor: "bg-primary-muted"
  },
  {
    icon: BarChart3,
    title: "Análise de Performance",
    description: "Acompanhe o desempenho dos alunos com relatórios detalhados",
    color: "text-secondary",
    bgColor: "bg-secondary-muted"
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados estão protegidos com criptografia de ponta a ponta",
    color: "text-accent",
    bgColor: "bg-accent-muted"
  }
];

const benefits = [
  "Economize até 5 horas por semana",
  "Melhore a qualidade das avaliações",
  "Reduza o stress de preparação",
  "Foque no que realmente importa: ensinar"
];

export const Features = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-muted text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Recursos Poderosos
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Tudo que você precisa para criar{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              avaliações perfeitas
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Nossa plataforma combina inteligência artificial de última geração com 
            uma interface intuitiva para revolucionar sua experiência de criação de provas.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-smooth hover:scale-105 border-border">
              <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-card rounded-2xl p-8 lg:p-12 border border-border">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-muted text-secondary font-medium text-sm mb-6">
                <Clock className="w-4 h-4" />
                Benefícios Comprovados
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
                Transforme sua rotina pedagógica
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Professores que usam ProvaFácil AI relatam uma transformação completa 
                em sua rotina de trabalho, com mais tempo para se dedicar ao ensino.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-hero rounded-xl p-8 text-white">
                <div className="space-y-6">
                  <div className="text-4xl font-bold">90%</div>
                  <div className="text-lg opacity-90">
                    Redução no tempo de preparação de avaliações
                  </div>
                  <div className="border-t border-white/20 pt-6">
                    <div className="text-sm opacity-75 mb-2">Antes vs Depois</div>
                    <div className="flex justify-between text-sm">
                      <span>5h/semana → 30min/semana</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};