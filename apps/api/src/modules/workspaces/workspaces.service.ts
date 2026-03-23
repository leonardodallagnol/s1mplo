import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

const PLAN_WORKSPACE_LIMITS = {
  TRIAL: 10,
  STARTER: 3,
  PRO: 10,
  AGENCY: -1, // unlimited
};

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            connections: { select: { id: true, platform: true, status: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    await this.checkWorkspaceLimit(userId);

    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        connections: true,
        _count: { select: { members: true } },
      },
    });

    return workspace;
  }

  async findOne(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        connections: { select: { id: true, platform: true, status: true, lastSyncAt: true } },
        _count: { select: { members: true } },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
  }

  async remove(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!member || member.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can delete a workspace');
    }

    await this.prisma.workspace.delete({ where: { id: workspaceId } });

    return { message: 'Workspace deleted successfully' };
  }

  private async checkWorkspaceLimit(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const plan = subscription?.plan || 'TRIAL';
    const limit = PLAN_WORKSPACE_LIMITS[plan];

    if (limit === -1) return; // unlimited

    const count = await this.prisma.workspaceMember.count({
      where: { userId },
    });

    if (count >= limit) {
      throw new ForbiddenException(
        `Your plan allows a maximum of ${limit} workspaces. Upgrade to add more.`,
      );
    }
  }
}
