import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Header title="Configurações" />
      <div className="p-6 space-y-4 max-w-2xl">
        <Card>
          <h3 className="text-base font-semibold text-white mb-4">Conta</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Nome</span>
              <span className="text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">País</span>
              <span className="text-white">{user?.country}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-white mb-4">Plano</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Plano atual</span>
              <span className="text-acid-green font-semibold">{user?.subscription?.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="text-white">{user?.subscription?.status}</span>
            </div>
            {user?.subscription?.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Trial expira em</span>
                <span className="text-warning">
                  {new Date(user.subscription.trialEndsAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Clientes (workspaces)</span>
              <span className="text-white">
                {user?.subscription?.maxWorkspaces === -1
                  ? 'Ilimitado'
                  : `Até ${user?.subscription?.maxWorkspaces}`}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
