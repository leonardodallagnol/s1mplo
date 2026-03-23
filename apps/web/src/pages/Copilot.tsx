import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bot, Sparkles, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useInsights, useAnalyze, useAskCopilot, useUpdateInsight, AIInsight } from '../hooks/useAIInsights';

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL:    { label: 'CRÍTICO',     color: 'text-danger',      bg: 'bg-danger/10',      border: 'border-danger/40' },
  WARNING:     { label: 'ATENÇÃO',     color: 'text-warning',     bg: 'bg-warning/10',     border: 'border-warning/40' },
  OPPORTUNITY: { label: 'OPORTUNIDADE',color: 'text-opportunity', bg: 'bg-opportunity/10', border: 'border-opportunity/40' },
  INFO:        { label: 'INFO',        color: 'text-info',        bg: 'bg-info/10',        border: 'border-info/40' },
};

const SUGGESTED_QUESTIONS = [
  'Onde devo colocar mais dinheiro agora?',
  'Por que meu ROAS caiu?',
  'Qual canal tem melhor performance?',
  'Onde está o gargalo do meu funil?',
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `há ${d}d`;
  if (h > 0) return `há ${h}h`;
  return 'agora';
}

function InsightCard({ insight, onDismiss }: { insight: AIInsight; onDismiss: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.INFO;

  return (
    <div className={clsx('rounded border p-4 transition-all', cfg.bg, cfg.border, insight.isRead && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={clsx('text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded', cfg.color, cfg.bg, `border ${cfg.border}`)}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-600">{timeAgo(insight.createdAt)}</span>
          </div>
          <p className="text-sm font-semibold text-white">{insight.title}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{insight.summary}</p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-gray-600 hover:text-white shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-dark-gray/50 pt-3">
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{insight.detail}</p>
          {insight.recommendation && (
            <div className="border border-acid-green/30 bg-acid-green/5 rounded p-3">
              <p className="text-xs text-acid-green font-semibold uppercase tracking-wider mb-1">Recomendação</p>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{insight.recommendation}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {!insight.isRead && (
              <button
                onClick={() => onDismiss(insight.id)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Marcar como lido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Copilot() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';

  const insightsQ = useInsights(workspaceId);
  const analyzeMut = useAnalyze(workspaceId);
  const askMut = useAskCopilot(workspaceId);
  const updateMut = useUpdateInsight(workspaceId);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [answer]);

  const handleAsk = async () => {
    if (!question.trim() || askMut.isPending) return;
    setAnswer('');
    try {
      const resp = await askMut.mutateAsync({ question });
      setAnswer(typeof resp === 'string' ? resp : JSON.stringify(resp));
    } catch {
      setAnswer('Não foi possível obter uma resposta. Verifique se há dados sincronizados.');
    }
  };

  const handleAnalyze = async () => {
    if (analyzeMut.isPending) return;
    try {
      await analyzeMut.mutateAsync({});
    } catch {
      // shown via query error
    }
  };

  const handleDismiss = (id: string) => updateMut.mutate({ insightId: id, read: true });

  const insights = insightsQ.data?.insights || [];

  if (!workspaceId) {
    return (
      <DashboardLayout>
        <Header title="Copiloto IA" subtitle="Análises e recomendações" />
        <div className="p-6">
          <Card className="text-center py-16">
            <Bot size={32} className="text-acid-green mx-auto mb-3" />
            <p className="text-gray-400 mb-3">Selecione um cliente para usar o Copiloto.</p>
            <Link to="/workspaces" className="text-acid-green text-sm hover:underline">→ Gerenciar clientes</Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header title="Copiloto IA" subtitle="Análises cruzadas de todas as plataformas" />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Insights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Insights Gerados</p>
            <Button
              size="sm"
              onClick={handleAnalyze}
              loading={analyzeMut.isPending}
              disabled={analyzeMut.isPending}
            >
              <Sparkles size={14} className="mr-1.5" />
              Gerar Análise
            </Button>
          </div>

          {analyzeMut.isError && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/30 rounded p-3">
              Erro ao gerar análise. Verifique se há dados sincronizados.
            </div>
          )}

          {insightsQ.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-dark-gray animate-pulse rounded" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <Card className="text-center py-10">
              <Bot size={28} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">Nenhum insight gerado ainda.</p>
              <p className="text-xs text-gray-600">Clique em "Gerar Análise" para analisar seus dados cruzados.</p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {insights.filter(i => !i.isDismissed).map(insight => (
                <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Ask Copilot */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">Pergunte ao Copiloto</p>

          <Card className="space-y-3">
            <div className="relative">
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                placeholder="Ex: Por que meu ROAS caiu essa semana?"
                rows={3}
                className="w-full bg-void-black border border-dark-gray rounded p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-acid-green/50 transition-colors"
              />
            </div>
            <Button
              onClick={handleAsk}
              loading={askMut.isPending}
              disabled={!question.trim() || askMut.isPending}
              className="w-full"
            >
              <Send size={14} className="mr-2" />
              Perguntar
            </Button>
          </Card>

          {/* Suggested questions */}
          <div>
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Sugestões</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-xs text-gray-400 hover:text-acid-green border border-dark-gray hover:border-acid-green/40 rounded px-2.5 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Answer */}
          {askMut.isPending && (
            <Card className="flex items-center gap-3">
              <Loader2 size={16} className="text-acid-green animate-spin shrink-0" />
              <p className="text-sm text-gray-400">Analisando seus dados...</p>
            </Card>
          )}

          {answer && !askMut.isPending && (
            <Card ref={answerRef} className="border-acid-green/20">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-acid-green" />
                <p className="text-xs font-semibold text-acid-green uppercase tracking-wider">S1mplo Copilot</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{answer}</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
