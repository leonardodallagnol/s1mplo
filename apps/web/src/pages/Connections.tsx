import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Unlink, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useConnections } from '../hooks/useConnections';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-success', label: 'Ativo' },
  ERROR: { icon: AlertCircle, color: 'text-danger', label: 'Erro' },
  EXPIRED: { icon: Clock, color: 'text-warning', label: 'Expirado' },
  DISCONNECTED: { icon: Unlink, color: 'text-gray-400', label: 'Desconectado' },
};

export default function Connections() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const { connections, loading, connectMetaAds, disconnect, syncNow } =
    useConnections(workspaceId);

  return (
    <DashboardLayout>
      <Header title="Conexões" subtitle="Plataformas conectadas a este cliente" />
      <div className="p-6 space-y-4">
        {connections.length === 0 && !loading && (
          <Card className="text-center py-10">
            <p className="text-gray-400">Nenhuma plataforma conectada ainda.</p>
            {workspaceId && (
              <Button
                className="mt-4"
                onClick={() => connectMetaAds(workspaceId)}
              >
                Conectar Meta Ads
              </Button>
            )}
          </Card>
        )}

        {connections.map((conn) => {
          const status = STATUS_CONFIG[conn.status] || STATUS_CONFIG.DISCONNECTED;
          const StatusIcon = status.icon;

          return (
            <Card key={conn.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{conn.platform.replace(/_/g, ' ')}</p>
                  <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {conn.platformAccountName || conn.platformAccountId}
                </p>
                {conn.lastSyncAt && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Sync: {new Date(conn.lastSyncAt).toLocaleString('pt-BR')}
                  </p>
                )}
                {conn.lastSyncError && (
                  <p className="text-xs text-danger mt-0.5">{conn.lastSyncError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => syncNow(conn.id)}
                  title="Sincronizar agora"
                >
                  <RefreshCw size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm('Desconectar esta plataforma?')) disconnect(conn.id);
                  }}
                >
                  Desconectar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
