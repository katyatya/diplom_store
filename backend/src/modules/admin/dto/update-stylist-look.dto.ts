import { PartialType } from "@nestjs/mapped-types";
import { CreateStylistLookDto } from "./create-stylist-look.dto";

export class UpdateStylistLookDto extends PartialType(CreateStylistLookDto) {}
