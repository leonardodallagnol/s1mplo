import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Plug, Trash2, ArrowRight } from 'lucide-react';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

const PLATFORM_COLORS: Record<string, string> = {
  META_ADS: '#3B82F6',
  GOOGLE_ADS: '#F59E0B',
  GOOGLE_ANALYTICS: '#22C55E',
  TIKTOK_ADS: '#FAFAFA',
  NUVEMSHOP: '#A855F7',
  MERCADO_LIVRE: '#F59E0B',
};

const PLATFORM_LABELS: Record<string, string> = {
  META_ADS: 'Meta',
  GOOGLE_ADS: 'Google Ads',
  GOOGLE_ANALYTICS: 'GA4',
  TIKTOK_ADS: 'TikTok',
  NUVEMSHOP: 'Nuvemshop',
  MERCADO_LIVRE: 'ML',
};

export default function Workspaces() {
  const { workspaces, loading, create, remove } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await create(newName.trim());
      setShowCreate(false);
      setNewName('');
      navigate(`/workspaces/${ws.id}/setup`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-acid-green font-bold text-xl tracking-wider">S1MPLO</span>
            <h1 className="text-2xl font-semibold text-white mt-1">Seus clientes</h1>
            <p className="text-gray-400 text-sm">Cada cliente é uma subconta isolada</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="md">
            <Plus size={16} className="mr-1" />
            Novo cliente
          </Button>
        </div>

        {/* Empty state */}
        {workspaces.length === 0 && (
          <Card className="text-center py-16">
            <Users size={40} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum cliente ainda</h3>
            <p className="text-gray-400 text-sm mb-6">
              Crie seu primeiro cliente e conecte as plataformas de ads e e-commerce.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} className="mr-1" />
              Criar primeiro cliente
            </Button>
          </Card>
        )}

        {/* Workspace grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              hover
              className="cursor-pointer group"
              onClick={() => navigate(`/dashboard?workspace=${ws.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-acid-green transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">{ws.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Deletar cliente "${ws.name}"?`)) remove(ws.id);
                    }}
                    className="text-gray-600 hover:text-danger transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-acid-green transition-colors" />
                </div>
              </div>

              {/* Connections */}
              {ws.connections.length === 0 ? (
                <div
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-acid-green transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workspaces/${ws.id}/setup`);
                  }}
                >
                  <Plug size={12} />
                  Conectar plataformas
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {ws.connections.map((conn) => (
                    <span
                      key={conn.id}
                      className="text-xs px-2 py-0.5 rounded border"
                      style={{
                        color: PLATFORM_COLORS[conn.platform],
                        borderColor: `${PLATFORM_COLORS[conn.platform]}40`,
                        backgroundColor: `${PLATFORM_COLORS[conn.platform]}10`,
                      }}
                    >
                      {PLATFORM_LABELS[conn.platform] || conn.platform}
                      {conn.status === 'ERROR' && ' ⚠'}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo cliente">
        <div className="space-y-4">
          <Input
            label="Nome do cliente"
            placeholder="Ex: Corel Resinas, Loja XYZ..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreate} loading={creating}>
              Criar cliente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
