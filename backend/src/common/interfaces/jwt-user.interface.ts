export interface JwtUser {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
}
