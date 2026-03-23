import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly slackWebhookUrl?: string;
  private readonly discordWebhookUrl?: string;

  constructor(private configService: ConfigService) {
    this.slackWebhookUrl = configService.get<string>('SLACK_WEBHOOK_URL');
    this.discordWebhookUrl = configService.get<string>('DISCORD_WEBHOOK_URL');
  }

  async sendCriticalAlert(message: string, data: object): Promise<void> {
    const fullMessage = `🚨 S1mplo Alert: ${message}`;
    const payload = { message: fullMessage, data };

    if (this.slackWebhookUrl) {
      await this.sendToSlack(fullMessage, data);
    } else if (this.discordWebhookUrl) {
      await this.sendToDiscord(fullMessage, data);
    } else {
      this.logger.warn(`[ALERT] ${fullMessage}`, data);
    }
  }

  private async sendToSlack(message: string, data: object): Promise<void> {
    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${message}*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`${JSON.stringify(data, null, 2)}\`\`\``,
          },
        },
      ];

      await axios.post(this.slackWebhookUrl!, { blocks });
    } catch (err: any) {
      this.logger.error('Failed to send Slack notification', err.message);
    }
  }

  private async sendToDiscord(message: string, data: object): Promise<void> {
    try {
      const embed = {
        title: message,
        description: `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
        color: 0xff0000,
        timestamp: new Date().toISOString(),
      };

      await axios.post(this.discordWebhookUrl!, { embeds: [embed] });
    } catch (err: any) {
      this.logger.error('Failed to send Discord notification', err.message);
    }
  }
}
