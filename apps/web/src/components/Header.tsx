import { Button } from "@/components/ui/button";
import { BookOpen, User, Menu } from "lucide-react";
import { useState } from "react";
import { authRoute } from "@/router";

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = authRoute.useNavigate();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold text-foreground">ProvaFácil AI</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a
                            href="#features"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Recursos
                        </a>
                        <a
                            href="#pricing"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Preços
                        </a>
                        <a
                            href="#about"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sobre
                        </a>
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate({ to: "/auth" })}>
                            <User className="w-4 h-4 mr-2" />
                            Entrar
                        </Button>
                        <Button variant="hero" onClick={() => navigate({ to: "/auth" })}>
                            Começar Grátis
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border">
                        <nav className="flex flex-col gap-4">
                            <a
                                href="#features"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Recursos
                            </a>
                            <a
                                href="#pricing"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Preços
                            </a>
                            <a
                                href="#about"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Sobre
                            </a>
                            <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                <Button variant="ghost" onClick={() => navigate({ to: "/auth" })}>
                                    <User className="w-4 h-4 mr-2" />
                                    Entrar
                                </Button>
                                <Button variant="hero" onClick={() => navigate({ to: "/auth" })}>
                                    Começar Grátis
                                </Button>
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};
