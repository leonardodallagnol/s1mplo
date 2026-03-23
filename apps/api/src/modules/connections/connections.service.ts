import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.connection.findMany({
      where: { workspaceId },
      select: {
        id: true,
        platform: true,
        platformAccountId: true,
        platformAccountName: true,
        status: true,
        lastSyncAt: true,
        lastSyncError: true,
        createdAt: true,
        scopes: true,
      },
    });
  }

  async create(workspaceId: string, dto: CreateConnectionDto) {
    const existing = await this.prisma.connection.findUnique({
      where: {
        workspaceId_platform_platformAccountId: {
          workspaceId,
          platform: dto.platform,
          platformAccountId: dto.platformAccountId,
        },
      },
    });

    if (existing) {
      // Update instead of throwing error (re-connect)
      return this.prisma.connection.update({
        where: { id: existing.id },
        data: {
          accessToken: dto.accessToken,
          refreshToken: dto.refreshToken,
          tokenExpiresAt: dto.tokenExpiresAt,
          scopes: dto.scopes,
          platformAccountName: dto.platformAccountName,
          status: 'ACTIVE',
          lastSyncError: null,
        },
      });
    }

    return this.prisma.connection.create({
      data: {
        workspaceId,
        platform: dto.platform,
        platformAccountId: dto.platformAccountId,
        platformAccountName: dto.platformAccountName,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        tokenExpiresAt: dto.tokenExpiresAt,
        scopes: dto.scopes,
      },
    });
  }

  async remove(workspaceId: string, connectionId: string) {
    const connection = await this.prisma.connection.findFirst({
      where: { id: connectionId, workspaceId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    await this.prisma.connection.delete({ where: { id: connectionId } });

    return { message: 'Connection removed successfully' };
  }

  async triggerSync(workspaceId: string, connectionId: string) {
    const connection = await this.prisma.connection.findFirst({
      where: { id: connectionId, workspaceId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Sync will be implemented in Phase 2 with BullMQ
    return { message: 'Sync job queued', connectionId };
  }
}
