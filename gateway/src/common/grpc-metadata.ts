import { Metadata } from '@grpc/grpc-js';

// Reenvía el header Authorization del request HTTP como metadata gRPC
export function crearMetadata(authorization?: string): Metadata {
  const metadata = new Metadata();
  if (authorization) {
    metadata.set('authorization', authorization);
  }
  return metadata;
}
