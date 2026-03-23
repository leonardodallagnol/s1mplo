import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Processor('sync')
export class SyncProcessor {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(private syncService: SyncService) {}

  @Process('sync-connection')
  async handleSyncConnection(job: Job<{ connectionId: string }>): Promise<void> {
    const { connectionId } = job.data;
    this.logger.log(
      `Processing sync-connection job ${job.id} for connection ${connectionId} (attempt ${job.attemptsMade + 1})`,
    );
    await this.syncService.syncConnection(connectionId);
  }

  @Process('sync-all-ad-metrics')
  async handleSyncAllAdMetrics(_job: Job): Promise<void> {
    this.logger.log('Processing sync-all-ad-metrics cron job');
    await this.syncService.triggerAllAdMetricsSync();
  }

  @Process('sync-all-analytics')
  async handleSyncAllAnalytics(_job: Job): Promise<void> {
    this.logger.log('Processing sync-all-analytics cron job');
    await this.syncService.triggerAllAnalyticsSync();
  }

  @Process('sync-all-orders')
  async handleSyncAllOrders(_job: Job): Promise<void> {
    this.logger.log('Processing sync-all-orders cron job');
    await this.syncService.triggerAllOrdersSync();
  }

  @Process('ai:scheduled-analysis')
  async handleAiScheduledAnalysis(_job: Job): Promise<void> {
    this.logger.log('Processing ai:scheduled-analysis cron job');
    // AI analysis will be implemented in a future phase
  }
}
