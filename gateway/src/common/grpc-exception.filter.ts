import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import type { Response } from 'express';

// FAILED_PRECONDITION -> 409: la petición es válida, pero choca con el estado
// actual del recurso (no hay stock). Repetirla más tarde puede funcionar.
// 422 sería para un cuerpo bien formado pero semánticamente inválido, y eso
// ya lo cubre la validación con 400.
const HTTP_POR_CODIGO_GRPC: Partial<Record<status, HttpStatus>> = {
  [status.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [status.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST,
  [status.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [status.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [status.FAILED_PRECONDITION]: HttpStatus.CONFLICT,
  [status.ABORTED]: HttpStatus.CONFLICT,
  [status.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
  [status.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [status.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
  [status.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
  [status.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [status.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
};

interface IErrorGrpc {
  code: status;
  details: string;
}

const esErrorGrpc = (error: unknown): error is IErrorGrpc =>
  typeof error === 'object' &&
  error !== null &&
  typeof (error as IErrorGrpc).code === 'number' &&
  'details' in error;

// Se usa en el filtro y en el SSE, donde el filtro ya no puede responder
export function aHttpException(error: unknown): HttpException {
  // Las HttpException (validación, guard, timeout...) pasan tal cual
  if (error instanceof HttpException) return error;

  if (esErrorGrpc(error)) {
    const httpStatus: number =
      HTTP_POR_CODIGO_GRPC[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    // En 5xx el detalle (hosts, puertos...) va al log, no al cliente
    return new HttpException(
      {
        statusCode: httpStatus,
        message:
          httpStatus >= 500
            ? 'Error al comunicarse con un servicio interno'
            : error.details,
        error: status[error.code],
      },
      httpStatus,
    );
  }

  return new InternalServerErrorException();
}

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const http = aHttpException(exception);
    const httpStatus = http.getStatus();

    if (httpStatus >= 500) {
      this.logger.error(exception);
    }
    if (response.headersSent) return;

    const cuerpo = http.getResponse();
    response
      .status(httpStatus)
      .json(
        typeof cuerpo === 'string'
          ? { statusCode: httpStatus, message: cuerpo }
          : cuerpo,
      );
  }
}
