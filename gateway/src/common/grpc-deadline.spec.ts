import { GatewayTimeoutException } from '@nestjs/common';
import type { CallOptions } from '@grpc/grpc-js';
import { firstValueFrom, NEVER, of } from 'rxjs';
import { conDeadline, llamarConDeadline } from './grpc-deadline';

describe('grpc-deadline', () => {
  it('conDeadline deja pasar la respuesta si llega a tiempo', async () => {
    await expect(firstValueFrom(of(42).pipe(conDeadline(50)))).resolves.toBe(
      42,
    );
  });

  it('conDeadline convierte el TimeoutError en 504', async () => {
    await expect(
      firstValueFrom(NEVER.pipe(conDeadline(20))),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('llamarConDeadline pasa el deadline nativo calculado al suscribirse', async () => {
    let recibidas: CallOptions | undefined;
    const llamada$ = llamarConDeadline(3000, (opciones) => {
      recibidas = opciones;
      return of('ok');
    });
    expect(recibidas).toBeUndefined();

    const antes = Date.now();
    await firstValueFrom(llamada$);

    const deadline = recibidas?.deadline as Date;
    expect(deadline.getTime()).toBeGreaterThanOrEqual(antes + 3000);
  });
});
