import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, Info, TrendingDown,
  TrendingUp, Zap, Plug, CheckCheck, Bell,
} from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useAlerts, useStaleness, useMarkAlertRead } from '../hooks/useAlerts';

const PLATFORM_LABELS: Record<string, string> = {
  META_ADS: 'Meta Ads', GOOGLE_ADS: 'Google Ads', GOOGLE_ANALYTICS: 'GA4',
  TIKTOK_ADS: 'TikTok Ads', NUVEMSHOP: 'Nuvemshop', MERCADO_LIVRE: 'Mercado Livre',
};

const ALERT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ROAS_DROP:             { icon: TrendingDown, color: 'text-danger',  label: 'Queda de ROAS' },
  CPA_SPIKE:             { icon: TrendingUp,   color: 'text-warning', label: 'CPA Alto' },
  SPEND_ANOMALY:         { icon: Zap,          color: 'text-warning', label: 'Gasto Anômalo' },
  CONVERSION_DROP:       { icon: TrendingDown, color: 'text-danger',  label: 'Queda de Conversão' },
  CONNECTION_ERROR:      { icon: Plug,         color: 'text-danger',  label: 'Erro de Conexão' },
  SYNC_FAILED:           { icon: AlertCircle,  color: 'text-danger',  label: 'Sync Falhou' },
  AI_CRITICAL:           { icon: AlertCircle,  color: 'text-danger',  label: 'IA: Crítico' },
  AI_WARNING:            { icon: AlertTriangle,color: 'text-warning', label: 'IA: Atenção' },
  AI_OPPORTUNITY:        { icon: Info,         color: 'text-opportunity', label: 'IA: Oportunidade' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `há ${d}d`;
  if (h > 0) return `há ${h}h`;
  if (m > 0) return `há ${m}min`;
  return 'agora';
}

function stalenessColor(hoursAgo: number | null) {
  if (hoursAgo === null) return 'text-danger';
  if (hoursAgo < 8) return 'text-success';
  if (hoursAgo < 24) return 'text-warning';
  return 'text-danger';
}

function stalenessLabel(hoursAgo: number | null) {
  if (hoursAgo === null) return 'nunca sincronizado';
  if (hoursAgo < 1) return 'há menos de 1h';
  return `há ${hoursAgo.toFixed(0)}h`;
}

export default function Alerts() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const [unreadOnly, setUnreadOnly] = useState(false);

  const alertsQ = useAlerts(workspaceId, unreadOnly);
  const stalenessQ = useStaleness(workspaceId);
  const markRead = useMarkAlertRead(workspaceId);

  const alerts = alertsQ.data || [];
  const staleness = stalenessQ.data || [];
  const unreadCount = alerts.filter(a => !a.isRead).length;

  if (!workspaceId) {
    return (
      <DashboardLayout>
        <Header title="Alertas" subtitle="Anomalias e notificações automáticas" />
        <div className="p-6">
          <Card className="text-center py-16">
            <Bell size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-3">Selecione um cliente para ver os alertas.</p>
            <Link to="/workspaces" className="text-acid-green text-sm hover:underline">→ Gerenciar clientes</Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header title="Alertas" subtitle="Anomalias detectadas automaticamente" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUnreadOnly(false)}
            className={clsx('px-3 py-1.5 text-xs rounded font-medium transition-colors',
              !unreadOnly ? 'bg-acid-green text-void-black' : 'text-gray-400 hover:text-white border border-dark-gray'
            )}
          >
            Todos {alerts.length > 0 && `(${alerts.length})`}
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={clsx('px-3 py-1.5 text-xs rounded font-medium transition-colors',
              unreadOnly ? 'bg-acid-green text-void-black' : 'text-gray-400 hover:text-white border border-dark-gray'
            )}
          >
            Não lidos {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {alertsQ.isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-dark-gray animate-pulse rounded" />)
          ) : alerts.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCheck size={28} className="text-success mx-auto mb-3" />
              <p className="text-sm text-white font-medium mb-1">Tudo certo por aqui</p>
              <p className="text-xs text-gray-600">
                {unreadOnly ? 'Nenhum alerta não lido.' : 'Nenhum alerta no momento.'}
              </p>
            </Card>
          ) : (
            alerts.map(alert => {
              const cfg = ALERT_TYPE_CONFIG[alert.type] || { icon: AlertTriangle, color: 'text-warning', label: alert.type };
              const Icon = cfg.icon;
              return (
                <div
                  key={alert.id}
                  className={clsx(
                    'flex items-start gap-4 p-4 rounded border transition-all',
                    alert.isRead
                      ? 'bg-off-black border-dark-gray opacity-60'
                      : alert.type === 'CONNECTION_ERROR' || alert.type === 'ROAS_DROP' || alert.type === 'SYNC_FAILED'
                      ? 'bg-danger/5 border-danger/30'
                      : 'bg-warning/5 border-warning/30'
                  )}
                >
                  <Icon size={18} className={clsx(cfg.color, 'mt-0.5 shrink-0')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={clsx('text-xs font-semibold uppercase tracking-wider', cfg.color)}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-600">{timeAgo(alert.createdAt)}</span>
                      {!alert.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-acid-green inline-block" />
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{alert.message}</p>
                  </div>
                  {!alert.isRead && (
                    <button
                      onClick={() => markRead.mutate(alert.id)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
                      title="Marcar como lido"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Staleness / Connection Status */}
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Status das Conexões</p>
          {stalenessQ.isLoading ? (
            <div className="h-16 bg-dark-gray animate-pulse rounded" />
          ) : staleness.length === 0 ? (
            <Card className="py-4 text-center">
              <p className="text-xs text-gray-600">Nenhuma plataforma conectada.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {staleness.map(s => (
                <div
                  key={s.platform}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded border',
                    s.isStale ? 'bg-warning/5 border-warning/30' : 'bg-off-black border-dark-gray'
                  )}
                >
                  <div className={clsx('w-2 h-2 rounded-full shrink-0', {
                    'bg-success': !s.isStale && s.status === 'ACTIVE',
                    'bg-warning': s.isStale && s.status !== 'ERROR',
                    'bg-danger': s.status === 'ERROR',
                    'bg-gray-600': s.status === 'DISCONNECTED',
                  })} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {PLATFORM_LABELS[s.platform] || s.platform}
                    </p>
                    <p className={clsx('text-xs', stalenessColor(s.hoursAgo))}>
                      {stalenessLabel(s.hoursAgo)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
