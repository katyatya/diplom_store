import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === "production";
    response.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/auth",
    });
  }

  private clearAuthCookies(response: Response): void {
    const isProduction = process.env.NODE_ENV === "production";
    response.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });
    response.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/auth",
    });
  }

  private readCookie(request: Request, cookieName: string): string | null {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").map((row) => row.trim());
    const target = cookies.find((row) => row.startsWith(`${cookieName}=`));
    if (!target) return null;
    const [, value] = target.split("=");
    return value ? decodeURIComponent(value) : null;
  }

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: JwtUser }> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    return { user: result.user };
  }

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: JwtUser }> {
    const result = await this.authService.login(dto);
    this.setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: JwtUser): JwtUser {
    return user;
  }

  @Post("refresh")
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: JwtUser }> {
    const refreshToken = this.readCookie(request, "refresh_token");
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }
    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.authService.logout(user.sub);
    this.clearAuthCookies(response);
    return { success: true };
  }
}
