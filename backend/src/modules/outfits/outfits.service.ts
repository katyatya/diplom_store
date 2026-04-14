import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOutfitDto } from "./dto/create-outfit.dto";
import { UpdateOutfitDto } from "./dto/update-outfit.dto";

@Injectable()
export class OutfitsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.outfit.findMany({
      where: { userId, isStylist: false },
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, dto: CreateOutfitDto) {
    return this.prisma.outfit.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isStylist: false,
        items: dto.items as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(userId: string, outfitId: string, dto: UpdateOutfitDto) {
    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit) throw new NotFoundException("Outfit not found");
    if (outfit.userId !== userId || outfit.isStylist) {
      throw new ForbiddenException("Cannot modify this outfit");
    }

    const data: Prisma.OutfitUpdateInput = {
      name: dto.name,
      description: dto.description,
    };
    if (dto.items) {
      data.items = dto.items as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.outfit.update({
      where: { id: outfitId },
      data,
    });
  }

  async remove(userId: string, outfitId: string) {
    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit) throw new NotFoundException("Outfit not found");
    if (outfit.userId !== userId || outfit.isStylist) {
      throw new ForbiddenException("Cannot delete this outfit");
    }

    await this.prisma.outfit.delete({ where: { id: outfitId } });
    return { success: true };
  }
}
