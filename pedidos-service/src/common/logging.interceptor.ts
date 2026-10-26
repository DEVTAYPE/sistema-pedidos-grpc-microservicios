import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { finalize, Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const handler = context.getHandler().name;
    const inicio = Date.now();

    console.log(`-> Llamada a ${handler}`);

    return next
      .handle()
      .pipe(
        finalize(() =>
          console.log(`<- ${handler} terminó en ${Date.now() - inicio}ms`),
        ),
      );
  }
}
