import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan, SubscriptionStatus, BillingGateway } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasProvider, AsaasWebhookPayload } from './providers/asaas.provider';
import { StripeProvider } from './providers/stripe.provider';

const PLAN_CONFIG: Record<
  Plan,
  { maxWorkspaces: number; aiCredits: number; label: string }
> = {
  TRIAL:   { maxWorkspaces: 10, aiCredits: -1,  label: 'Trial (14 dias)' },
  STARTER: { maxWorkspaces: 3,  aiCredits: 10,  label: 'Starter' },
  PRO:     { maxWorkspaces: 10, aiCredits: -1,  label: 'Pro' },
  AGENCY:  { maxWorkspaces: -1, aiCredits: -1,  label: 'Agency' },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private asaas: AsaasProvider,
    private stripe: StripeProvider,
    private configService: ConfigService,
  ) {}

  // ─── GET SUBSCRIPTION ────────────────────────────────────────────────────────

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, country: true } } },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    const isTrialActive = subscription.plan === 'TRIAL' && subscription.trialEndsAt
      ? subscription.trialEndsAt > now
      : false;
    const trialDaysLeft = isTrialActive && subscription.trialEndsAt
      ? Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Verifica se trial expirou sem upgrade
    if (
      subscription.plan === 'TRIAL' &&
      subscription.trialEndsAt &&
      subscription.trialEndsAt < now &&
      subscription.status === 'TRIAL'
    ) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { status: 'CANCELED' },
      });
    }

    const config = PLAN_CONFIG[subscription.plan];

    return {
      ...subscription,
      planLabel: config.label,
      maxWorkspaces: config.maxWorkspaces,
      aiCreditsLimit: config.aiCredits,
      isTrialActive,
      trialDaysLeft,
    };
  }

  // ─── CHECK TRIAL STATUS ───────────────────────────────────────────────────────

  async checkAccess(userId: string): Promise<{ hasAccess: boolean; reason?: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return { hasAccess: false, reason: 'No subscription found' };
    }

    const now = new Date();

    if (subscription.status === 'ACTIVE') {
      return { hasAccess: true };
    }

    if (subscription.plan === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt > now) {
      return { hasAccess: true };
    }

    if (subscription.status === 'PAST_DUE') {
      return { hasAccess: true }; // mantém acesso durante inadimplência curta
    }

    if (subscription.status === 'SUSPENDED') {
      return { hasAccess: false, reason: 'Account suspended due to non-payment' };
    }

    if (subscription.plan === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt < now) {
      return { hasAccess: false, reason: 'Trial period has ended. Please choose a plan.' };
    }

    if (subscription.status === 'CANCELED') {
      return { hasAccess: false, reason: 'Subscription canceled. Please reactivate.' };
    }

    return { hasAccess: false, reason: 'Subscription inactive' };
  }

  // ─── CHECK AI CREDITS ─────────────────────────────────────────────────────────

  async checkAndConsumeAICredit(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new ForbiddenException('No subscription found');
    }

    // -1 = ilimitado
    if (subscription.aiCredits === -1) return;

    if (subscription.aiCredits <= 0) {
      throw new ForbiddenException(
        `You've used all your AI credits for this month. Upgrade to Pro or Agency for unlimited credits.`,
      );
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: { aiCredits: { decrement: 1 } },
    });
  }

  // ─── CREATE CHECKOUT ──────────────────────────────────────────────────────────

  async createCheckout(
    userId: string,
    plan: Plan,
    cycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
  ) {
    if (plan === 'TRIAL') {
      throw new BadRequestException('Cannot checkout to Trial plan');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const { user } = subscription;
    const gateway = subscription.gateway;

    if (gateway === 'ASAAS') {
      return this.createAsaasCheckout(userId, user, subscription, plan, cycle);
    } else {
      return this.createStripeCheckout(userId, user, subscription, plan, cycle);
    }
  }

  private async createAsaasCheckout(
    userId: string,
    user: any,
    subscription: any,
    plan: Plan,
    cycle: 'MONTHLY' | 'YEARLY',
  ) {
    let customerId = subscription.gatewayCustomerId;

    if (!customerId) {
      const customer = await this.asaas.createCustomer({
        name: user.name,
        email: user.email,
      });
      customerId = customer.id;
      await this.prisma.subscription.update({
        where: { userId },
        data: { gatewayCustomerId: customerId },
      });
    }

    const { url } = await this.asaas.createPaymentLink({
      customerId,
      plan,
      cycle,
    });

    return { url, gateway: 'ASAAS' };
  }

  private async createStripeCheckout(
    userId: string,
    user: any,
    subscription: any,
    plan: Plan,
    cycle: 'MONTHLY' | 'YEARLY',
  ) {
    let customerId = subscription.gatewayCustomerId;

    if (!customerId) {
      const customer = await this.stripe.createCustomer({
        name: user.name,
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.subscription.update({
        where: { userId },
        data: { gatewayCustomerId: customerId },
      });
    }

    const { url } = await this.stripe.createCheckoutSession({
      customerId,
      plan,
      cycle,
      metadata: { userId, plan, cycle },
    });

    return { url, gateway: 'STRIPE' };
  }

  // ─── CHANGE PLAN ──────────────────────────────────────────────────────────────

  async changePlan(userId: string, newPlan: Plan) {
    if (newPlan === 'TRIAL') {
      throw new BadRequestException('Cannot switch to Trial plan');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const config = PLAN_CONFIG[newPlan];
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan: newPlan,
        status: 'ACTIVE',
        maxWorkspaces: config.maxWorkspaces,
        aiCredits: config.aiCredits,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    return { success: true, plan: newPlan };
  }

  // ─── CANCEL SUBSCRIPTION ──────────────────────────────────────────────────────

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.gatewaySubscriptionId) {
      if (subscription.gateway === 'ASAAS') {
        await this.asaas.cancelSubscription(subscription.gatewaySubscriptionId);
      } else {
        await this.stripe.cancelSubscription(subscription.gatewaySubscriptionId);
      }
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELED' },
    });

    return { success: true };
  }

  // ─── STRIPE PORTAL ────────────────────────────────────────────────────────────

  async createStripePortalSession(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.gatewayCustomerId) {
      throw new BadRequestException('No payment customer found');
    }

    if (subscription.gateway !== 'STRIPE') {
      throw new BadRequestException('Portal only available for Stripe customers');
    }

    return this.stripe.createPortalSession(subscription.gatewayCustomerId);
  }

  // ─── WEBHOOK: ASAAS ──────────────────────────────────────────────────────────

  async handleAsaasWebhook(payload: AsaasWebhookPayload, token: string) {
    if (!this.asaas.validateWebhookToken(token)) {
      throw new ForbiddenException('Invalid webhook token');
    }

    this.logger.log(`Asaas webhook: ${payload.event}`);

    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await this.handleAsaasPaymentSuccess(payload);
        break;
      case 'PAYMENT_OVERDUE':
        await this.handleAsaasPaymentOverdue(payload);
        break;
      case 'PAYMENT_DELETED':
      case 'SUBSCRIPTION_DELETED':
        await this.handleAsaasSubscriptionCanceled(payload);
        break;
      default:
        this.logger.debug(`Unhandled Asaas event: ${payload.event}`);
    }

    return { received: true };
  }

  private async handleAsaasPaymentSuccess(payload: AsaasWebhookPayload) {
    const customerId = payload.payment?.customer || payload.subscription?.customer;
    if (!customerId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId },
    });
    if (!subscription) return;

    const externalRef = payload.payment?.subscription || payload.subscription?.id;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        gatewaySubscriptionId: externalRef || subscription.gatewaySubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  private async handleAsaasPaymentOverdue(payload: AsaasWebhookPayload) {
    const customerId = payload.payment?.customer;
    if (!customerId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId },
    });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });
  }

  private async handleAsaasSubscriptionCanceled(payload: AsaasWebhookPayload) {
    const customerId = payload.payment?.customer || payload.subscription?.customer;
    if (!customerId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId },
    });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELED' },
    });
  }

  // ─── WEBHOOK: STRIPE ──────────────────────────────────────────────────────────

  async handleStripeWebhook(payload: Buffer, signature: string) {
    let event: any;

    try {
      event = this.stripe.constructWebhookEvent(payload, signature);
    } catch (error: any) {
      this.logger.error('Invalid Stripe webhook signature', error.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handleStripePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleStripePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleStripeSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleStripeSubscriptionUpdated(event.data.object);
        break;
      case 'checkout.session.completed':
        await this.handleStripeCheckoutCompleted(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  private async handleStripePaymentSucceeded(invoice: any) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId, gateway: 'STRIPE' },
    });
    if (!subscription) return;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        gatewaySubscriptionId: subscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  private async handleStripePaymentFailed(invoice: any) {
    const customerId = invoice.customer;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId, gateway: 'STRIPE' },
    });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });
  }

  private async handleStripeSubscriptionDeleted(stripeSubscription: any) {
    const customerId = stripeSubscription.customer;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId, gateway: 'STRIPE' },
    });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELED' },
    });
  }

  private async handleStripeSubscriptionUpdated(stripeSubscription: any) {
    const customerId = stripeSubscription.customer;
    const metadata = stripeSubscription.metadata || {};

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewayCustomerId: customerId, gateway: 'STRIPE' },
    });
    if (!subscription) return;

    if (metadata.plan && PLAN_CONFIG[metadata.plan as Plan]) {
      const newPlan = metadata.plan as Plan;
      const config = PLAN_CONFIG[newPlan];

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: newPlan,
          maxWorkspaces: config.maxWorkspaces,
          aiCredits: config.aiCredits,
        },
      });
    }
  }

  private async handleStripeCheckoutCompleted(session: any) {
    const customerId = session.customer;
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const plan = metadata.plan as Plan;

    if (!userId || !plan || !PLAN_CONFIG[plan]) return;

    const config = PLAN_CONFIG[plan];
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        status: 'ACTIVE',
        gatewayCustomerId: customerId,
        gatewaySubscriptionId: session.subscription,
        maxWorkspaces: config.maxWorkspaces,
        aiCredits: config.aiCredits,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  // ─── RESET MONTHLY AI CREDITS ─────────────────────────────────────────────────

  async resetMonthlyAICredits() {
    // Chamado via cron no início de cada período
    await this.prisma.subscription.updateMany({
      where: {
        plan: 'STARTER',
        status: 'ACTIVE',
      },
      data: {
        aiCredits: PLAN_CONFIG['STARTER'].aiCredits,
      },
    });
    this.logger.log('Monthly AI credits reset for Starter plans');
  }
}
