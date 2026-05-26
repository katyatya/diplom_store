import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class StylistLooksService {
  constructor(private readonly prisma: DatabaseService) {}

  list() {
    return this.prisma.outfit.findMany({
      where: { isStylist: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
