import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AsaasProvider } from './providers/asaas.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [BillingController],
  providers: [BillingService, AsaasProvider, StripeProvider],
  exports: [BillingService],
})
export class BillingModule {}
