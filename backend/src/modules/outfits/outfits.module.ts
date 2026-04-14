import { Module } from "@nestjs/common";
import { OutfitsController } from "./outfits.controller";
import { OutfitsService } from "./outfits.service";

@Module({
  providers: [OutfitsService],
  controllers: [OutfitsController],
})
export class OutfitsModule {}
