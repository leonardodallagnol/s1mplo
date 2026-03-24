import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Unlink, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useConnections } from '../hooks/useConnections';
import { useStaleness } from '../hooks/useAlerts';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ACTIVE:       { icon: CheckCircle, color: 'text-success', label: 'Ativo' },
  ERROR:        { icon: AlertCircle, color: 'text-danger',  label: 'Erro' },
  EXPIRED:      { icon: Clock,       color: 'text-warning', label: 'Expirado' },
  DISCONNECTED: { icon: Unlink,      color: 'text-gray-400',label: 'Desconectado' },
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AVAILABLE_PLATFORMS = [
  { key: 'META_ADS',        label: 'Meta Ads',       path: 'meta-ads',        color: '#3B82F6' },
  { key: 'GOOGLE_ADS',      label: 'Google Ads',     path: 'google',          color: '#F59E0B' },
  { key: 'GOOGLE_ANALYTICS',label: 'Google Analytics',path: 'google',         color: '#22C55E' },
  { key: 'TIKTOK_ADS',      label: 'TikTok Ads',     path: 'tiktok-ads',      color: '#E2E8F0' },
  { key: 'NUVEMSHOP',       label: 'Nuvemshop',      path: 'nuvemshop',       color: '#A855F7' },
  { key: 'MERCADO_LIVRE',   label: 'Mercado Livre',  path: 'mercadolivre',    color: '#F59E0B' },
];

function stalenessInfo(hoursAgo: number | null) {
  if (hoursAgo === null) return { text: 'nunca sincronizado', cls: 'text-danger' };
  if (hoursAgo < 8)  return { text: `há ${hoursAgo.toFixed(0)}h`, cls: 'text-success' };
  if (hoursAgo < 24) return { text: `há ${hoursAgo.toFixed(0)}h`, cls: 'text-warning' };
  return { text: `há ${hoursAgo.toFixed(0)}h`, cls: 'text-danger' };
}

export default function Connections() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const { connections, loading, disconnect, syncNow } = useConnections(workspaceId);
  const stalenessQ = useStaleness(workspaceId);

  const connectedPlatforms = new Set(connections.map(c => c.platform));

  const connectPlatform = (path: string) => {
    window.location.href = `${API}/oauth/${path}/authorize?workspaceId=${workspaceId}`;
  };

  // Build staleness map for quick lookup
  const stalenessMap = Object.fromEntries(
    (stalenessQ.data || []).map(s => [s.platform, s])
  );

  return (
    <DashboardLayout>
      <Header title="Conexões" subtitle="Plataformas conectadas a este cliente" />
      <div className="p-6 space-y-6">

        {/* Connected platforms */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-dark-gray animate-pulse rounded" />)}
          </div>
        ) : connections.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-gray-400 text-sm">Nenhuma plataforma conectada ainda.</p>
            <p className="text-xs text-gray-600 mt-1">Conecte abaixo para começar a sincronizar dados.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 uppercase tracking-wider">Conectadas</p>
            {connections.map((conn) => {
              const status = STATUS_CONFIG[conn.status] || STATUS_CONFIG.DISCONNECTED;
              const StatusIcon = status.icon;
              const stale = stalenessMap[conn.platform];
              const sl = stale ? stalenessInfo(stale.hoursAgo) : null;

              return (
                <Card key={conn.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white">
                        {AVAILABLE_PLATFORMS.find(p => p.key === conn.platform)?.label || conn.platform.replace(/_/g, ' ')}
                      </p>
                      <span className={clsx('flex items-center gap-1 text-xs', status.color)}>
                        <StatusIcon size={12} />{status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {conn.platformAccountName || conn.platformAccountId}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {sl && (
                        <span className={clsx('text-xs', sl.cls)}>
                          Dados: {sl.text}
                          {stale?.isStale && ' · Tentando reconectar...'}
                        </span>
                      )}
                      {!sl && conn.lastSyncAt && (
                        <span className="text-xs text-gray-600">
                          Sync: {new Date(conn.lastSyncAt).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {conn.lastSyncError && (
                      <p className="text-xs text-danger mt-0.5 truncate">{conn.lastSyncError}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => syncNow(conn.id)} title="Sincronizar agora">
                      <RefreshCw size={14} />
                    </Button>
                    <Button
                      variant="danger" size="sm"
                      onClick={() => { if (confirm('Desconectar esta plataforma?')) disconnect(conn.id); }}
                    >
                      Desconectar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Available platforms to connect */}
        {workspaceId && (
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Adicionar Plataforma</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_PLATFORMS.filter(p => !connectedPlatforms.has(p.key)).map(p => (
                <button
                  key={p.key}
                  onClick={() => connectPlatform(p.path)}
                  className="flex items-center gap-3 p-3 bg-off-black border border-dark-gray rounded hover:border-acid-green/40 hover:bg-acid-green/5 transition-all text-left group"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{p.label}</span>
                  <Plus size={12} className="text-gray-600 group-hover:text-acid-green ml-auto transition-colors" />
                </button>
              ))}
              {AVAILABLE_PLATFORMS.filter(p => !connectedPlatforms.has(p.key)).length === 0 && (
                <p className="text-xs text-gray-600 col-span-full">Todas as plataformas disponíveis estão conectadas.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
