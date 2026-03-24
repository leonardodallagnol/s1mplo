import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Bot, ChevronRight, ChevronLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useInsights, useAskCopilot } from '../../hooks/useAIInsights';

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL:    'bg-danger',
  WARNING:     'bg-warning',
  OPPORTUNITY: 'bg-opportunity',
  INFO:        'bg-info',
};

export function CopilotPanel() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const insightsQ = useInsights(workspaceId);
  const askMut = useAskCopilot(workspaceId);

  const recentInsights = (insightsQ.data?.insights || [])
    .filter(i => !i.isDismissed)
    .slice(0, 3);

  const handleAsk = async () => {
    if (!question.trim() || askMut.isPending) return;
    setAnswer('');
    try {
      const resp = await askMut.mutateAsync({ question });
      setAnswer(typeof resp === 'string' ? resp : JSON.stringify(resp));
      setQuestion('');
    } catch {
      setAnswer('Erro ao consultar o Copiloto.');
    }
  };

  if (!workspaceId) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 px-2 py-3 rounded-l',
          'bg-off-black border border-dark-gray border-r-0 text-acid-green hover:bg-dark-gray transition-colors',
        )}
        title={open ? 'Fechar Copiloto' : 'Abrir Copiloto'}
      >
        <Bot size={16} />
        {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Panel */}
      <div className={clsx(
        'fixed right-0 top-0 h-full w-72 bg-off-black border-l border-dark-gray z-30 flex flex-col',
        'transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-gray">
          <Bot size={16} className="text-acid-green" />
          <span className="text-sm font-semibold text-white">Copiloto IA</span>
          <Link
            to={`/copilot?workspace=${workspaceId}`}
            className="ml-auto text-xs text-gray-600 hover:text-acid-green transition-colors"
          >
            Ver tudo →
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Recent insights */}
          {recentInsights.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Últimos Insights</p>
              <div className="space-y-2">
                {recentInsights.map(insight => (
                  <div key={insight.id} className="p-2.5 bg-dark-gray/50 rounded border border-dark-gray">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT[insight.severity] || 'bg-gray-500')} />
                      <span className="text-xs font-medium text-white truncate">{insight.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{insight.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insightsQ.isLoading && (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-dark-gray animate-pulse rounded" />)}
            </div>
          )}

          {!insightsQ.isLoading && recentInsights.length === 0 && (
            <div className="text-center py-6">
              <Sparkles size={20} className="text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Nenhum insight ainda.</p>
              <Link
                to={`/copilot?workspace=${workspaceId}`}
                className="text-xs text-acid-green hover:underline mt-1 block"
              >
                Gerar análise
              </Link>
            </div>
          )}

          {/* Answer area */}
          {askMut.isPending && (
            <div className="flex items-center gap-2 p-3 bg-dark-gray/30 rounded">
              <Loader2 size={14} className="text-acid-green animate-spin shrink-0" />
              <p className="text-xs text-gray-400">Analisando...</p>
            </div>
          )}

          {answer && !askMut.isPending && (
            <div className="p-3 bg-acid-green/5 border border-acid-green/20 rounded">
              <p className="text-xs text-acid-green font-semibold mb-1">Copiloto</p>
              <p className="text-xs text-gray-300 leading-relaxed">{answer}</p>
            </div>
          )}
        </div>

        {/* Ask input */}
        <div className="p-3 border-t border-dark-gray">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
              placeholder="Pergunte algo..."
              className="flex-1 bg-void-black border border-dark-gray rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-acid-green/50 transition-colors"
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || askMut.isPending}
              className="p-2 bg-acid-green text-void-black rounded hover:bg-[#b8e600] disabled:opacity-40 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
