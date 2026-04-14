import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { CreateOutfitDto } from "./dto/create-outfit.dto";
import { UpdateOutfitDto } from "./dto/update-outfit.dto";
import { OutfitsService } from "./outfits.service";

@UseGuards(JwtAuthGuard)
@Controller("outfits")
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Get()
  listMine(@CurrentUser() user: JwtUser) {
    return this.outfitsService.listMine(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOutfitDto) {
    return this.outfitsService.create(user.sub, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtUser,
    @Param("id") outfitId: string,
    @Body() dto: UpdateOutfitDto,
  ) {
    return this.outfitsService.update(user.sub, outfitId, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtUser, @Param("id") outfitId: string) {
    return this.outfitsService.remove(user.sub, outfitId);
  }
}
