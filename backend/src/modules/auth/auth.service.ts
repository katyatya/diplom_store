import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = {
  user: JwtUser;
  tokens: AuthTokens;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    return this.issueTokensAndPersistRefresh(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatched) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokensAndPersistRefresh(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: JwtUser;
    try {
      payload = await this.jwtService.verifyAsync<JwtUser>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException("Refresh session not found");
    }

    if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException("Refresh token expired");
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.issueTokensAndPersistRefresh(user.id, user.email, user.role);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  private async issueTokensAndPersistRefresh(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<AuthResult> {
    const user: JwtUser = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(user, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpiresIn() as never,
      }),
      this.jwtService.signAsync(user, {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn() as never,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        refreshTokenExpiresAt: new Date(
          Date.now() + this.getRefreshExpiresInMs(),
        ),
      },
    });

    return { user, tokens: { accessToken, refreshToken } };
  }

  private getAccessSecret(): string {
    return process.env.JWT_SECRET ?? "dev-secret-change-me";
  }

  private getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me";
  }

  private getAccessExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? "15m";
  }

  private getRefreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";
  }

  private getRefreshExpiresInMs(): number {
    const raw = process.env.JWT_REFRESH_EXPIRES_MS;
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    return 30 * 24 * 60 * 60 * 1000;
  }
}
