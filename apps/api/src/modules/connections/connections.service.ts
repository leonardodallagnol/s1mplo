import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import { CreateConnectionDto } from './dto/create-connection.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

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
        // accessToken e refreshToken nunca são expostos pela API
      },
    });
  }

  // Uso interno: retorna conexão com tokens decriptados para o SyncService
  async findOneDecrypted(connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) return null;
    return {
      ...connection,
      accessToken: this.crypto.decrypt(connection.accessToken),
      refreshToken: this.crypto.decryptNullable(connection.refreshToken),
    };
  }

  async create(workspaceId: string, dto: CreateConnectionDto) {
    const encryptedAccessToken = this.crypto.encrypt(dto.accessToken);
    const encryptedRefreshToken = this.crypto.encryptNullable(dto.refreshToken);

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
      return this.prisma.connection.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
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
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
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

    return { message: 'Sync job queued', connectionId };
  }
}
