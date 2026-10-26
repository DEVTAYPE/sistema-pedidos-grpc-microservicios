import { GatewayTimeoutException } from '@nestjs/common';
import type { CallOptions } from '@grpc/grpc-js';
import {
  defer,
  MonoTypeOperatorFunction,
  Observable,
  throwError,
  timeout,
} from 'rxjs';

export const DEADLINE_MS = 3_000;
export const DEADLINE_CREAR_PEDIDO_MS = 5_000;
// En streams no hay duración total conocida: se limita la espera entre mensajes
export const DEADLINE_ENTRE_EVENTOS_MS = 10_000;

// Operador reutilizable: si no llega un valor en `ms`, falla con 504
export function conDeadline<T>(ms: number): MonoTypeOperatorFunction<T> {
  return timeout<T, Observable<never>>({
    each: ms,
    with: () =>
      throwError(
        () =>
          new GatewayTimeoutException(`El servicio no respondió en ${ms} ms`),
      ),
  });
}

// Deadline nativo de gRPC (el servidor también se entera y corta la llamada)
// más el timeout de RxJS como red de seguridad. `defer` calcula el deadline
// al suscribirse, que es cuando de verdad sale la llamada.
export function llamarConDeadline<T>(
  ms: number,
  llamada: (opciones: CallOptions) => Observable<T>,
): Observable<T> {
  return defer(() => llamada({ deadline: new Date(Date.now() + ms) })).pipe(
    conDeadline(ms),
  );
}
