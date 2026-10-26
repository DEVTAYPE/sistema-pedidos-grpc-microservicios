import { BadRequestException, HttpStatus } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { aHttpException } from './grpc-exception.filter';

describe('aHttpException', () => {
  it.each([
    [status.INVALID_ARGUMENT, HttpStatus.BAD_REQUEST],
    [status.NOT_FOUND, HttpStatus.NOT_FOUND],
    [status.ALREADY_EXISTS, HttpStatus.CONFLICT],
    [status.FAILED_PRECONDITION, HttpStatus.CONFLICT],
    [status.UNAUTHENTICATED, HttpStatus.UNAUTHORIZED],
    [status.PERMISSION_DENIED, HttpStatus.FORBIDDEN],
  ])('gRPC %s -> HTTP %s con el mensaje del servicio', (code, esperado) => {
    const http = aHttpException({ code, details: 'detalle' });

    expect(http.getStatus()).toBe(esperado);
    expect(http.getResponse()).toMatchObject({ message: 'detalle' });
  });

  it.each([
    [status.UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE],
    [status.DEADLINE_EXCEEDED, HttpStatus.GATEWAY_TIMEOUT],
    [status.INTERNAL, HttpStatus.INTERNAL_SERVER_ERROR],
  ])('gRPC %s -> HTTP %s sin exponer el detalle', (code, esperado) => {
    const http = aHttpException({ code, details: 'connect ECONNREFUSED' });

    expect(http.getStatus()).toBe(esperado);
    expect(JSON.stringify(http.getResponse())).not.toContain('ECONNREFUSED');
  });

  it('deja pasar las HttpException tal cual', () => {
    const original = new BadRequestException('mal');
    expect(aHttpException(original)).toBe(original);
  });

  it('cualquier otro error es 500 sin filtrar detalles', () => {
    const http = aHttpException(new Error('secreto interno'));
    expect(http.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(JSON.stringify(http.getResponse())).not.toContain('secreto');
  });
});
