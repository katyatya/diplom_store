import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
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

    return { accessToken: this.createToken(user.id, user.email, user.role) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
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

    return { accessToken: this.createToken(user.id, user.email, user.role) };
  }

  private createToken(userId: string, email: string, role: UserRole): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}
