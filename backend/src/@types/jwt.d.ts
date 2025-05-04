// src/@types/jwt.d.ts
import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
  }
}