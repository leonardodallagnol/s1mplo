import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, ShoppingCart, Target, Zap,
  TrendingDown, AlertTriangle, Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { StalenessAlert } from '../components/alerts/StalenessAlert';
import {
  useConsolidatedKPIs, useChannelComparison, useFunnel,
  useRealRoas, useConversionValidation, KPIData, ChannelData, FunnelData,
} from '../hooks/useDashboard';
import { useStaleness } from '../hooks/useAlerts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) =>
  v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `R$${(v / 1_000).toFixed(0)}K`
  : fmt(v);

const PLATFORM_LABELS: Record<string, string> = {
  META_ADS: 'Meta Ads', GOOGLE_ADS: 'Google Ads', GOOGLE_ANALYTICS: 'GA4',
  TIKTOK_ADS: 'TikTok Ads', NUVEMSHOP: 'Nuvemshop', MERCADO_LIVRE: 'Mercado Livre',
};

const DATE_RANGES = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }];

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
}

function KPICard({ label, value, note, change, icon: Icon, loading }: {
  label: string; value: string; note?: string; change?: string;
  icon: React.ElementType; loading?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <Icon size={16} className="text-gray-600" />
      </div>
      {loading
        ? <div className="h-8 w-24 bg-dark-gray animate-pulse rounded" />
        : <p className="text-3xl font-bold text-white font-mono">{value}</p>
      }
      {change && !loading && (
        <div className="flex items-center gap-1 mt-2 text-xs text-danger">
          <TrendingDown size={12} />{change}
        </div>
      )}
      {note && !loading && <p className="text-xs text-gray-600 mt-1">{note}</p>}
    </Card>
  );
}

function FunnelViz({ funnel }: { funnel: FunnelData }) {
  const steps = [
    { key: 'impressions', label: 'Impressões', value: funnel.steps.impressions, dropOff: funnel.dropOffs.impressionsToClicks },
    { key: 'clicks', label: 'Cliques', value: funnel.steps.clicks, dropOff: funnel.dropOffs.clicksToSessions },
    { key: 'sessions', label: 'Sessões', value: funnel.steps.sessions, dropOff: funnel.dropOffs.sessionsToAddToCart },
    { key: 'addToCarts', label: 'Carrinhos', value: funnel.steps.addToCarts, dropOff: funnel.dropOffs.addToCartToCheckout },
    { key: 'checkouts', label: 'Checkouts', value: funnel.steps.checkouts, dropOff: funnel.dropOffs.checkoutToOrders },
    { key: 'orders', label: 'Pedidos', value: funnel.steps.orders, dropOff: null },
  ];
  const max = steps[0].value || 1;
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => {
        const pct = (step.value / max) * 100;
        const isBottleneck = funnel.bottleneck === step.key;
        return (
          <div key={step.key}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-18 text-right shrink-0" style={{ width: 72 }}>{step.label}</span>
              <div className="flex-1 bg-dark-gray rounded-sm h-5 overflow-hidden">
                <div
                  className={clsx('h-full flex items-center px-2 transition-all', isBottleneck ? 'bg-warning/60' : 'bg-acid-green/25')}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                >
                  <span className="text-xs font-mono text-white whitespace-nowrap">{step.value.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              {isBottleneck && <AlertTriangle size={12} className="text-warning shrink-0" />}
            </div>
            {step.dropOff !== null && i < steps.length - 1 && (
              <div className="flex gap-2 mt-0.5">
                <span style={{ width: 72 }} />
                <span className={clsx('text-xs', step.dropOff > 80 ? 'text-danger' : step.dropOff > 50 ? 'text-warning' : 'text-gray-600')}>
                  ↓ -{step.dropOff.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChannelTable({ channels }: { channels: ChannelData[] }) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-gray">
            {['Canal', 'Gasto', 'Receita Real', 'ROAS Real', 'CPA', 'Pedidos'].map(h => (
              <th key={h} className="px-3 py-2 text-xs text-gray-400 text-left font-medium uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map((ch, i) => (
            <tr key={ch.platform} className={clsx('border-b border-dark-gray/40 hover:bg-acid-green/5 transition-colors', i % 2 === 0 ? 'bg-off-black' : 'bg-void-black')}>
              <td className="px-3 py-2.5 font-medium text-white">{PLATFORM_LABELS[ch.platform] || ch.platform}</td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{fmt(ch.spend)}</td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{fmt(ch.revenueReal)}</td>
              <td className={clsx('px-3 py-2.5 font-mono font-semibold', ch.roasReal >= 3 ? 'text-success' : ch.roasReal >= 1.5 ? 'text-warning' : 'text-danger')}>
                {ch.roasReal.toFixed(2)}x
              </td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{fmt(ch.cpa)}</td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{ch.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoasTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-off-black border border-dark-gray p-3 rounded text-xs space-y-1">
      <p className="text-gray-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(2)}x</p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace') || '';
  const [activeDays, setActiveDays] = useState(30);
  const { startDate, endDate } = getDateRange(activeDays);

  const kpisQ = useConsolidatedKPIs(workspaceId, startDate, endDate);
  const channelsQ = useChannelComparison(workspaceId, startDate, endDate);
  const funnelQ = useFunnel(workspaceId, startDate, endDate);
  const roasQ = useRealRoas(workspaceId, startDate, endDate);
  const validationQ = useConversionValidation(workspaceId, startDate, endDate);
  const stalenessQ = useStaleness(workspaceId);

  const kpis = kpisQ.data as KPIData | undefined;

  const dateRangePicker = (
    <div className="flex gap-1 bg-dark-gray rounded p-1">
      {DATE_RANGES.map(r => (
        <button
          key={r.days}
          onClick={() => setActiveDays(r.days)}
          className={clsx('px-3 py-1 text-xs rounded font-medium transition-colors',
            activeDays === r.days ? 'bg-acid-green text-void-black' : 'text-gray-400 hover:text-white'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  if (!workspaceId) {
    return (
      <DashboardLayout>
        <Header title="Dashboard" subtitle="Selecione um cliente" />
        <div className="p-6">
          <Card className="text-center py-16">
            <p className="text-gray-400 mb-4">Selecione um cliente para visualizar o dashboard.</p>
            <Link to="/workspaces" className="text-acid-green text-sm hover:underline">→ Gerenciar clientes</Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header title="Dashboard" subtitle="Performance consolidada cross-platform" actions={dateRangePicker} />

      {stalenessQ.data && stalenessQ.data.length > 0 && (
        <StalenessAlert staleness={stalenessQ.data} />
      )}

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Gasto Total" value={kpis ? fmt(kpis.totalSpend) : '—'} icon={DollarSign} loading={kpisQ.isLoading} />
          <KPICard
            label="Receita Real" value={kpis ? fmt(kpis.totalRevenueReal) : '—'}
            note={kpis ? `Reportado: ${fmt(kpis.totalRevenueReported)}` : undefined}
            icon={ShoppingCart} loading={kpisQ.isLoading}
          />
          <KPICard
            label="ROAS Real" value={kpis ? `${kpis.roasReal.toFixed(2)}x` : '—'}
            change={kpis && kpis.roasDiscrepancy > 5 ? `-${kpis.roasDiscrepancy.toFixed(0)}% vs reportado` : undefined}
            icon={Target} loading={kpisQ.isLoading}
          />
          <KPICard
            label="CPA Médio" value={kpis ? fmt(kpis.avgCPA) : '—'}
            note={kpis ? `${kpis.totalOrders} pedidos · ${kpis.cancelRate.toFixed(1)}% cancel.` : undefined}
            icon={Zap} loading={kpisQ.isLoading}
          />
        </div>

        {/* ROAS Chart + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm font-semibold text-white mb-4">ROAS Real vs Reportado</p>
            {roasQ.isLoading
              ? <div className="h-48 bg-dark-gray animate-pulse rounded" />
              : roasQ.data && roasQ.data.length > 0
              ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={roasQ.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.6} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<RoasTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="roasReal" name="ROAS Real" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="roasReported" name="ROAS Reportado" stroke="#4B5563" fill="#4B5563" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )
              : <div className="h-48 flex items-center justify-center"><p className="text-xs text-gray-600">Sem dados no período</p></div>
            }
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Funil Cross-Platform</p>
              {funnelQ.data?.bottleneck && (
                <span className="text-xs text-warning flex items-center gap-1">
                  <AlertTriangle size={10} />gargalo: {funnelQ.data.bottleneck}
                </span>
              )}
            </div>
            {funnelQ.isLoading
              ? <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-5 bg-dark-gray animate-pulse rounded" />)}</div>
              : funnelQ.data
              ? <FunnelViz funnel={funnelQ.data} />
              : <p className="text-xs text-gray-600 text-center py-8">Sem dados de funil</p>
            }
          </Card>
        </div>

        {/* Channel Comparison */}
        <Card>
          <p className="text-sm font-semibold text-white mb-4">Comparativo de Canais</p>
          {channelsQ.isLoading
            ? <div className="h-48 bg-dark-gray animate-pulse rounded" />
            : channelsQ.data && channelsQ.data.length > 0
            ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={channelsQ.data} barSize={24} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.6} />
                    <XAxis dataKey="platform" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false}
                      tickFormatter={v => PLATFORM_LABELS[v]?.split(' ')[0] || v} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
                    <Tooltip
                      formatter={(v: number, name: string) => [fmt(v), name]}
                      contentStyle={{ background: '#111111', border: '1px solid #1A1A1A', fontSize: 11, borderRadius: 4 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="spend" name="Gasto" fill="#4B5563" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="revenueReal" name="Receita Real" fill="#CCFF00" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <ChannelTable channels={channelsQ.data} />
              </>
            )
            : <p className="text-xs text-gray-600 text-center py-8">Sem dados de canais</p>
          }
        </Card>

        {/* Conversion Validation */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-semibold text-white">Validação de Conversão</p>
            <Info size={14} className="text-gray-600" />
          </div>
          {validationQ.isLoading
            ? <div className="h-20 bg-dark-gray animate-pulse rounded" />
            : validationQ.data
            ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Conversões (Ads)', value: validationQ.data.adsReportedConversions, note: 'Reportado pelas plataformas', color: 'text-info' },
                  { label: 'Transações (GA4)', value: validationQ.data.ga4Transactions, note: `${validationQ.data.discrepancyAdsVsGA4 > 0 ? '-' : '+'}${Math.abs(validationQ.data.discrepancyAdsVsGA4).toFixed(1)}% vs Ads`, color: 'text-warning' },
                  { label: 'Pedidos Reais', value: validationQ.data.realOrders, note: `${validationQ.data.discrepancyAdsVsReal > 0 ? '-' : '+'}${Math.abs(validationQ.data.discrepancyAdsVsReal).toFixed(1)}% vs Ads`, color: 'text-acid-green' },
                ].map(item => (
                  <div key={item.label} className="text-center p-4 bg-dark-gray/30 rounded">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
                    <p className={clsx('text-3xl font-bold font-mono', item.color)}>{item.value.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.note}</p>
                  </div>
                ))}
              </div>
            )
            : <p className="text-xs text-gray-600 text-center py-8">Sem dados de validação</p>
          }
        </Card>
      </div>
    </DashboardLayout>
  );
}
