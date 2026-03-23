import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SyncService } from './sync.service';
import { SyncProcessor } from './sync.processor';
import { NotificationService } from './notification.service';
import { MetaAdsAdapter } from './adapters/meta-ads.adapter';
import { GoogleAdsAdapter } from './adapters/google-ads.adapter';
import { GoogleAnalyticsAdapter } from './adapters/google-analytics.adapter';
import { NuvemshopAdapter } from './adapters/nuvemshop.adapter';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { TikTokAdsAdapter } from './adapters/tiktok-ads.adapter';
import { MercadoLivreProvider } from '../oauth/providers/mercadolivre.provider';
import { OAuthModule } from '../oauth/oauth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'sync' }),
    PrismaModule,
    OAuthModule,
  ],
  providers: [
    SyncService,
    SyncProcessor,
    NotificationService,
    MetaAdsAdapter,
    GoogleAdsAdapter,
    GoogleAnalyticsAdapter,
    NuvemshopAdapter,
    MercadoLivreAdapter,
    TikTokAdsAdapter,
  ],
  exports: [SyncService],
})
export class SyncModule implements OnModuleInit {
  private readonly logger = new Logger(SyncModule.name);

  constructor(@InjectQueue('sync') private syncQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.setupCronJobs();
  }

  private async setupCronJobs(): Promise<void> {
    // Remove existing repeatable jobs to avoid duplicates on restart
    const repeatableJobs = await this.syncQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.syncQueue.removeRepeatableByKey(job.key);
    }

    // sync:ad-metrics — every 6 hours
    await this.syncQueue.add(
      'sync-all-ad-metrics',
      {},
      {
        repeat: { cron: '0 */6 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );

    // sync:analytics — every 6 hours (offset by 1 hour)
    await this.syncQueue.add(
      'sync-all-analytics',
      {},
      {
        repeat: { cron: '0 1,7,13,19 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );

    // sync:orders — every 2 hours
    await this.syncQueue.add(
      'sync-all-orders',
      {},
      {
        repeat: { cron: '0 */2 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );

    // ai:scheduled-analysis — daily at 7am
    await this.syncQueue.add(
      'ai:scheduled-analysis',
      {},
      {
        repeat: { cron: '0 7 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );

    this.logger.log('Cron jobs registered: ad-metrics(6h), analytics(6h), orders(2h), ai-analysis(7am daily)');
  }
}
