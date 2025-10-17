import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground mb-8">
              <strong>Última Atualização:</strong> 02 de Outubro de 2025
            </p>

            <p className="text-muted-foreground mb-8">
              Bem-vindo à ProvaFácil AI! Estes Termos de Uso ("Termos") governam seu acesso e uso de nossa plataforma.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação e Modificação dos Termos</h2>
              <p className="text-muted-foreground mb-4">
                Ao criar uma conta ou usar os Serviços da ProvaFácil AI, você concorda com estes Termos. Se você
                representa uma instituição de ensino ("Escola"), você garante que tem autoridade para vincular a Escola
                a estes Termos. Reservamo-nos o direito de modificar estes Termos a qualquer momento, com notificação
                prévia de 30 dias para alterações materiais. O uso continuado dos Serviços após as alterações constitui
                sua aceitação.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground mb-4">
                A ProvaFácil AI é uma plataforma de software como serviço (SaaS) que utiliza Inteligência Artificial
                para gerar avaliações pedagógicas a partir de materiais de estudo fornecidos pelo usuário. Oferecemos
                diferentes níveis de serviço ("Planos"):
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                <li>
                  <strong>Starter:</strong> Plano gratuito que permite a geração de um número limitado de avaliações por
                  mês
                </li>
                <li>
                  <strong>Basic:</strong> Oferece mais recursos e questões para professores iniciantes
                </li>
                <li>
                  <strong>Essentials:</strong> Plano intermediário com recursos avançados para professores ativos
                </li>
                <li>
                  <strong>Plus:</strong> Oferece geração ampliada e recursos profissionais para usuários individuais
                </li>
                <li>
                  <strong>Advanced:</strong> Plano mais completo com recursos específicos para professores
                  universitários
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Contas, Senhas e Segurança</h2>
              <p className="text-muted-foreground mb-4">
                Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em
                sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado. Você deve
                fornecer informações precisas e completas ao se registrar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Direitos de Propriedade Intelectual</h2>

              <h3 className="text-xl font-semibold mb-2">4.1 Nosso Conteúdo</h3>
              <p className="text-muted-foreground mb-4">
                A plataforma, o software, o design, os algoritmos e nossos modelos de IA são de propriedade exclusiva da
                ProvaFácil AI. Concedemos a você uma licença limitada, não exclusiva e revogável para usar os Serviços
                conforme o Plano que você assinou.
              </p>

              <h3 className="text-xl font-semibold mb-2">4.2 Seu Conteúdo</h3>
              <p className="text-muted-foreground mb-4">
                Você retém todos os direitos de propriedade intelectual sobre os materiais de estudo que você envia para
                a plataforma ("Seu Conteúdo").
              </p>

              <h3 className="text-xl font-semibold mb-2">4.3 Conteúdo Gerado</h3>
              <p className="text-muted-foreground mb-4">
                Você detém os direitos para usar, reproduzir, modificar e distribuir as avaliações específicas geradas a
                partir do Seu Conteúdo para suas finalidades educacionais.
              </p>

              <h3 className="text-xl font-semibold mb-2">4.4 Licença Essencial para Nós</h3>
              <p className="text-muted-foreground mb-4">
                Ao enviar Seu Conteúdo, você nos concede uma licença mundial, não exclusiva e isenta de royalties para
                usar, processar e criar trabalhos derivados (as avaliações) com o propósito de operar e melhorar os
                Serviços. Esta licença é fundamental para o funcionamento da plataforma e inclui o direito de usar Seu
                Conteúdo (sempre de forma agregada e anonimizada) para treinar e aprimorar nossos modelos de IA, o que
                constitui nossa "Vantagem de Dados sobre Pedagogia".
              </p>

              <h3 className="text-xl font-semibold mb-2">4.5 Feedback</h3>
              <p className="text-muted-foreground mb-4">
                Qualquer feedback que você fornecer sobre as questões geradas ou sobre a plataforma se torna nossa
                propriedade, e podemos usá-lo sem qualquer obrigação para com você.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Política de Uso Aceitável (AUP)</h2>

              <div className="bg-muted/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Resumo:</strong> Use nosso serviço de forma legal, ética e profissional. Não faça nada que
                  possa nos prejudicar ou prejudicar outros usuários.
                </p>
              </div>

              <p className="text-muted-foreground mb-4">Você concorda em não usar os Serviços para:</p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                <li>Qualquer finalidade ilegal ou para facilitar a desonestidade acadêmica</li>
                <li>Enviar conteúdo que infrinja os direitos de propriedade intelectual de terceiros</li>
                <li>Enviar conteúdo difamatório, odioso ou discriminatório</li>
                <li>
                  Enviar Dados Pessoais de alunos sem ter a devida autorização legal ou consentimento dos responsáveis
                </li>
                <li>Tentar descompilar, fazer engenharia reversa ou obter acesso não autorizado aos nossos sistemas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Termos de Pagamento (Planos Pagos)</h2>

              <h3 className="text-xl font-semibold mb-2">6.1 Faturamento</h3>
              <p className="text-muted-foreground mb-4">
                As taxas de assinatura são faturadas antecipadamente, de forma recorrente (mensal ou anual). Usamos um
                processador de pagamentos terceirizado (Stripe) para todas as transações.
              </p>

              <h3 className="text-xl font-semibold mb-2">6.2 Cancelamento</h3>
              <p className="text-muted-foreground mb-4">
                Você pode cancelar sua assinatura a qualquer momento nas configurações da sua conta. O cancelamento
                entrará em vigor ao final do ciclo de faturamento atual. Não oferecemos reembolsos, exceto quando
                exigido por lei.
              </p>

              <h3 className="text-xl font-semibold mb-2">6.3 Falha no Pagamento</h3>
              <p className="text-muted-foreground mb-4">
                Em caso de falha no pagamento, nos reservamos o direito de suspender ou encerrar seu acesso aos recursos
                pagos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Rescisão</h2>
              <p className="text-muted-foreground mb-4">
                Você pode encerrar sua conta a qualquer momento. Nós podemos suspender ou rescindir sua conta com ou sem
                aviso prévio se você violar materialmente estes Termos. Cláusulas de Propriedade Intelectual, Limitação
                de Responsabilidade, Indenização e Resolução de Disputas sobreviverão à rescisão.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Isenção de Garantias e Limitação de Responsabilidade</h2>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-4">
                <p className="text-sm font-semibold mb-2">⚠️ AVISO IMPORTANTE</p>
                <p className="text-sm text-muted-foreground">
                  <strong>
                    A IA NÃO É PERFEITA. OS SERVIÇOS E O CONTEÚDO GERADO PELA IA SÃO FORNECIDOS "COMO ESTÃO".
                  </strong>{' '}
                  A IA pode gerar informações imprecisas, incorretas ou enviesadas.{' '}
                  <strong>
                    NÃO OFERECEMOS GARANTIAS DE QUE O CONTEÚDO GERADO SERÁ PRECISO, COMPLETO OU ADEQUADO PARA QUALQUER
                    FINALIDADE PEDAGÓGICA.
                  </strong>
                </p>
              </div>

              <p className="text-muted-foreground mb-4">
                <strong>
                  Você, como educador profissional, é o único e final responsável por revisar, validar, editar e aprovar
                  qualquer avaliação antes de aplicá-la a seus alunos.
                </strong>{' '}
                O uso do conteúdo gerado é por sua conta e risco.
              </p>

              <p className="text-muted-foreground mb-4">
                Nossa responsabilidade total por quaisquer danos decorrentes destes Termos será limitada ao maior valor
                entre (a) R$ 100,00 ou (b) o valor que você nos pagou nos doze (12) meses anteriores ao evento que deu
                origem à reclamação.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Indenização</h2>
              <p className="text-muted-foreground mb-4">
                Você concorda em nos indenizar por quaisquer reclamações decorrentes de sua violação destes Termos, do
                uso indevido dos Serviços ou da aplicação de conteúdo gerado sem a devida validação profissional.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Resolução de Disputas (Cláusula de Arbitragem)</h2>

              <div className="bg-muted/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Resumo:</strong> Se tivermos uma disputa, concordamos em tentar resolver de forma amigável
                  primeiro. Se não conseguirmos, usaremos um árbitro neutro em vez de um processo judicial caro e
                  demorado.
                </p>
              </div>

              <p className="text-muted-foreground mb-4">
                Qualquer disputa entre nós será resolvida, primeiramente, por negociação informal por 30 dias. Se isso
                falhar, a disputa será submetida a arbitragem individual vinculante administrada pela Câmara de
                Conciliação, Mediação e Arbitragem CIESP/FIESP, e não a um tribunal.{' '}
                <strong>VOCÊ ESTÁ RENUNCIANDO AO SEU DIREITO DE PARTICIPAR DE AÇÕES COLETIVAS (CLASS ACTIONS).</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Disposições Gerais e Contato</h2>
              <p className="text-muted-foreground mb-4">
                Estes Termos são regidos pelas leis do Brasil. O foro para qualquer ação judicial (se a arbitragem não
                se aplicar) será a Comarca de São Paulo, Brasil.
              </p>
              <p className="text-muted-foreground mb-4">Para qualquer dúvida, entre em contato conosco em:</p>
              <ul className="list-none text-muted-foreground mb-4 space-y-2">
                <li>
                  E-mail: <strong>legal@provafacil.ai</strong>
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
