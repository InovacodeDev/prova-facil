import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Sparkles, Target } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

export const Hero = () => {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-muted via-background to-accent-muted"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-muted text-primary font-medium text-sm">
              <Sparkles className="w-4 h-4" />
              Powered by IA Avançada
            </div>

            {/* Headlines */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Crie provas em{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  segundos
                </span>
                , não horas
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Transforme qualquer material didático em avaliações diversificadas e personalizadas. 
                Economize 90% do seu tempo de preparação com nossa IA especializada em educação.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">90% menos tempo</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" />
                <span className="text-sm font-medium text-foreground">100% personalizado</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-foreground">Qualidade garantida</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-base">
                Gerar Minha Primeira Prova
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-base">
                Ver Demonstração
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Confiado por mais de 10.000 educadores
              </p>
              <div className="flex items-center gap-6">
                <div className="text-2xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">
                  "Revolucionou minha rotina de preparação"
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Professor criando avaliações com IA"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span className="text-sm font-medium">Prova gerada em 12s</span>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="text-sm font-medium">15 questões criadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};