import { Mail, MapPin, Phone } from "lucide-react";
import { ProvaFacilLogo } from "@/assets/logo";

export const Footer = () => {
    return (
        <footer className="bg-card border-t border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ProvaFacilLogo className="h-8" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Revolucionando a criação de avaliações com inteligência artificial.
                        </p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>prova-facil@inovacode.dev</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>+55 (48) 9999-9999</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>Santa Catarina, Brasil</span>
                            </div>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="/#features" className="hover:text-foreground transition-colors">
                                    Recursos
                                </a>
                            </li>
                            <li>
                                <a href="/#pricing" className="hover:text-foreground transition-colors">
                                    Preços
                                </a>
                            </li>
                            <li>
                                <a href="/#about" className="hover:text-foreground transition-colors">
                                    Sobre
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Recursos</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="/support" className="hover:text-foreground transition-colors">
                                    Central de Ajuda
                                </a>
                            </li>
                            <li>
                                <a href="/support" className="hover:text-foreground transition-colors">
                                    Documentação
                                </a>
                            </li>
                            <li>
                                <a href="/support" className="hover:text-foreground transition-colors">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="/support" className="hover:text-foreground transition-colors">
                                    Status
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="/privacy" className="hover:text-foreground transition-colors">
                                    Privacidade
                                </a>
                            </li>
                            <li>
                                <a href="/terms" className="hover:text-foreground transition-colors">
                                    Termos de Uso
                                </a>
                            </li>
                            <li>
                                <a href="/cookies" className="hover:text-foreground transition-colors">
                                    Cookies
                                </a>
                            </li>
                            <li>
                                <a href="/support" className="hover:text-foreground transition-colors">
                                    Contato
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-muted-foreground">© 2025 ProvaFácil AI. Todos os direitos reservados.</p>
                    <div className="flex gap-6 text-sm text-muted-foreground mt-4 md:mt-0">
                        <a href="/privacy" className="hover:text-foreground transition-colors">
                            Privacidade
                        </a>
                        <a href="/terms" className="hover:text-foreground transition-colors">
                            Termos
                        </a>
                        <a href="/cookies" className="hover:text-foreground transition-colors">
                            Cookies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
