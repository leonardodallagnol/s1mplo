import { AlertTriangle } from 'lucide-react';
import { StalenessItem } from '../../hooks/useAlerts';

interface StalenessAlertProps {
  staleness: StalenessItem[];
}

const PLATFORM_LABELS: Record<string, string> = {
  META_ADS: 'Meta Ads',
  GOOGLE_ADS: 'Google Ads',
  GOOGLE_ANALYTICS: 'Google Analytics',
  TIKTOK_ADS: 'TikTok Ads',
  NUVEMSHOP: 'Nuvemshop',
  MERCADO_LIVRE: 'Mercado Livre',
};

export function StalenessAlert({ staleness }: StalenessAlertProps) {
  const staleConnections = staleness.filter(s => s.isStale);

  if (staleConnections.length === 0) return null;

  return (
    <div className="mx-6 mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded flex items-start gap-3">
      <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-warning text-sm font-medium">Dados desatualizados</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {staleConnections.map((s) => (
            <span key={s.platform} className="text-xs text-gray-400">
              {PLATFORM_LABELS[s.platform] || s.platform}:{' '}
              {s.hoursAgo !== null
                ? `atualizado há ${s.hoursAgo.toFixed(0)}h`
                : 'nunca sincronizado'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
