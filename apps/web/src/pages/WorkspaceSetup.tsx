import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useConnections } from '../hooks/useConnections';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const PLATFORMS = [
  {
    id: 'META_ADS',
    label: 'Meta Ads',
    description: 'Facebook & Instagram Ads',
    color: '#3B82F6',
    icon: '📘',
  },
  {
    id: 'GOOGLE_ADS',
    label: 'Google Ads + GA4',
    description: 'Conecta os dois de uma vez',
    color: '#F59E0B',
    icon: '🔍',
  },
  {
    id: 'TIKTOK_ADS',
    label: 'TikTok Ads',
    description: 'TikTok Business',
    color: '#FAFAFA',
    icon: '🎵',
  },
  {
    id: 'NUVEMSHOP',
    label: 'Nuvemshop',
    description: 'Pedidos e UTMs reais',
    color: '#A855F7',
    icon: '🛍️',
  },
  {
    id: 'MERCADO_LIVRE',
    label: 'Mercado Livre',
    description: 'Vendas + ML Ads',
    color: '#F59E0B',
    icon: '🛒',
  },
];

export default function WorkspaceSetup() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connections, connectMetaAds } = useConnections(workspaceId!);

  const connectedPlatforms = new Set(connections.map((c) => c.platform));

  const handleConnect = (platformId: string) => {
    if (platformId === 'META_ADS') {
      connectMetaAds(workspaceId!);
    }
    // Other platforms will be added in Phase 2
  };

  const connectedCount = connectedPlatforms.size;

  return (
    <div className="min-h-screen bg-void-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <span className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</span>
          <h1 className="text-2xl font-semibold text-white mt-1">Configurar cliente</h1>
          <p className="text-gray-400 text-sm mt-1">
            Conecte as plataformas que este cliente usa. Você pode pular e adicionar depois.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-dark-gray rounded-full overflow-hidden">
            <div
              className="h-full bg-acid-green transition-all duration-500"
              style={{ width: `${(connectedCount / PLATFORMS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {connectedCount}/{PLATFORMS.length} conectadas
          </span>
        </div>

        <div className="space-y-3">
          {PLATFORMS.map((platform) => {
            const connected = connectedPlatforms.has(platform.id);
            return (
              <Card
                key={platform.id}
                className="flex items-center gap-4 cursor-pointer hover:border-acid-green/30 transition-colors"
                onClick={() => !connected && handleConnect(platform.id)}
              >
                <span className="text-2xl">{platform.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{platform.label}</p>
                  <p className="text-xs text-gray-400">{platform.description}</p>
                </div>
                {connected ? (
                  <CheckCircle size={20} className="text-success flex-shrink-0" />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Conectar</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/workspaces')}
          >
            Conectar depois
          </Button>
          {connectedCount > 0 && (
            <Button
              className="flex-1"
              onClick={() => navigate(`/dashboard?workspace=${workspaceId}`)}
            >
              Ver dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
