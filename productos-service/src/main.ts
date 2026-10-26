import { status } from '@grpc/grpc-js';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['productos', 'grpc.health.v1'],
        protoPath: [
          join(process.cwd(), '..', 'protos', 'productos.proto'),
          join(process.cwd(), '..', 'protos', 'health.proto'),
        ],
        url: 'localhost:5001',
        loader: { enums: String },
      },
    },
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new RpcException({
          code: status.INVALID_ARGUMENT,
          message: errors
            .flatMap((e) => Object.values(e.constraints ?? {}))
            .join(', '),
        }),
    }),
  );

  await app.listen();
}
bootstrap();
