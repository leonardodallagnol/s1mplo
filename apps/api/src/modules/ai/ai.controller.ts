import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../../common/guards/workspace-access.guard';

@Controller('workspaces/:id/ai')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('analyze')
  analyzeWorkspace(
    @Param('id') id: string,
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.aiService.analyzeWorkspace(id, req.user.id, startDate, endDate);
  }

  @Post('ask')
  askCopilot(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { question: string; startDate?: string; endDate?: string },
  ) {
    return this.aiService.askCopilot(
      id,
      req.user.id,
      body.question,
      body.startDate,
      body.endDate,
    );
  }

  @Get('insights')
  getInsights(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiService.getInsights(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Put('insights/:insightId')
  updateInsight(
    @Param('id') id: string,
    @Param('insightId') insightId: string,
    @Body() body: { read?: boolean; dismissed?: boolean },
  ) {
    return this.aiService.updateInsight(id, insightId, body);
  }
}
