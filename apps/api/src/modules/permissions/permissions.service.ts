import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.client.permission.findMany({
      orderBy: [{ module: "asc" }, { key: "asc" }],
      select: {
        id: true,
        key: true,
        module: true,
        resource: true,
        action: true,
        description: true,
      },
    });
  }

  async listModules() {
    const grouped = await this.prisma.client.permission.groupBy({
      by: ["module"],
      _count: { _all: true },
      orderBy: { module: "asc" },
    });

    return grouped.map((g) => ({ module: g.module, count: g._count._all }));
  }
}
