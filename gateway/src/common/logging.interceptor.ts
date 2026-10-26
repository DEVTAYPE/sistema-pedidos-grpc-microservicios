import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { finalize, Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const { method, originalUrl } = context
      .switchToHttp()
      .getRequest<Request>();
    const inicio = Date.now();

    console.log(`-> ${method} ${originalUrl}`);

    return next
      .handle()
      .pipe(
        finalize(() =>
          console.log(
            `<- ${method} ${originalUrl} terminó en ${Date.now() - inicio}ms`,
          ),
        ),
      );
  }
}
