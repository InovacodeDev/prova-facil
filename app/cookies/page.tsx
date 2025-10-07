import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CookiesPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow bg-background">
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="mb-8">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>
                        </Link>
                    </div>

                    <article className="prose prose-lg max-w-none dark:prose-invert">
                        <h1 className="text-4xl font-bold mb-4">Política de Cookies</h1>
                        <p className="text-muted-foreground mb-8">
                            <strong>Última Atualização:</strong> 02 de Outubro de 2025
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">1. O que são Cookies?</h2>
                            <p className="text-muted-foreground mb-4">
                                Cookies são pequenos arquivos de texto que os sites que você visita colocam em seu
                                dispositivo para permitir que o site se lembre de suas preferências, o mantenha
                                conectado ou colete dados estatísticos. Usamos cookies e tecnologias similares, como o
                                Local Storage do navegador.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">2. Como e Por Que Usamos Cookies</h2>
                            <p className="text-muted-foreground mb-4">
                                Usamos cookies para operar nossos Serviços de forma eficiente e segura, entender como os
                                usuários interagem com nossa plataforma e, com seu consentimento, para fins de
                                marketing.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">3. Tipos de Cookies que Usamos</h2>

                            <div className="overflow-x-auto mb-6">
                                <table className="min-w-full border-collapse border border-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="border border-border p-2 text-left">Categoria</th>
                                            <th className="border border-border p-2 text-left">Finalidade</th>
                                            <th className="border border-border p-2 text-left">Exemplos</th>
                                            <th className="border border-border p-2 text-left">Duração</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-muted-foreground">
                                        <tr>
                                            <td className="border border-border p-2">
                                                <strong>Estritamente Necessários</strong>
                                            </td>
                                            <td className="border border-border p-2">
                                                Essenciais para o funcionamento da plataforma. Permitem a autenticação
                                                (login), protegem contra ataques (CSRF) e gerenciam o faturamento. Não
                                                podem ser desativados.
                                            </td>
                                            <td className="border border-border p-2">
                                                <code>auth_token</code>, <code>__stripe_mid</code> (Stripe)
                                            </td>
                                            <td className="border border-border p-2">Sessão ou persistente</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">
                                                <strong>De Desempenho e Análise</strong>
                                            </td>
                                            <td className="border border-border p-2">
                                                Coletam informações anônimas sobre como você usa nosso site para que
                                                possamos medir e melhorar a performance.
                                            </td>
                                            <td className="border border-border p-2">
                                                <code>_ga</code>, <code>_gid</code> (Google Analytics)
                                            </td>
                                            <td className="border border-border p-2">Persistente (até 2 anos)</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">
                                                <strong>De Funcionalidade</strong>
                                            </td>
                                            <td className="border border-border p-2">
                                                Lembram de escolhas que você fez (como preferência de idioma ou outras
                                                configurações) para fornecer uma experiência mais pessoal.
                                            </td>
                                            <td className="border border-border p-2">
                                                <code>user_preferences</code>
                                            </td>
                                            <td className="border border-border p-2">Persistente (até 1 ano)</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">
                                                <strong>De Publicidade/Marketing</strong>
                                            </td>
                                            <td className="border border-border p-2">
                                                Usados para direcionar publicidade relevante para você em outros sites
                                                (remarketing), ajudando-nos a alcançar novos educadores interessados em
                                                nossa plataforma.
                                            </td>
                                            <td className="border border-border p-2">
                                                <code>_fbp</code> (Facebook Pixel), <code>IDE</code> (Google Ads)
                                            </td>
                                            <td className="border border-border p-2">Persistente (até 1 ano)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">4. Cookies de Terceiros</h2>
                            <p className="text-muted-foreground mb-4">
                                Alguns cookies são definidos por serviços de terceiros que usamos:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Stripe:</strong> Nosso processador de pagamentos usa cookies estritamente
                                    necessários para segurança e prevenção de fraudes.
                                </li>
                                <li>
                                    <strong>Google (Analytics e Ads):</strong> Usamos para analisar o tráfego e para
                                    marketing.
                                </li>
                                <li>
                                    <strong>Meta (Facebook/Instagram):</strong> Usamos o Pixel para medir a eficácia de
                                    nossas campanhas de marketing.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">5. Como Gerenciar Suas Preferências</h2>

                            <h3 className="text-xl font-semibold mb-2">5.1 Banner de Consentimento</h3>
                            <p className="text-muted-foreground mb-4">
                                Você tem total controle sobre os cookies não essenciais. Ao visitar nosso site pela
                                primeira vez, você será apresentado a um banner de consentimento onde poderá aceitar
                                todos os cookies ou personalizar suas preferências. Você pode alterar suas escolhas a
                                qualquer momento clicando no link "Preferências de Cookies" no rodapé do nosso site.
                            </p>

                            <h3 className="text-xl font-semibold mb-2">5.2 Configurações do Navegador</h3>
                            <p className="text-muted-foreground mb-4">
                                Adicionalmente, você pode configurar seu navegador para recusar cookies, mas isso pode
                                afetar sua experiência na plataforma e alguns recursos podem não funcionar corretamente.
                                Para mais informações sobre como gerenciar cookies em seu navegador, consulte os guias
                                do desenvolvedor do seu navegador específico:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies
                                </li>
                                <li>
                                    <strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies
                                </li>
                                <li>
                                    <strong>Safari:</strong> Preferências → Privacidade → Cookies
                                </li>
                                <li>
                                    <strong>Edge:</strong> Configurações → Cookies e permissões de site
                                </li>
                            </ul>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-4">
                                <p className="text-sm font-semibold mb-2">⚠️ Importante</p>
                                <p className="text-sm text-muted-foreground">
                                    Bloquear ou excluir cookies pode afetar sua experiência na plataforma e alguns
                                    recursos podem não funcionar corretamente.
                                </p>
                            </div>

                            <h3 className="text-xl font-semibold mb-2">
                                5.3 Opt-Out de Publicidade Baseada em Interesses
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Para optar por não ser rastreado por publicidade baseada em interesses, você pode
                                visitar:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Digital Advertising Alliance (DAA):</strong>{" "}
                                    <a
                                        href="http://optout.aboutads.info/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        optout.aboutads.info
                                    </a>
                                </li>
                                <li>
                                    <strong>Your Online Choices (Europa):</strong>{" "}
                                    <a
                                        href="https://www.youronlinechoices.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        youronlinechoices.com
                                    </a>
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">6. Armazenamento Local e Sessão</h2>
                            <p className="text-muted-foreground mb-4">
                                Além dos cookies, também utilizamos tecnologias de armazenamento local do navegador
                                (localStorage e sessionStorage) para:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>Salvar rascunhos de questões em andamento</li>
                                <li>Armazenar preferências de interface temporariamente</li>
                                <li>Melhorar o desempenho da aplicação</li>
                            </ul>
                            <p className="text-muted-foreground mb-4">
                                Estas tecnologias seguem as mesmas diretrizes de privacidade dos cookies.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">7. Consentimento</h2>
                            <p className="text-muted-foreground mb-4">
                                Ao usar nossa plataforma, você consente com o uso de cookies conforme descrito nesta
                                política. Você pode retirar seu consentimento a qualquer momento ajustando as
                                configurações do navegador.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">8. Atualizações desta Política</h2>
                            <p className="text-muted-foreground mb-4">
                                Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em
                                nossa plataforma ou requisitos legais. A data da última atualização será sempre indicada
                                no topo desta página.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">9. Mais Informações</h2>
                            <p className="text-muted-foreground mb-4">
                                Para mais informações sobre como usamos cookies e protegemos sua privacidade:
                            </p>
                            <ul className="list-none text-muted-foreground mb-4 space-y-2">
                                <li>
                                    Consulte nossa{" "}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Política de Privacidade
                                    </Link>
                                </li>
                                <li>
                                    Entre em contato: <strong>privacidade@provafacil.ai</strong>
                                </li>
                                <li>
                                    Contato Geral: <strong>contato@provafacil.ai</strong>
                                </li>
                            </ul>
                        </section>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    );
}
