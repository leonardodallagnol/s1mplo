import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-dark-gray">{title}</h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-void-black text-white">
      {/* Nav */}
      <nav className="border-b border-dark-gray px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</Link>
        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Entrar</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
          <p className="text-sm text-gray-500">Última atualização: 30 de março de 2026</p>
        </div>

        <Section title="1. Quem somos">
          <p>
            O S1mplo é um produto da <strong className="text-white">Brainside</strong>, empresa brasileira registrada sob o CNPJ responsável pela operação desta plataforma. Podemos ser contatados pelo e-mail <strong className="text-white">contato@s1mplo.com.br</strong>.
          </p>
          <p>
            Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p><strong className="text-white">Dados de cadastro:</strong> nome, e-mail, senha (armazenada em hash bcrypt) e país.</p>
          <p><strong className="text-white">Dados de uso:</strong> informações sobre workspaces criados, conexões configuradas e interações com a plataforma.</p>
          <p><strong className="text-white">Dados de plataformas conectadas:</strong> ao conectar suas contas de anúncios (Meta Ads, Google Ads, TikTok Ads), analytics (Google Analytics 4) e e-commerce (Nuvemshop, Mercado Livre), coletamos métricas de performance, dados de campanhas e informações de pedidos exclusivamente para exibição no seu painel. Tokens de acesso OAuth são armazenados encriptados com AES-256-GCM.</p>
          <p><strong className="text-white">Dados de pagamento:</strong> não armazenamos dados de cartão. Pagamentos são processados pela Asaas (Brasil) ou Stripe (internacional), que possuem suas próprias políticas de privacidade.</p>
          <p><strong className="text-white">Dados técnicos:</strong> endereço IP, tipo de navegador e logs de acesso para fins de segurança e diagnóstico.</p>
        </Section>

        <Section title="3. Como usamos seus dados">
          <p>Utilizamos seus dados para:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Fornecer e operar os serviços do S1mplo</li>
            <li>Gerar análises e insights com IA a partir dos dados das plataformas conectadas</li>
            <li>Processar pagamentos e gerenciar sua assinatura</li>
            <li>Enviar comunicações relacionadas ao serviço (alertas, notificações de expiração de trial)</li>
            <li>Melhorar a plataforma com base em padrões de uso agregados e anonimizados</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>
        </Section>

        <Section title="4. Compartilhamento de dados">
          <p>Não vendemos seus dados. Compartilhamos dados apenas com:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-white">Anthropic:</strong> para processamento de análises via IA (dados enviados são anonimizados e não incluem informações pessoais identificáveis)</li>
            <li><strong className="text-white">Asaas / Stripe:</strong> para processamento de pagamentos</li>
            <li><strong className="text-white">Infraestrutura de hospedagem:</strong> servidores seguros para armazenamento dos dados</li>
            <li><strong className="text-white">Autoridades legais:</strong> quando exigido por lei ou ordem judicial</li>
          </ul>
        </Section>

        <Section title="5. Retenção de dados">
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Após cancelamento:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Dados de conta: excluídos em até 30 dias</li>
            <li>Dados de métricas e pedidos: excluídos em até 60 dias</li>
            <li>Dados de pagamento: mantidos pelo período exigido pela legislação fiscal brasileira (5 anos)</li>
          </ul>
        </Section>

        <Section title="6. Segurança">
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Encriptação de tokens OAuth com AES-256-GCM</li>
            <li>Senhas armazenadas com bcrypt (hash irreversível)</li>
            <li>Autenticação via JWT com tokens de curta duração</li>
            <li>Comunicação via HTTPS/TLS</li>
            <li>Rate limiting para prevenção de ataques de força bruta</li>
          </ul>
        </Section>

        <Section title="7. Seus direitos (LGPD)">
          <p>Nos termos da LGPD, você tem direito a:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Confirmar a existência de tratamento dos seus dados</li>
            <li>Acessar seus dados</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Portabilidade dos seus dados</li>
            <li>Revogar consentimento a qualquer momento</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato: <strong className="text-white">privacidade@s1mplo.com.br</strong></p>
        </Section>

        <Section title="8. Cookies">
          <p>Utilizamos apenas cookies essenciais para funcionamento da autenticação (tokens de sessão armazenados no localStorage). Não utilizamos cookies de rastreamento ou publicidade.</p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>Podemos atualizar esta política periodicamente. Notificaremos usuários por e-mail sobre mudanças significativas com pelo menos 15 dias de antecedência.</p>
        </Section>

        <Section title="10. Contato">
          <p>Dúvidas sobre esta política: <strong className="text-white">privacidade@s1mplo.com.br</strong></p>
          <p>Encarregado de Proteção de Dados (DPO): <strong className="text-white">Brainside — contato@s1mplo.com.br</strong></p>
        </Section>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-gray px-6 py-8 text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} S1mplo — Brainside. Todos os direitos reservados.
          {' · '}
          <Link to="/termos" className="hover:text-acid-green transition-colors">Termos de Uso</Link>
        </p>
      </footer>
    </div>
  );
}
