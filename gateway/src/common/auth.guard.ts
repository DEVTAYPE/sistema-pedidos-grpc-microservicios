import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { authorization } = context
      .switchToHttp()
      .getRequest<Request>().headers;

    if (!authorization) {
      throw new UnauthorizedException('Falta el header Authorization');
    }

    const [tipo, token] = authorization.split(' ');
    const tokenValido = process.env.API_TOKEN ?? 'token-de-prueba';
    if (tipo !== 'Bearer' || token !== tokenValido) {
      throw new UnauthorizedException('Token inválido');
    }

    return true;
  }
}
