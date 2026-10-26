import type { CallOptions, Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export interface IHealthResponse {
  status: 'UNKNOWN' | 'SERVING' | 'NOT_SERVING' | 'SERVICE_UNKNOWN';
}

export interface IHealthClient {
  check(
    req: { service: string },
    metadata?: Metadata,
    opciones?: CallOptions,
  ): Observable<IHealthResponse>;
}
