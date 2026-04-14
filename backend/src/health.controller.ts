import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  healthcheck(): { status: string } {
    return { status: "ok" };
  }
}
