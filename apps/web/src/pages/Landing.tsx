import { Link } from 'react-router-dom';
import {
  BarChart2, Zap, Link as LinkIcon, Brain, AlertTriangle,
  Users, ChevronRight, Check, ArrowRight, TrendingUp,
  ShoppingCart, Target, DollarSign,
} from 'lucide-react';

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-void-black/90 backdrop-blur border-b border-dark-gray">
      <span className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</span>
      <div className="flex items-center gap-4">
        <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
          Preços
        </a>
        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Entrar
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 text-sm font-semibold uppercase tracking-wider bg-acid-green text-void-black rounded hover:bg-[#b8e600] transition-colors"
        >
          Começar grátis
        </Link>
      </div>
    </nav>
  );
}

// ─── Mock Dashboard ───────────────────────────────────────────────────────────
function MockDashboard() {
  return (
    <div className="w-full bg-off-black border border-dark-gray rounded-lg overflow-hidden shadow-2xl">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-gray bg-void-black">
        <div className="w-2.5 h-2.5 rounded-full bg-danger" />
        <div className="w-2.5 h-2.5 rounded-full bg-warning" />
        <div className="w-2.5 h-2.5 rounded-full bg-success" />
        <span className="ml-3 text-xs text-gray-600">dashboard — Cliente X</span>
      </div>
      <div className="p-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Gasto Total', value: 'R$ 18.420', color: 'text-white' },
            { label: 'Receita Real', value: 'R$ 74.800', color: 'text-white' },
            { label: 'ROAS Real', value: '4.06x', color: 'text-acid-green' },
            { label: 'CPA Médio', value: 'R$ 61,40', color: 'text-white' },
          ].map(k => (
            <div key={k.label} className="bg-void-black border border-dark-gray rounded p-3">
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">{k.label}</p>
              <p className={`text-lg font-bold font-mono ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        {/* Chart placeholder */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 bg-void-black border border-dark-gray rounded p-3">
            <p className="text-xs text-gray-400 mb-3">ROAS Real vs Reportado</p>
            <div className="flex items-end gap-1 h-16">
              {[30, 45, 38, 55, 42, 60, 52, 70, 58, 75, 62, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5 items-stretch">
                  <div className="bg-acid-green/30 rounded-sm" style={{ height: `${h * 0.6}%` }} />
                  <div className="bg-gray-600/30 rounded-sm" style={{ height: `${h * 0.8}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-void-black border border-dark-gray rounded p-3">
            <p className="text-xs text-gray-400 mb-2">Canais</p>
            <div className="space-y-2">
              {[
                { name: 'Meta Ads', roas: '3.8x', color: 'bg-blue-500' },
                { name: 'Google', roas: '4.2x', color: 'bg-yellow-500' },
                { name: 'TikTok', roas: '5.1x', color: 'bg-white/20' },
                { name: 'ML', roas: '5.8x', color: 'bg-yellow-600' },
              ].map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                  <span className="text-xs text-gray-400 flex-1">{c.name}</span>
                  <span className="text-xs font-mono text-acid-green">{c.roas}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* AI insight */}
        <div className="bg-acid-green/5 border border-acid-green/30 rounded p-3 flex gap-3">
          <Brain size={16} className="text-acid-green mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-acid-green font-semibold uppercase tracking-wider mb-0.5">Copiloto S1mplo</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Seu TikTok Ads tem ROAS 5.1x com apenas 12% do budget. Realocar +20% do Meta
              pode gerar R$14k a mais em receita essa semana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-acid-green/10 border border-acid-green/30 rounded text-xs text-acid-green font-medium uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-acid-green animate-pulse" />
            Feito no Brasil para gestores sérios
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Pare de adivinhar.{' '}
            <span className="text-acid-green">Saiba onde</span>{' '}
            investir.
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
            O copiloto de performance com IA que cruza dados de ads + e-commerce e diz
            exatamente onde colocar o próximo real — antes que você perca dinheiro.
          </p>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['Meta Ads', 'Google Ads', 'TikTok Ads', 'GA4', 'Nuvemshop', 'Mercado Livre'].map(p => (
              <span key={p} className="px-2.5 py-1 bg-dark-gray border border-dark-gray/80 rounded text-xs text-gray-400">
                {p}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-acid-green text-void-black font-bold uppercase tracking-wider rounded hover:bg-[#b8e600] transition-colors text-sm"
            >
              Começar 14 dias grátis
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-dark-gray text-gray-400 hover:text-white hover:border-gray-600 font-medium text-sm rounded transition-colors"
            >
              Ver como funciona
            </a>
          </div>

          <p className="text-xs text-gray-600 mt-4">
            Sem cartão de crédito. Acesso completo por 14 dias.
          </p>
        </div>

        <div className="hidden lg:block">
          <MockDashboard />
        </div>
      </div>
    </section>
  );
}

// ─── Problem ──────────────────────────────────────────────────────────────────
function Problem() {
  const pains = [
    {
      icon: '📊',
      title: 'Você gasta horas no Excel',
      desc: 'Cruzando dados de 6 plataformas diferentes todo dia. E mesmo assim, não tem certeza se os números estão certos.',
    },
    {
      icon: '🎭',
      title: 'O ROAS que o Meta reporta é mentira',
      desc: 'Enquanto o Meta diz ROAS 6.2x, a Nuvemshop confirma só R$38k dos R$60k "vendidos". Cancelamentos e fraude inflam os números.',
    },
    {
      icon: '🎯',
      title: 'Você não sabe onde colocar mais dinheiro',
      desc: 'Meta, Google, TikTok ou Mercado Livre? Cada um reporta diferente, em janelas diferentes, com atribuição diferente.',
    },
  ];

  return (
    <section className="py-20 px-6 border-t border-dark-gray">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-xs text-gray-600 uppercase tracking-wider mb-12">
          O problema que todo gestor de tráfego enfrenta
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pains.map(p => (
            <div key={p.title} className="p-6 bg-off-black border border-dark-gray rounded-lg">
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Solution ─────────────────────────────────────────────────────────────────
function Solution() {
  const steps = [
    {
      icon: LinkIcon,
      step: '01',
      title: 'Conecte em 2 minutos',
      desc: 'OAuth com Meta, Google, TikTok, Nuvemshop e Mercado Livre. Sem planilhas, sem exportar CSV, sem configuração técnica.',
    },
    {
      icon: BarChart2,
      step: '02',
      title: 'Dados cruzados automaticamente',
      desc: 'Ads × pedidos reais × analytics — tudo cruzado. O ROAS do Meta comparado com os pedidos confirmados na Nuvemshop em tempo real.',
    },
    {
      icon: Brain,
      step: '03',
      title: 'IA diz o que fazer',
      desc: 'O Copiloto analisa tudo e responde: "Onde colocar mais dinheiro?" com base em dados reais, não achismo.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-off-black border-t border-dark-gray">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Da conexão à decisão{' '}
            <span className="text-acid-green">em minutos</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Não é mais um dashboard bonito. É um motor de decisão que cruza todos os seus dados e diz o que fazer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="relative">
                <div className="flex items-start gap-4 p-6 bg-void-black border border-dark-gray rounded-lg hover:border-acid-green/30 transition-colors">
                  <div className="shrink-0">
                    <div className="w-10 h-10 bg-acid-green/10 border border-acid-green/30 rounded flex items-center justify-center">
                      <Icon size={18} className="text-acid-green" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 font-mono">{s.step}</span>
                    <h3 className="text-base font-semibold text-white mt-0.5 mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Features Detail ──────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: TrendingUp,
      title: 'ROAS Real vs Reportado',
      desc: 'Compara o que Meta/Google dizem com os pedidos confirmados na Nuvemshop e ML. A diferença média é 18-35%.',
      badge: 'Core',
    },
    {
      icon: Target,
      title: 'Funil Cross-Platform',
      desc: 'Impressão → Clique → Sessão → Carrinho → Checkout → Pedido. O gargalo exato, com dados de todas as fontes.',
      badge: 'Core',
    },
    {
      icon: Brain,
      title: 'Copiloto com Claude IA',
      desc: 'Pergunte "Por que meu ROAS caiu?" e receba uma análise cruzada com dados reais, não suposições.',
      badge: 'IA',
    },
    {
      icon: BarChart2,
      title: 'Comparativo de Canais',
      desc: 'Meta vs Google vs TikTok vs ML — ROAS real, CPA real, pedidos reais lado a lado. Sem confundir atribuição.',
      badge: 'Dados',
    },
    {
      icon: AlertTriangle,
      title: 'Alertas Automáticos',
      desc: 'ROAS caiu 20%? CPA subiu 30%? Você é avisado antes do cliente perceber — com contexto e sugestão de ação.',
      badge: 'Alertas',
    },
    {
      icon: Users,
      title: 'Multi-cliente (Subcontas)',
      desc: 'Cada cliente é uma subconta isolada. Dados não se misturam. Escale de 3 a ilimitados clientes conforme o plano.',
      badge: 'Agências',
    },
  ];

  const BADGE_COLORS: Record<string, string> = {
    Core:    'bg-acid-green/10 text-acid-green border-acid-green/30',
    IA:      'bg-purple-500/10 text-purple-400 border-purple-500/30',
    Dados:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Alertas: 'bg-red-500/10 text-red-400 border-red-500/30',
    Agências:'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };

  return (
    <section className="py-20 px-6 border-t border-dark-gray">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Tudo que um gestor precisa,{' '}
            <span className="text-acid-green">nada que não precisa</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Sem relatório genérico. Sem dashboard decorativo. Cada feature existe para uma decisão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-5 bg-off-black border border-dark-gray rounded-lg hover:border-acid-green/20 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 bg-dark-gray rounded flex items-center justify-center group-hover:bg-acid-green/10 transition-colors">
                    <Icon size={16} className="text-gray-400 group-hover:text-acid-green transition-colors" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${BADGE_COLORS[f.badge]}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── AI Example ───────────────────────────────────────────────────────────────
function AIExample() {
  return (
    <section className="py-20 px-6 bg-off-black border-t border-dark-gray">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            O Copiloto que você precisava
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Não é um chatbot genérico. É uma IA treinada nos seus dados cruzados.
          </p>
        </div>

        <div className="bg-void-black border border-dark-gray rounded-lg overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-dark-gray bg-off-black">
            <Brain size={14} className="text-acid-green" />
            <span className="text-sm font-semibold text-acid-green">S1mplo Copilot</span>
            <span className="ml-auto text-xs text-gray-600">Cliente X · últimos 30 dias</span>
          </div>

          <div className="p-6 space-y-4">
            {/* User question */}
            <div className="flex justify-end">
              <div className="bg-dark-gray rounded-lg rounded-tr-sm px-4 py-2.5 max-w-sm">
                <p className="text-sm text-white">Onde devo colocar mais dinheiro essa semana?</p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-3 items-start max-w-2xl">
              <div className="w-7 h-7 bg-acid-green/10 border border-acid-green/30 rounded flex items-center justify-center shrink-0 mt-0.5">
                <Brain size={13} className="text-acid-green" />
              </div>
              <div className="bg-acid-green/5 border border-acid-green/20 rounded-lg rounded-tl-sm px-4 py-3 flex-1">
                <p className="text-sm text-gray-200 leading-relaxed mb-3">
                  Seu <span className="text-acid-green font-semibold">TikTok Ads tem ROAS real de 5.1x</span> com apenas
                  12% do budget total (R$2.200). Em comparação, o Meta está com{' '}
                  <span className="text-warning">ROAS real de 3.2x</span> consumindo 68% do budget.
                </p>
                <p className="text-sm text-gray-200 leading-relaxed mb-3">
                  O GA4 confirma: 34% das sessões com transação dessa semana vieram de tiktok/cpc,
                  com taxa de conversão 2.3x maior que facebook/cpc.
                </p>
                <div className="bg-void-black rounded p-3 border border-acid-green/20">
                  <p className="text-xs text-acid-green font-semibold uppercase tracking-wider mb-2">Recomendação</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li className="flex gap-2"><ChevronRight size={12} className="text-acid-green mt-0.5 shrink-0" />Realocar R$3k do Meta para TikTok Ads esta semana</li>
                    <li className="flex gap-2"><ChevronRight size={12} className="text-acid-green mt-0.5 shrink-0" />Aumentar budget do conjunto de anúncios "Remarketing 7d" no TikTok</li>
                    <li className="flex gap-2"><ChevronRight size={12} className="text-acid-green mt-0.5 shrink-0" />Projeção: +R$12k-18k em receita real mantendo o mesmo ROAS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Input mock */}
          <div className="px-5 py-3 border-t border-dark-gray flex items-center gap-3">
            <div className="flex-1 bg-dark-gray rounded px-3 py-2 text-xs text-gray-600">
              Pergunte sobre seus dados...
            </div>
            <div className="w-8 h-8 bg-acid-green rounded flex items-center justify-center">
              <Zap size={14} className="text-void-black" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 197',
      period: '/mês',
      desc: 'Para freelancers e gestores independentes.',
      features: [
        'Até 3 clientes',
        '6 plataformas conectadas por cliente',
        '10 análises IA por mês',
        'Dashboard cross-platform',
        'Alertas automáticos',
        'Suporte por email',
      ],
      cta: 'Começar grátis',
      highlight: false,
    },
    {
      name: 'Pro',
      price: 'R$ 397',
      period: '/mês',
      desc: 'Para agências em crescimento.',
      features: [
        'Até 10 clientes',
        '6 plataformas conectadas por cliente',
        'IA ilimitada',
        'Tudo do Starter',
        'Alertas em tempo real',
        'Suporte prioritário',
      ],
      cta: 'Começar grátis',
      highlight: true,
    },
    {
      name: 'Agency',
      price: 'R$ 697',
      period: '/mês',
      desc: 'Para grandes agências.',
      features: [
        'Clientes ilimitados',
        '6 plataformas conectadas por cliente',
        'IA ilimitada',
        'Tudo do Pro',
        'Multi-usuário',
        'Onboarding dedicado',
      ],
      cta: 'Falar com a equipe',
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-6 border-t border-dark-gray">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-4xl font-bold text-white mb-4">
            Preço justo.{' '}
            <span className="text-acid-green">ROI imediato.</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-2">
            14 dias grátis com acesso Pro completo. Sem cartão de crédito.
          </p>
          <p className="text-sm text-gray-600">
            Planos anuais têm 2 meses grátis (paga 10, leva 12).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-lg border flex flex-col ${
                plan.highlight
                  ? 'bg-acid-green/5 border-acid-green/50'
                  : 'bg-off-black border-dark-gray'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-acid-green text-void-black text-xs font-bold uppercase tracking-wider rounded">
                  Mais popular
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white font-mono">{plan.price}</span>
                  <span className="text-sm text-gray-600">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400">{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-acid-green mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`w-full text-center py-3 text-sm font-semibold uppercase tracking-wider rounded transition-colors ${
                  plan.highlight
                    ? 'bg-acid-green text-void-black hover:bg-[#b8e600]'
                    : 'border border-dark-gray text-gray-300 hover:border-acid-green/40 hover:text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      q: 'Preciso dar acesso às contas dos meus clientes?',
      a: 'Não. O cliente autoriza via OAuth diretamente (como "Login com Google"). Você nunca manipula a senha deles. O acesso é somente leitura para métricas.',
    },
    {
      q: 'Funciona com Mercado Livre?',
      a: 'Sim. Cruzamos dados de pedidos do ML (vendas confirmadas + canceladas) com seus gastos em Mercado Livre Ads para calcular o ROAS real no marketplace.',
    },
    {
      q: 'A IA pode errar ou inventar dados?',
      a: 'A IA do S1mplo só analisa dados reais do seu banco — nunca inventa. Se não há dados suficientes, ela avisa. Todas as afirmações têm fonte rastreável.',
    },
    {
      q: 'E se uma plataforma falhar de sincronizar?',
      a: 'O dashboard exibe os últimos dados disponíveis com um aviso "Dados de [Plataforma] atualizados há X horas". Tentativas automáticas acontecem em background.',
    },
    {
      q: 'Qual o contrato mínimo?',
      a: 'Sem fidelidade. Cancele a qualquer momento. Seus dados ficam disponíveis por 30 dias após o cancelamento.',
    },
    {
      q: 'Tem versão para LATAM (fora do Brasil)?',
      a: 'Sim. Cobramos em USD via Stripe com cartão internacional. Starter $39/mo, Pro $79/mo, Agency $139/mo.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-off-black border-t border-dark-gray">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Perguntas frequentes
        </h2>
        <div className="space-y-4">
          {faqs.map(faq => (
            <div key={faq.q} className="p-5 bg-void-black border border-dark-gray rounded-lg">
              <p className="text-sm font-semibold text-white mb-2">{faq.q}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CTAFinal() {
  return (
    <section className="py-24 px-6 border-t border-dark-gray text-center">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          {[DollarSign, ShoppingCart, Target, Zap].map((Icon, i) => (
            <div key={i} className="w-10 h-10 bg-dark-gray rounded flex items-center justify-center">
              <Icon size={18} className="text-acid-green" />
            </div>
          ))}
        </div>
        <h2 className="text-4xl font-bold text-white mt-6 mb-4">
          Chega de adivinhar onde{' '}
          <span className="text-acid-green">vai o dinheiro</span>
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          14 dias grátis com acesso Pro completo. Conecte suas plataformas em 2 minutos
          e veja o que os dados cruzados revelam sobre sua performance real.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-acid-green text-void-black font-bold text-base uppercase tracking-wider rounded hover:bg-[#b8e600] transition-colors"
        >
          Começar grátis agora
          <ArrowRight size={18} />
        </Link>
        <p className="text-xs text-gray-600 mt-4">Sem cartão · Sem contrato · Cancele quando quiser</p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-dark-gray px-6 py-10 bg-off-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</span>
          <p className="text-xs text-gray-600 mt-1">Feito no Brasil 🇧🇷 para gestores que levam dados a sério.</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <Link to="/login" className="hover:text-white transition-colors">Entrar</Link>
          <Link to="/register" className="hover:text-white transition-colors">Criar conta</Link>
          <a href="#" className="hover:text-white transition-colors">Termos</a>
          <a href="#" className="hover:text-white transition-colors">Privacidade</a>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} S1mplo. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-void-black">
      <Nav />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <AIExample />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  );
}
