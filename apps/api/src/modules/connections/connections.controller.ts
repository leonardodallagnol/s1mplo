import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../../common/guards/workspace-access.guard';

@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
@Controller('workspaces/:id/connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get()
  findAll(@Param('id') workspaceId: string) {
    return this.connectionsService.findAll(workspaceId);
  }

  @Delete(':connectionId')
  remove(
    @Param('id') workspaceId: string,
    @Param('connectionId') connectionId: string,
  ) {
    return this.connectionsService.remove(workspaceId, connectionId);
  }

  @Post(':connectionId/sync')
  triggerSync(
    @Param('id') workspaceId: string,
    @Param('connectionId') connectionId: string,
  ) {
    return this.connectionsService.triggerSync(workspaceId, connectionId);
  }
}
