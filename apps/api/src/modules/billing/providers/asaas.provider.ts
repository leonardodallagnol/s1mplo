import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  description: string;
}

export interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    status: string;
    value: number;
    billingType: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: string;
    value: number;
  };
}

@Injectable()
export class AsaasProvider {
  private readonly logger = new Logger(AsaasProvider.name);
  private readonly client: AxiosInstance;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    const baseURL = this.isProduction
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    this.client = axios.create({
      baseURL,
      headers: {
        access_token: configService.get<string>('ASAAS_API_KEY', ''),
        'Content-Type': 'application/json',
      },
    });
  }

  async createCustomer(data: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
  }): Promise<AsaasCustomer> {
    try {
      const response = await this.client.post('/customers', {
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        phone: data.phone,
        notificationDisabled: false,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to create Asaas customer', error?.response?.data);
      throw new Error('Failed to create payment customer');
    }
  }

  async createSubscription(data: {
    customerId: string;
    plan: string;
    billingType?: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    cycle?: 'MONTHLY' | 'YEARLY';
  }): Promise<AsaasSubscription> {
    const planValues = this.getPlanValue(data.plan, data.cycle || 'MONTHLY');

    try {
      const response = await this.client.post('/subscriptions', {
        customer: data.customerId,
        billingType: data.billingType || 'PIX',
        value: planValues.value,
        nextDueDate: this.getNextDueDate(),
        cycle: data.cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        description: `S1mplo - Plano ${data.plan}`,
        externalReference: data.plan,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to create Asaas subscription', error?.response?.data);
      throw new Error('Failed to create subscription');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.client.delete(`/subscriptions/${subscriptionId}`);
    } catch (error: any) {
      this.logger.error('Failed to cancel Asaas subscription', error?.response?.data);
      throw new Error('Failed to cancel subscription');
    }
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    try {
      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get Asaas subscription', error?.response?.data);
      throw new Error('Failed to get subscription');
    }
  }

  async createPaymentLink(data: {
    customerId: string;
    plan: string;
    cycle?: 'MONTHLY' | 'YEARLY';
    successUrl?: string;
  }): Promise<{ url: string; id: string }> {
    const planValues = this.getPlanValue(data.plan, data.cycle || 'MONTHLY');

    try {
      const response = await this.client.post('/paymentLinks', {
        name: `S1mplo - Plano ${data.plan}`,
        description: `Assine o plano ${data.plan} do S1mplo`,
        value: planValues.value,
        billingType: 'UNDEFINED', // permite escolha do cliente
        chargeType: 'RECURRENT',
        subscriptionCycle: data.cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        customer: data.customerId,
        callback: {
          successUrl:
            data.successUrl ||
            `${this.configService.get('FRONTEND_URL')}/billing?success=true`,
          autoRedirect: true,
        },
      });
      return { url: response.data.url, id: response.data.id };
    } catch (error: any) {
      this.logger.error('Failed to create Asaas payment link', error?.response?.data);
      throw new Error('Failed to create payment link');
    }
  }

  validateWebhookToken(token: string): boolean {
    const expectedToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN', '');
    return token === expectedToken;
  }

  private getPlanValue(plan: string, cycle: string): { value: number } {
    const monthlyValues: Record<string, number> = {
      STARTER: 197,
      PRO: 397,
      AGENCY: 697,
    };

    const yearlyValues: Record<string, number> = {
      STARTER: 197 * 10, // 2 meses grátis
      PRO: 397 * 10,
      AGENCY: 697 * 10,
    };

    const values = cycle === 'YEARLY' ? yearlyValues : monthlyValues;
    return { value: values[plan] || 197 };
  }

  private getNextDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }
}
