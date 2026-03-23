import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../../common/guards/workspace-access.guard';

@Controller('workspaces/:id/dashboard')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getConsolidatedKPIs(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getConsolidatedKPIs(id, startDate, endDate);
  }

  @Get('channels')
  getChannelComparison(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getChannelComparison(id, startDate, endDate);
  }

  @Get('funnel')
  getFunnel(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getFunnel(id, startDate, endDate);
  }

  @Get('real-roas')
  getRealRoas(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getRealRoas(id, startDate, endDate);
  }

  @Get('validation')
  getConversionValidation(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getConversionValidation(id, startDate, endDate);
  }

  @Get('traffic')
  getTrafficBySource(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getTrafficBySource(id, startDate, endDate);
  }
}
