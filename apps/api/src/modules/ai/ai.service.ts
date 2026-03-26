import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { InsightType, InsightSeverity, AlertType } from '@prisma/client';

interface AIInsightResult {
  title: string;
  severity: string;
  summary: string;
  detail: string;
  recommendation: string;
  metrics: Record<string, string | number>;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly client: Anthropic;

  constructor(
    private prisma: PrismaService,
    private dashboardService: DashboardService,
    private configService: ConfigService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  private async getModelConfig(userId: string): Promise<{ model: string; maxTokensAnalysis: number; maxTokensCopilot: number }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true },
    });

    const plan = subscription?.plan || 'TRIAL';
    const isPremium = plan === 'PRO' || plan === 'AGENCY';

    return isPremium
      ? { model: 'claude-sonnet-4-6',          maxTokensAnalysis: 1500, maxTokensCopilot: 1024 }
      : { model: 'claude-haiku-4-5-20251001',   maxTokensAnalysis: 800,  maxTokensCopilot: 500  };
  }

  private async checkAndConsumeAICredit(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) throw new ForbiddenException('No subscription found');
    if (subscription.aiCredits === -1) return; // ilimitado
    if (subscription.aiCredits <= 0) {
      throw new ForbiddenException(
        `Você usou todos os créditos de IA deste mês. Faça upgrade para Pro ou Agency para créditos ilimitados.`,
      );
    }
    await this.prisma.subscription.update({
      where: { userId },
      data: { aiCredits: { decrement: 1 } },
    });
  }

  async analyzeWorkspace(
    workspaceId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    await this.checkAndConsumeAICredit(userId);
    const { model, maxTokensAnalysis } = await this.getModelConfig(userId);

    const [kpis, channels, funnel, validation, traffic] = await Promise.all([
      this.dashboardService.getConsolidatedKPIs(workspaceId, startDate, endDate),
      this.dashboardService.getChannelComparison(workspaceId, startDate, endDate),
      this.dashboardService.getFunnel(workspaceId, startDate, endDate),
      this.dashboardService.getConversionValidation(workspaceId, startDate, endDate),
      this.dashboardService.getTrafficBySource(workspaceId, startDate, endDate),
    ]);

    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const channelTable = channels
      .map(
        c =>
          `${c.platform} | ${formatCurrency(c.spend)} | ${formatCurrency(c.revenueReported)} | ${c.roasReported.toFixed(2)}x | ${c.clicks} | ${c.conversions}`,
      )
      .join('\n');

    const funnelSteps = funnel.steps;
    const funnelLines = [
      `Impressões: ${funnelSteps.impressions.toLocaleString('pt-BR')} (-${funnel.dropOffs.impressionsToClicks.toFixed(1)}% → cliques)`,
      `Cliques: ${funnelSteps.clicks.toLocaleString('pt-BR')} (-${funnel.dropOffs.clicksToSessions.toFixed(1)}% → sessões)`,
      `Sessões: ${funnelSteps.sessions.toLocaleString('pt-BR')} (-${funnel.dropOffs.sessionsToAddToCart.toFixed(1)}% → cart)`,
      `Carrinho: ${funnelSteps.addToCarts.toLocaleString('pt-BR')} (-${funnel.dropOffs.addToCartToCheckout.toFixed(1)}% → checkout)`,
      `Checkout: ${funnelSteps.checkouts.toLocaleString('pt-BR')} (-${funnel.dropOffs.checkoutToOrders.toFixed(1)}% → pedidos)`,
      `Pedidos pagos: ${funnelSteps.orders.toLocaleString('pt-BR')}`,
    ].join('\n');

    const trafficLines = traffic
      .slice(0, 10)
      .map(
        t =>
          `${t.source}/${t.medium}: ${t.sessions} sessões | ${t.transactions} transações | ${formatCurrency(t.revenue)} | ${t.conversionRate.toFixed(2)}% CR`,
      )
      .join('\n');

    const prompt = `You are S1mplo Copilot, an AI performance analyst for Brazilian e-commerce managers.

Analyze the following cross-platform data for the period ${start} to ${end}:

## Ad Spend & Reported Performance
Platform | Spend | Reported Revenue | Reported ROAS | Clicks | Conversions
${channelTable || 'No data available'}

## Real E-commerce Revenue (Nuvemshop/Mercado Livre)
Total real revenue: ${formatCurrency(kpis.totalRevenueReal)}
ROAS real: ${kpis.roasReal.toFixed(2)}x (vs reported: ${kpis.roasReported.toFixed(2)}x)
Discrepancy: ${kpis.roasDiscrepancy.toFixed(1)}%
Orders: ${kpis.totalOrders} | Avg ticket: ${formatCurrency(kpis.avgTicket)} | Cancel rate: ${kpis.cancelRate.toFixed(1)}%

## Conversion Funnel
${funnelLines}
Bottleneck identified: ${funnel.bottleneck}

## Conversion Validation
Ads reported conversions: ${validation.adsReportedConversions}
GA4 transactions: ${validation.ga4Transactions}
Real orders: ${validation.realOrders}
Discrepancy Ads vs GA4: ${validation.discrepancyAdsVsGA4.toFixed(1)}%
Discrepancy Ads vs Real: ${validation.discrepancyAdsVsReal.toFixed(1)}%

## Attribution (GA4)
${trafficLines || 'No GA4 data available'}

Respond ONLY with valid JSON in this exact format:
{
  "title": "short title (max 10 words)",
  "severity": "INFO|WARNING|CRITICAL|OPPORTUNITY",
  "summary": "2-3 sentences max",
  "detail": "detailed analysis in Portuguese (pt-BR), 3-5 paragraphs, reference specific numbers",
  "recommendation": "concrete actionable recommendation in Portuguese, 1-3 bullet points starting with verbs",
  "metrics": { "key": "value" }
}`;

    let parsed: AIInsightResult;

    try {
      const message = await this.client.messages.create({
        model,
        max_tokens: maxTokensAnalysis,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      parsed = JSON.parse(text);
    } catch (err: any) {
      this.logger.error('AI analysis failed', err.message);
      throw err;
    }

    const severity = (parsed.severity as InsightSeverity) || InsightSeverity.INFO;

    const insight = await this.prisma.aIInsight.create({
      data: {
        workspaceId,
        type: InsightType.PERFORMANCE_ANALYSIS,
        severity,
        title: parsed.title,
        summary: parsed.summary,
        detail: parsed.detail,
        recommendation: parsed.recommendation,
        dataSnapshot: parsed.metrics as any,
        periodStart: new Date(start),
        periodEnd: new Date(end),
      },
    });

    // Create alert for CRITICAL or WARNING
    if (severity === InsightSeverity.CRITICAL || severity === InsightSeverity.WARNING) {
      await this.prisma.alert.create({
        data: {
          workspaceId,
          type: AlertType.ROAS_DROP,
          message: `[${severity}] ${parsed.title}: ${parsed.summary}`,
          metadata: { insightId: insight.id },
        },
      });
    }

    return insight;
  }

  async askCopilot(
    workspaceId: string,
    userId: string,
    question: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    await this.checkAndConsumeAICredit(userId);
    const { model, maxTokensCopilot } = await this.getModelConfig(userId);

    const [kpis, channels] = await Promise.all([
      this.dashboardService.getConsolidatedKPIs(workspaceId, startDate, endDate),
      this.dashboardService.getChannelComparison(workspaceId, startDate, endDate),
    ]);

    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const channelSummary = channels
      .map(
        c =>
          `${c.platform}: gasto ${formatCurrency(c.spend)}, receita real ${formatCurrency(c.revenueReal)}, ROAS real ${c.roasReal.toFixed(2)}x`,
      )
      .join('\n');

    const context = `KPIs gerais:
- Gasto total: ${formatCurrency(kpis.totalSpend)}
- Receita real: ${formatCurrency(kpis.totalRevenueReal)}
- ROAS real: ${kpis.roasReal.toFixed(2)}x (reportado: ${kpis.roasReported.toFixed(2)}x)
- Pedidos: ${kpis.totalOrders}
- CPA médio: ${formatCurrency(kpis.avgCPA)}
- Taxa de cancelamento: ${kpis.cancelRate.toFixed(1)}%

Canais:
${channelSummary || 'Sem dados de canais'}`;

    const prompt = `You are S1mplo Copilot, an AI assistant for Brazilian e-commerce performance analysis. Answer in Portuguese (pt-BR).

Given this data:
${context}

User question: ${question}

Answer concisely and practically, referencing specific numbers from the data. Focus on actionable insights.`;

    const message = await this.client.messages.create({
      model,
      max_tokens: maxTokensCopilot,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  async getInsights(workspaceId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [insights, total] = await Promise.all([
      this.prisma.aIInsight.findMany({
        where: { workspaceId, isDismissed: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aIInsight.count({
        where: { workspaceId, isDismissed: false },
      }),
    ]);

    return { insights, total, page, limit };
  }

  async markInsightRead(workspaceId: string, insightId: string) {
    const insight = await this.prisma.aIInsight.findFirst({
      where: { id: insightId, workspaceId },
    });

    if (!insight) throw new NotFoundException('Insight not found');

    return this.prisma.aIInsight.update({
      where: { id: insightId },
      data: { isRead: true },
    });
  }

  async dismissInsight(workspaceId: string, insightId: string) {
    const insight = await this.prisma.aIInsight.findFirst({
      where: { id: insightId, workspaceId },
    });

    if (!insight) throw new NotFoundException('Insight not found');

    return this.prisma.aIInsight.update({
      where: { id: insightId },
      data: { isDismissed: true },
    });
  }

  async updateInsight(
    workspaceId: string,
    insightId: string,
    body: { read?: boolean; dismissed?: boolean },
  ) {
    const insight = await this.prisma.aIInsight.findFirst({
      where: { id: insightId, workspaceId },
    });

    if (!insight) throw new NotFoundException('Insight not found');

    return this.prisma.aIInsight.update({
      where: { id: insightId },
      data: {
        ...(body.read !== undefined ? { isRead: body.read } : {}),
        ...(body.dismissed !== undefined ? { isDismissed: body.dismissed } : {}),
      },
    });
  }
}
