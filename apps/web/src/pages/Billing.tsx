import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Zap, Building2, Users, Check,
  AlertTriangle, Clock, ExternalLink, RefreshCw,
  ChevronUp, ChevronDown, X,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  plan: 'TRIAL' | 'STARTER' | 'PRO' | 'AGENCY';
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'SUSPENDED';
  planLabel: string;
  maxWorkspaces: number;
  aiCreditsLimit: number;
  aiCredits: number;
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialEndsAt?: string;
  currentPeriodEnd: string;
  gateway: 'ASAAS' | 'STRIPE';
}

// ─── Plan Config ──────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'STARTER',
    label: 'Starter',
    priceMonthly: 197,
    priceYearly: 1970,
    description: 'Para gestores que estão começando',
    maxWorkspaces: 3,
    aiCredits: 10,
    features: [
      'Até 3 clientes (workspaces)',
      '10 análises IA por mês',
      'Meta Ads + Google Ads + GA4',
      'Nuvemshop + Mercado Livre',
      'Dashboard ROAS Real',
      'Alertas automáticos',
    ],
    color: 'border-dark-gray',
    badge: null,
  },
  {
    id: 'PRO',
    label: 'Pro',
    priceMonthly: 397,
    priceYearly: 3970,
    description: 'Para gestores e pequenas agências',
    maxWorkspaces: 10,
    aiCredits: -1,
    features: [
      'Até 10 clientes (workspaces)',
      'IA ilimitada',
      'Todas as integrações',
      'TikTok Ads',
      'Funil cross-platform completo',
      'Copiloto IA em tempo real',
      'Alertas avançados',
    ],
    color: 'border-acid-green',
    badge: 'MAIS POPULAR',
  },
  {
    id: 'AGENCY',
    label: 'Agency',
    priceMonthly: 697,
    priceYearly: 6970,
    description: 'Para agências com múltiplos clientes',
    maxWorkspaces: -1,
    aiCredits: -1,
    features: [
      'Clientes ilimitados',
      'IA ilimitada',
      'Todas as integrações',
      'Multi-usuário (em breve)',
      'Client portal (em breve)',
      'Prioridade no suporte',
      'Onboarding dedicado',
    ],
    color: 'border-dark-gray',
    badge: null,
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, isTrialActive, trialDaysLeft }: {
  status: Subscription['status'];
  isTrialActive: boolean;
  trialDaysLeft: number;
}) {
  if (isTrialActive) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-opportunity/10 border border-opportunity text-opportunity">
        <Clock className="w-3 h-3" />
        TRIAL — {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}
      </span>
    );
  }

  const config: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: 'ATIVO',       className: 'bg-success/10 border-success text-success' },
    PAST_DUE: { label: 'PAGAMENTO PENDENTE', className: 'bg-warning/10 border-warning text-warning' },
    CANCELED: { label: 'CANCELADO',   className: 'bg-danger/10 border-danger text-danger' },
    SUSPENDED:{ label: 'SUSPENSO',    className: 'bg-danger/10 border-danger text-danger' },
    TRIAL:    { label: 'TRIAL',       className: 'bg-opportunity/10 border-opportunity text-opportunity' },
  };

  const c = config[status] || config['ACTIVE'];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Current Plan Card ────────────────────────────────────────────────────────

function CurrentPlanCard({
  subscription,
  onManage,
  onCancel,
}: {
  subscription: Subscription;
  onManage: () => void;
  onCancel: () => void;
}) {
  const aiCreditsDisplay =
    subscription.aiCreditsLimit === -1
      ? 'Ilimitada'
      : `${subscription.aiCredits} / ${subscription.aiCreditsLimit}`;

  const workspacesDisplay =
    subscription.maxWorkspaces === -1 ? 'Ilimitados' : String(subscription.maxWorkspaces);

  return (
    <div className="bg-off-black border border-dark-gray rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Plano atual</h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-acid-green font-mono">{subscription.planLabel}</span>
            <StatusBadge
              status={subscription.status}
              isTrialActive={subscription.isTrialActive}
              trialDaysLeft={subscription.trialDaysLeft}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {subscription.gateway === 'STRIPE' && subscription.status === 'ACTIVE' && (
            <button
              onClick={onManage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-dark-gray rounded hover:border-acid-green hover:text-acid-green transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Gerenciar pagamento
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-void-black border border-dark-gray rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Clientes (workspaces)</p>
          <p className="text-lg font-bold text-white font-mono">{workspacesDisplay}</p>
        </div>
        <div className="bg-void-black border border-dark-gray rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Análises IA este mês</p>
          <p className="text-lg font-bold text-white font-mono">{aiCreditsDisplay}</p>
        </div>
      </div>

      {subscription.isTrialActive && (
        <div className="mt-4 p-3 bg-warning/5 border border-warning/30 rounded flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-warning font-medium">
              Seu trial termina em {subscription.trialDaysLeft} dia{subscription.trialDaysLeft !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Escolha um plano abaixo para continuar acessando o S1mplo.
            </p>
          </div>
        </div>
      )}

      {subscription.status === 'PAST_DUE' && (
        <div className="mt-4 p-3 bg-danger/5 border border-danger/30 rounded flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-danger font-medium">Pagamento pendente</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Regularize seu pagamento para evitar suspensão da conta.
            </p>
          </div>
        </div>
      )}

      {subscription.status === 'ACTIVE' && !subscription.isTrialActive && (
        <div className="mt-4 pt-4 border-t border-dark-gray flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Próxima renovação: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
          </p>
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-danger transition-colors"
          >
            Cancelar assinatura
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
  billing,
  onSelect,
  loading,
}: {
  plan: typeof PLANS[0];
  currentPlan: string;
  billing: 'MONTHLY' | 'YEARLY';
  onSelect: (planId: string) => void;
  loading: string | null;
}) {
  const isCurrentPlan = plan.id === currentPlan;
  const isHigherPlan = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan);
  const price = billing === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
  const isLoading = loading === plan.id;

  return (
    <div className={`relative bg-off-black border ${plan.color} rounded-lg p-6 flex flex-col ${plan.id === 'PRO' ? 'ring-1 ring-acid-green/30' : ''}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-0.5 bg-acid-green text-void-black text-xs font-bold rounded-full uppercase tracking-wider">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{plan.label}</h3>
        <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white font-mono">
            R${price.toLocaleString('pt-BR')}
          </span>
          <span className="text-sm text-gray-400">
            /{billing === 'YEARLY' ? 'ano' : 'mês'}
          </span>
        </div>
        {billing === 'YEARLY' && (
          <p className="text-xs text-success mt-1">2 meses grátis</p>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-acid-green shrink-0 mt-0.5" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <div className="w-full py-2 text-center text-sm font-semibold text-gray-500 border border-dark-gray rounded">
          Plano atual
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isLoading}
          className={`w-full py-2.5 text-sm font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2
            ${plan.id === 'PRO'
              ? 'bg-acid-green text-void-black hover:bg-[#b8e600]'
              : 'border border-acid-green text-acid-green hover:bg-acid-green/10'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              {isHigherPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isHigherPlan ? 'Fazer upgrade' : 'Fazer downgrade'}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Billing() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se voltou de checkout com sucesso
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      fetchSubscription();
      window.history.replaceState({}, '', '/billing');
    } else {
      fetchSubscription();
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/billing/subscription');
      setSubscription(res.data.data || res.data);
    } catch {
      setError('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await api.post('/billing/checkout', {
        plan: planId,
        cycle: billing,
      });
      const { url } = res.data.data || res.data;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar sessão de pagamento');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManagePayment = async () => {
    try {
      const res = await api.post('/billing/portal');
      const { url } = res.data.data || res.data;
      if (url) window.open(url, '_blank');
    } catch {
      setError('Erro ao abrir portal de pagamento');
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await api.post('/billing/cancel');
      setShowCancelConfirm(false);
      await fetchSubscription();
    } catch {
      setError('Erro ao cancelar assinatura');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 text-acid-green animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Planos & Cobrança</h1>
          <p className="text-gray-400 mt-1">Gerencie sua assinatura e método de pagamento</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <p className="text-sm text-danger flex-1">{error}</p>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-danger/60 hover:text-danger" />
            </button>
          </div>
        )}

        {/* Current Plan */}
        {subscription && (
          <CurrentPlanCard
            subscription={subscription}
            onManage={handleManagePayment}
            onCancel={() => setShowCancelConfirm(true)}
          />
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Escolha seu plano</h2>
          <div className="flex items-center gap-2 bg-off-black border border-dark-gray rounded-lg p-1">
            <button
              onClick={() => setBilling('MONTHLY')}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                billing === 'MONTHLY'
                  ? 'bg-acid-green text-void-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('YEARLY')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                billing === 'YEARLY'
                  ? 'bg-acid-green text-void-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Anual
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                billing === 'YEARLY' ? 'bg-void-black/30 text-void-black' : 'bg-success/20 text-success'
              }`}>
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={subscription?.plan || 'TRIAL'}
              billing={billing}
              onSelect={handleSelectPlan}
              loading={checkoutLoading}
            />
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-off-black border border-dark-gray rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4">Dúvidas frequentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Você pode cancelar quando quiser. Seus dados ficam disponíveis por 30 dias após o cancelamento.',
              },
              {
                q: 'Como funciona o trial?',
                a: '14 dias com acesso Pro completo, sem cartão. No fim do trial você escolhe um plano ou sua conta é pausada.',
              },
              {
                q: 'Quais são os métodos de pagamento?',
                a: 'Brasil: Pix, boleto e cartão de crédito via Asaas. Internacional: cartão de crédito via Stripe.',
              },
              {
                q: 'O que é um workspace?',
                a: 'Cada workspace representa um cliente. Você conecta as plataformas dele (Meta Ads, GA4, Nuvemshop, etc.) e o S1mplo cruza os dados.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-sm font-medium text-white mb-1">{q}</p>
                <p className="text-sm text-gray-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-off-black border border-dark-gray rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-danger mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-white">Cancelar assinatura?</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Você perderá acesso ao S1mplo ao final do período atual. Seus dados serão mantidos por 30 dias.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Manter plano
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-danger text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancelLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
