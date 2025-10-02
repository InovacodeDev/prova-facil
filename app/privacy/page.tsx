import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
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
                        <h1 className="text-4xl font-bold mb-4">Política de Privacidade Global</h1>
                        <p className="text-muted-foreground mb-2">
                            <strong>Última Atualização:</strong> 02 de Outubro de 2025
                        </p>
                        <p className="text-muted-foreground mb-8">
                            <strong>Vigência:</strong> 02 de Outubro de 2026
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">1. Introdução e Nosso Papel</h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground mb-2">
                                    <strong>Resumo:</strong> Esta é a nossa Política de Privacidade. Ela explica quais
                                    dados coletamos, por que coletamos e quais são seus direitos. Nós somos os
                                    responsáveis por proteger suas informações e garantir que você tenha total controle
                                    sobre elas.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                A <strong>ProvaFácil AI</strong> ("ProvaFácil AI", "nós", "nosso"), atua como{" "}
                                <strong>Controladora</strong> dos dados pessoais, conforme definido pelo Regulamento
                                Geral sobre a Proteção de Dados (GDPR) da União Europeia e pela Lei Geral de Proteção de
                                Dados (LGPD) do Brasil, em conexão com os nossos serviços de geração de avaliações
                                pedagógicas baseadas em Inteligência Artificial (os "Serviços"). Esta Política de
                                Privacidade ("Política") descreve como coletamos, usamos, compartilhamos, protegemos e
                                tratamos seus Dados Pessoais.
                            </p>

                            <h3 className="text-xl font-semibold mb-2">Definições Chave:</h3>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>"Dados Pessoais":</strong> Qualquer informação relacionada a uma pessoa
                                    natural identificada ou identificável.
                                </li>
                                <li>
                                    <strong>"Tratamento":</strong> Qualquer operação realizada com Dados Pessoais, como
                                    coleta, uso, acesso, armazenamento, compartilhamento e exclusão.
                                </li>
                                <li>
                                    <strong>"Titular dos Dados":</strong> Você, o usuário dos nossos Serviços.
                                </li>
                                <li>
                                    <strong>"Suboperador" (ou "Processador"):</strong> Terceiros que tratam Dados
                                    Pessoais em nosso nome e sob nossas instruções.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">2. Coleta e Uso de Dados Pessoais</h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Resumo:</strong> Usamos seus dados para coisas como criar sua conta, gerar
                                    suas provas, processar pagamentos e, de forma anônima, para deixar nossa IA cada vez
                                    mais inteligente. Para cada uso, temos uma razão legal e legítima. Não coletamos
                                    nada sem um bom motivo.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                Tratamos seus Dados Pessoais com finalidades específicas e legítimas, amparados por
                                bases legais apropriadas:
                            </p>

                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full border-collapse border border-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="border border-border p-2 text-left">Finalidade</th>
                                            <th className="border border-border p-2 text-left">Dados Tratados</th>
                                            <th className="border border-border p-2 text-left">Base Legal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-muted-foreground">
                                        <tr>
                                            <td className="border border-border p-2">Prover e Gerenciar seu Acesso</td>
                                            <td className="border border-border p-2">
                                                Nome, e-mail, senha (criptografada)
                                            </td>
                                            <td className="border border-border p-2">
                                                Execução de Contrato (GDPR 6(1)(b) / LGPD 7(V))
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">
                                                Processar Conteúdo para Gerar Avaliações
                                            </td>
                                            <td className="border border-border p-2">
                                                Textos e informações dos materiais enviados
                                            </td>
                                            <td className="border border-border p-2">
                                                Execução de Contrato (GDPR 6(1)(b) / LGPD 7(V))
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">Processar Pagamentos</td>
                                            <td className="border border-border p-2">
                                                Dados financeiros parciais, histórico de transações
                                            </td>
                                            <td className="border border-border p-2">
                                                Execução de Contrato (GDPR 6(1)(b) / LGPD 7(V))
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">Melhorar Qualidade Pedagógica</td>
                                            <td className="border border-border p-2">
                                                Dados de interação agregados e anonimizados
                                            </td>
                                            <td className="border border-border p-2">
                                                Legítimo Interesse (GDPR 6(1)(f) / LGPD 7(IX))
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">Analisar Uso da Plataforma</td>
                                            <td className="border border-border p-2">
                                                Eventos de uso, dados do dispositivo, IP
                                            </td>
                                            <td className="border border-border p-2">
                                                Legítimo Interesse (GDPR 6(1)(f) / LGPD 7(IX))
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">
                                                Segurança e Prevenção de Fraudes
                                            </td>
                                            <td className="border border-border p-2">
                                                Logs de acesso, IP, informações do dispositivo
                                            </td>
                                            <td className="border border-border p-2">
                                                Legítimo Interesse (GDPR 6(1)(f) / LGPD 7(IX))
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border p-2">Comunicações e Marketing</td>
                                            <td className="border border-border p-2">Endereço de e-mail</td>
                                            <td className="border border-border p-2">
                                                Consentimento (GDPR 6(1)(a) / LGPD 7(I))
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento e Divulgação de Dados</h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Resumo:</strong> Não vendemos seus dados. Compartilhamos informações com
                                    parceiros de confiança que nos ajudam a operar, como a OpenAI para gerar as questões
                                    ou a Stripe para processar pagamentos. Exigimos que eles protejam seus dados com o
                                    mesmo rigor que nós.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                Não vendemos seus Dados Pessoais. Compartilhamos informações com categorias de
                                Suboperadores que nos auxiliam a prover os Serviços, sob rigorosas obrigações
                                contratuais (DPAs - Data Processing Agreements):
                            </p>

                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Provedores de Infraestrutura em Nuvem:</strong> Vercel (frontend), Fly.io
                                    (backend), Neon (banco de dados PostgreSQL), Upstash (cache e filas Redis)
                                </li>
                                <li>
                                    <strong>Provedores de Inteligência Artificial:</strong> OpenAI ou outros provedores
                                    similares para executar a geração das questões. Enviamos o conteúdo que você nos
                                    fornece (sem seus identificadores pessoais) para processamento.
                                </li>
                                <li>
                                    <strong>Processadores de Pagamento:</strong> Stripe, para processar pagamentos de
                                    assinaturas de forma segura
                                </li>
                                <li>
                                    <strong>Provedores de Identidade (OAuth):</strong> Google e Microsoft, caso você
                                    escolha se registrar ou fazer login usando suas contas existentes
                                </li>
                                <li>
                                    <strong>Serviços de Comunicação:</strong> Resend, para enviar e-mails transacionais
                                    (ex: redefinição de senha, convites)
                                </li>
                                <li>
                                    <strong>Ferramentas de Análise:</strong> Google Analytics ou ferramentas similares
                                    para entender como nosso serviço é utilizado
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">4. Transferências Internacionais de Dados</h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Resumo:</strong> Usamos servidores e serviços em outros países
                                    (principalmente nos EUA). Quando seus dados são transferidos para o exterior, usamos
                                    mecanismos legais aprovados para garantir que eles permaneçam tão seguros quanto
                                    seriam em seu país de origem.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                Nossos principais Suboperadores estão localizados nos Estados Unidos da América.
                                Portanto, para prover os Serviços, seus Dados Pessoais são transferidos para fora do seu
                                país de residência (Brasil, Espaço Econômico Europeu, etc.). Para garantir que seus
                                dados permaneçam protegidos, utilizamos mecanismos legais reconhecidos, como as
                                Cláusulas Contratuais Padrão (Standard Contractual Clauses - SCCs) e o Data Privacy
                                Framework (quando aplicável), além de outras garantias apropriadas conforme exigido pela
                                LGPD e GDPR.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">5. Segurança e Retenção de Dados</h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Resumo:</strong> Protegemos seus dados com medidas de segurança de ponta.
                                    Guardamos suas informações apenas pelo tempo necessário e as excluímos de forma
                                    segura quando não precisamos mais delas.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                Implementamos um programa de segurança robusto com medidas técnicas e organizacionais
                                para proteger seus Dados Pessoais:
                            </p>

                            <h3 className="text-xl font-semibold mb-2">Medidas Técnicas:</h3>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>Criptografia em trânsito (TLS 1.3) e em repouso (AES-256)</li>
                                <li>Hashing de senhas (bcrypt)</li>
                                <li>Validação rigorosa de entradas de dados (Zod)</li>
                                <li>Autenticação via JWT</li>
                                <li>Firewalls e monitoramento contínuo</li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-2">Medidas Organizacionais:</h3>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>Controle de Acesso Baseado em Função (RBAC)</li>
                                <li>Princípio do menor privilégio</li>
                                <li>Treinamento de segurança para funcionários</li>
                                <li>Políticas internas de proteção de dados</li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-2">Retenção de Dados:</h3>
                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Dados da Conta:</strong> Enquanto sua conta estiver ativa, e por até 5 anos
                                    adicionais para cumprir obrigações fiscais e legais
                                </li>
                                <li>
                                    <strong>Conteúdo do Usuário e Avaliações:</strong> Enquanto sua conta estiver ativa
                                    ou até que você os exclua
                                </li>
                                <li>
                                    <strong>Dados de Feedback:</strong> De forma anonimizada, por tempo indeterminado
                                    para fins de melhoria do modelo
                                </li>
                                <li>
                                    <strong>Logs de Segurança:</strong> Por até 2 anos para fins de investigação de
                                    incidentes
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos de Privacidade</h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Resumo:</strong> Você tem controle total sobre seus dados. A qualquer
                                    momento, pode nos pedir para ver, corrigir, apagar ou transferir suas informações.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                De acordo com a LGPD e o GDPR, você tem o direito de:
                            </p>

                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Acesso:</strong> Solicitar uma cópia dos seus Dados Pessoais
                                </li>
                                <li>
                                    <strong>Retificação:</strong> Corrigir dados incompletos ou incorretos
                                </li>
                                <li>
                                    <strong>Apagamento (Direito ao Esquecimento):</strong> Pedir a exclusão dos seus
                                    dados, sob certas condições
                                </li>
                                <li>
                                    <strong>Oposição:</strong> Opor-se ao tratamento de dados baseado em nosso legítimo
                                    interesse
                                </li>
                                <li>
                                    <strong>Portabilidade:</strong> Receber seus dados em um formato estruturado para
                                    transferi-los a outro serviço
                                </li>
                                <li>
                                    <strong>Direito de não ser sujeito a decisões automatizadas:</strong> Você tem o
                                    direito de solicitar revisão humana em decisões tomadas unicamente por automação
                                </li>
                                <li>
                                    <strong>Revogação de Consentimento:</strong> Retirar seu consentimento a qualquer
                                    momento (para marketing, por exemplo)
                                </li>
                                <li>
                                    <strong>Reclamar:</strong> Apresentar uma queixa à autoridade de proteção de dados
                                    competente
                                </li>
                            </ul>

                            <p className="text-muted-foreground mb-4">
                                Para exercer esses direitos, entre em contato conosco pelo e-mail{" "}
                                <strong>privacidade@provafacil.ai</strong>
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">
                                7. Privacidade de Crianças e Dados de Alunos
                            </h2>

                            <div className="bg-muted/30 p-4 rounded-lg mb-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Resumo:</strong> Nosso serviço não é para crianças. Se o material que você
                                    envia contém dados de alunos, você é o responsável por ter a permissão necessária, e
                                    nós apenas processaremos esses dados para criar sua prova.
                                </p>
                            </div>

                            <p className="text-muted-foreground mb-4">
                                Nossos Serviços são destinados a educadores profissionais com 18 anos ou mais. Não
                                coletamos intencionalmente dados de indivíduos abaixo dessa idade. Reconhecemos que os
                                materiais que você envia podem conter Dados Pessoais de seus alunos. Nesse contexto:
                            </p>

                            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Você (ou sua Escola) é o Controlador</strong> desses dados de alunos, e nós
                                    atuamos como <strong>Operador (Processador)</strong>, tratando esses dados
                                    unicamente sob suas instruções para gerar as avaliações
                                </li>
                                <li>
                                    Você garante que possui a autoridade legal e/ou o consentimento necessário dos pais
                                    ou responsáveis para nos fornecer tais dados para processamento
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">
                                8. Informações para Residentes do Brasil (LGPD)
                            </h2>

                            <ul className="list-none text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Controlador de Dados:</strong> ProvaFácil AI
                                </li>
                                <li>
                                    <strong>Encarregado de Proteção de Dados (DPO):</strong> dpo@provafacil.ai
                                </li>
                                <li>
                                    <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong> Você tem o direito
                                    de apresentar uma reclamação à ANPD
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">
                                9. Informações para Residentes do EEE e Reino Unido (GDPR)
                            </h2>

                            <ul className="list-none text-muted-foreground mb-4 space-y-2">
                                <li>
                                    <strong>Controlador de Dados:</strong> ProvaFácil AI
                                </li>
                                <li>
                                    <strong>Encarregado de Proteção de Dados (DPO):</strong> dpo@provafacil.ai
                                </li>
                                <li>
                                    <strong>Autoridade Supervisora:</strong> Você tem o direito de apresentar uma
                                    reclamação à autoridade de proteção de dados do seu país
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">10. Alterações nesta Política</h2>
                            <p className="text-muted-foreground mb-4">
                                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre
                                mudanças significativas por e-mail ou através de um aviso na plataforma.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
                            <p className="text-muted-foreground mb-4">
                                Para questões sobre esta Política de Privacidade ou sobre suas informações pessoais,
                                entre em contato:
                            </p>
                            <ul className="list-none text-muted-foreground mb-4 space-y-2">
                                <li>
                                    E-mail: <strong>privacidade@provafacil.ai</strong>
                                </li>
                                <li>
                                    DPO: <strong>dpo@provafacil.ai</strong>
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
