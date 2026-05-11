export interface JwtUser {
  sub: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}
