import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;

  // Price IDs do Stripe (devem ser criados no dashboard do Stripe)
  // Formato: STRIPE_PRICE_{PLAN}_{CYCLE}
  private readonly PRICE_IDS: Record<string, Record<string, string>> = {
    STARTER: {
      MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
      YEARLY: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
    },
    PRO: {
      MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
      YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
    },
    AGENCY: {
      MONTHLY: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_agency_monthly',
      YEARLY: process.env.STRIPE_PRICE_AGENCY_YEARLY || 'price_agency_yearly',
    },
  };

  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY', '');
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCustomer(data: {
    name: string;
    email: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        name: data.name,
        email: data.email,
        metadata: data.metadata || {},
      });
    } catch (error: any) {
      this.logger.error('Failed to create Stripe customer', error.message);
      throw new Error('Failed to create payment customer');
    }
  }

  async createCheckoutSession(data: {
    customerId: string;
    plan: string;
    cycle?: 'MONTHLY' | 'YEARLY';
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; sessionId: string }> {
    const priceId = this.getPriceId(data.plan, data.cycle || 'MONTHLY');
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: data.customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: data.successUrl || `${frontendUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: data.cancelUrl || `${frontendUrl}/billing?canceled=true`,
        metadata: data.metadata || {},
        subscription_data: {
          metadata: data.metadata || {},
        },
        allow_promotion_codes: true,
      });

      return { url: session.url || '', sessionId: session.id };
    } catch (error: any) {
      this.logger.error('Failed to create Stripe checkout session', error.message);
      throw new Error('Failed to create checkout session');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error: any) {
      this.logger.error('Failed to cancel Stripe subscription', error.message);
      throw new Error('Failed to cancel subscription');
    }
  }

  async updateSubscription(subscriptionId: string, plan: string, cycle: string = 'MONTHLY'): Promise<void> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const priceId = this.getPriceId(plan, cycle as 'MONTHLY' | 'YEARLY');

      await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: { plan },
      });
    } catch (error: any) {
      this.logger.error('Failed to update Stripe subscription', error.message);
      throw new Error('Failed to update subscription');
    }
  }

  async createPortalSession(customerId: string, returnUrl?: string): Promise<{ url: string }> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${frontendUrl}/billing`,
      });
      return { url: session.url };
    } catch (error: any) {
      this.logger.error('Failed to create Stripe portal session', error.message);
      throw new Error('Failed to create portal session');
    }
  }

  constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  private getPriceId(plan: string, cycle: 'MONTHLY' | 'YEARLY'): string {
    return this.PRICE_IDS[plan]?.[cycle] || this.PRICE_IDS['STARTER']['MONTHLY'];
  }
}
