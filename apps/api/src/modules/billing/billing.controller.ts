import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Headers,
  UseGuards,
  Request,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Plan } from '@prisma/client';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── GET SUBSCRIPTION STATUS ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@Request() req: any) {
    return this.billingService.getSubscription(req.user.id);
  }

  // ─── CHECK ACCESS (usado por guards internos) ─────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('access')
  checkAccess(@Request() req: any) {
    return this.billingService.checkAccess(req.user.id);
  }

  // ─── CREATE CHECKOUT SESSION ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @Request() req: any,
    @Body() body: { plan: Plan; cycle?: 'MONTHLY' | 'YEARLY' },
  ) {
    if (!body.plan) {
      throw new BadRequestException('Plan is required');
    }
    return this.billingService.createCheckout(req.user.id, body.plan, body.cycle);
  }

  // ─── STRIPE PORTAL (gerenciar pagamento) ─────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  createPortalSession(@Request() req: any) {
    return this.billingService.createStripePortalSession(req.user.id);
  }

  // ─── CHANGE PLAN ──────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Put('plan')
  changePlan(@Request() req: any, @Body() body: { plan: Plan }) {
    if (!body.plan) {
      throw new BadRequestException('Plan is required');
    }
    return this.billingService.changePlan(req.user.id, body.plan);
  }

  // ─── CANCEL SUBSCRIPTION ──────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancelSubscription(@Request() req: any) {
    return this.billingService.cancelSubscription(req.user.id);
  }

  // ─── WEBHOOK: ASAAS ──────────────────────────────────────────────────────────
  // Rota pública — validação via token no header

  @Post('webhook/asaas')
  handleAsaasWebhook(
    @Body() payload: any,
    @Headers('asaas-access-token') token: string,
  ) {
    return this.billingService.handleAsaasWebhook(payload, token);
  }

  // ─── WEBHOOK: STRIPE ──────────────────────────────────────────────────────────
  // Rota pública — validação via Stripe signature

  @Post('webhook/stripe')
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }
    return this.billingService.handleStripeWebhook(rawBody, signature);
  }
}
