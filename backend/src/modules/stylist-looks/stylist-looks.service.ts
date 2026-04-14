import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StylistLooksService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.outfit.findMany({
      where: { isStylist: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
