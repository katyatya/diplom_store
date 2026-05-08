import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";

function accessTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((row) => row.trim());
  const target = cookies.find((row) => row.startsWith("access_token="));
  if (!target) return null;
  const [, value] = target.split("=");
  return value ? decodeURIComponent(value) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        accessTokenFromCookies,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-secret-change-me",
    });
  }

  validate(payload: JwtUser): JwtUser {
    return payload;
  }
}
