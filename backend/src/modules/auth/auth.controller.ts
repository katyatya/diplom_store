import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<{ accessToken: string }> {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: JwtUser): JwtUser {
    return user;
  }
}
