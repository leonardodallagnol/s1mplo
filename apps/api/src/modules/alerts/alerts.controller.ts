import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../../common/guards/workspace-access.guard';

@Controller('workspaces/:id/alerts')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  getAlerts(
    @Param('id') id: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.alertsService.getAlerts(id, unreadOnly === 'true');
  }

  @Put(':alertId/read')
  markAlertRead(
    @Param('id') id: string,
    @Param('alertId') alertId: string,
  ) {
    return this.alertsService.markAlertRead(id, alertId);
  }

  @Get('staleness')
  getStaleness(@Param('id') id: string) {
    return this.alertsService.getStaleness(id);
  }
}
