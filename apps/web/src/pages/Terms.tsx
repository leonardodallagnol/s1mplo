import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-dark-gray">{title}</h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-void-black text-white">
      {/* Nav */}
      <nav className="border-b border-dark-gray px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</Link>
        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Entrar</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-500">Última atualização: 30 de março de 2026</p>
        </div>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao criar uma conta e utilizar o S1mplo, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma. O S1mplo é operado pela <strong className="text-white">Brainside</strong>, empresa brasileira.
          </p>
        </Section>

        <Section title="2. Descrição do serviço">
          <p>
            O S1mplo é uma plataforma SaaS de copiloto de performance com inteligência artificial para gestores de tráfego e agências que atendem e-commerces. A plataforma conecta dados de plataformas de anúncios, analytics e e-commerce para fornecer análises cruzadas e recomendações de investimento.
          </p>
          <p>
            O S1mplo <strong className="text-white">não</strong> é uma ferramenta de gestão de anúncios — não cria, edita ou pausa campanhas. É uma ferramenta de análise e decisão.
          </p>
        </Section>

        <Section title="3. Conta e acesso">
          <p>Para usar o S1mplo você deve:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Ter pelo menos 18 anos</li>
            <li>Fornecer informações verdadeiras no cadastro</li>
            <li>Manter a segurança da sua senha</li>
            <li>Ser responsável por toda atividade realizada na sua conta</li>
          </ul>
          <p>Você é responsável por garantir que tem autorização para conectar as contas de anúncios e e-commerce dos seus clientes à plataforma.</p>
        </Section>

        <Section title="4. Trial gratuito e planos pagos">
          <p><strong className="text-white">Trial:</strong> 14 dias gratuitos com acesso completo ao plano Pro. Não é necessário cartão de crédito. Após o trial, o acesso é bloqueado até a contratação de um plano pago.</p>
          <p><strong className="text-white">Planos pagos:</strong> cobrados mensalmente ou anualmente conforme o plano escolhido. Os preços são exibidos na página de planos e podem ser alterados com aviso prévio de 30 dias.</p>
          <p><strong className="text-white">Cancelamento:</strong> pode ser feito a qualquer momento. O acesso continua até o fim do período já pago. Não há reembolso proporcional de períodos em curso.</p>
          <p><strong className="text-white">Inadimplência:</strong> em caso de falha no pagamento, o acesso pode ser suspenso após período de carência conforme descrito na Política de Privacidade.</p>
        </Section>

        <Section title="5. Uso aceitável">
          <p>É vedado:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Compartilhar acesso da conta com terceiros não autorizados</li>
            <li>Usar a plataforma para fins ilegais ou que violem direitos de terceiros</li>
            <li>Tentar acessar dados de outros usuários ou workspaces</li>
            <li>Realizar engenharia reversa, descompilar ou copiar o software</li>
            <li>Usar scripts automáticos para uso abusivo da API de IA</li>
            <li>Revender ou sublicenciar o acesso à plataforma</li>
          </ul>
        </Section>

        <Section title="6. Dados e integrações">
          <p>Ao conectar plataformas externas (Meta Ads, Google Ads, TikTok Ads, Google Analytics, Nuvemshop, Mercado Livre), você:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Declara ter autorização para compartilhar esses dados com o S1mplo</li>
            <li>Autoriza o S1mplo a acessar, processar e armazenar os dados dessas plataformas exclusivamente para exibição no seu painel</li>
            <li>Compreende que o S1mplo não realiza nenhuma ação nas plataformas — apenas leitura de dados</li>
          </ul>
          <p>Os dados das plataformas são de propriedade do respectivo titular e não serão compartilhados com terceiros, exceto conforme descrito na Política de Privacidade.</p>
        </Section>

        <Section title="7. Inteligência artificial">
          <p>
            As análises e recomendações geradas pela IA do S1mplo são baseadas nos dados fornecidos e têm caráter informativo. Não constituem consultoria financeira, de investimentos ou de marketing.
          </p>
          <p>
            O S1mplo não garante a exatidão, completude ou adequação das análises geradas pela IA para decisões específicas de negócio. O usuário é responsável pelas decisões tomadas com base nas informações fornecidas pela plataforma.
          </p>
        </Section>

        <Section title="8. Disponibilidade e SLA">
          <p>
            O S1mplo busca manter disponibilidade de 99,5% ao mês, exceto por manutenções programadas (comunicadas com antecedência) e eventos fora do nosso controle (falhas em APIs de terceiros, força maior).
          </p>
          <p>
            Não nos responsabilizamos por indisponibilidades causadas por falhas nas plataformas integradas (Meta, Google, TikTok, Nuvemshop, Mercado Livre).
          </p>
        </Section>

        <Section title="9. Limitação de responsabilidade">
          <p>
            O S1mplo não se responsabiliza por perdas financeiras, perda de dados ou danos indiretos decorrentes do uso ou incapacidade de uso da plataforma.
          </p>
          <p>
            Nossa responsabilidade total, em qualquer circunstância, fica limitada ao valor pago pelo usuário nos últimos 3 meses de assinatura.
          </p>
        </Section>

        <Section title="10. Propriedade intelectual">
          <p>
            Todo o software, design, marca e conteúdo do S1mplo são de propriedade da Brainside. O uso da plataforma não transfere nenhum direito de propriedade intelectual ao usuário.
          </p>
          <p>
            Os dados gerados pelo usuário na plataforma (workspaces, configurações, relatórios) pertencem ao usuário.
          </p>
        </Section>

        <Section title="11. Alterações nos termos">
          <p>
            Podemos atualizar estes termos. Mudanças significativas serão comunicadas por e-mail com 15 dias de antecedência. O uso continuado após a comunicação implica aceitação dos novos termos.
          </p>
        </Section>

        <Section title="12. Lei aplicável e foro">
          <p>
            Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de domicílio da Brainside para resolução de quaisquer disputas, com renúncia a qualquer outro, por mais privilegiado que seja.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>Dúvidas sobre estes termos: <strong className="text-white">contato@s1mplo.com.br</strong></p>
        </Section>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-gray px-6 py-8 text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} S1mplo — Brainside. Todos os direitos reservados.
          {' · '}
          <Link to="/privacidade" className="hover:text-acid-green transition-colors">Política de Privacidade</Link>
        </p>
      </footer>
    </div>
  );
}
