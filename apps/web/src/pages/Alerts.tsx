import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Bell } from 'lucide-react';

export default function Alerts() {
  return (
    <DashboardLayout>
      <Header title="Alertas" subtitle="Anomalias e notificações automáticas" />
      <div className="p-6">
        <Card className="text-center py-16">
          <Bell size={40} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sem alertas ativos</h3>
          <p className="text-gray-400 text-sm">
            Alertas de ROAS, CPA e anomalias aparecem aqui automaticamente.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
