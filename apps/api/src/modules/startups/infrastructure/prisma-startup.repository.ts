import { Injectable } from '@nestjs/common';
import type { CreateStartup, Startup } from '@agentipo/shared';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { StartupRepository } from '../domain/startup.repository';
import { toStartup } from './mappers';

@Injectable()
export class PrismaStartupRepository implements StartupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStartup): Promise<Startup> {
    const row = await this.prisma.startup.create({
      data: { ...input, links: asJson(input.links) },
    });
    return toStartup(row);
  }

  async findById(id: string): Promise<Startup | null> {
    const row = await this.prisma.startup.findUnique({ where: { id } });
    return row ? toStartup(row) : null;
  }

  async findAll(): Promise<Startup[]> {
    const rows = await this.prisma.startup.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toStartup);
  }
}
