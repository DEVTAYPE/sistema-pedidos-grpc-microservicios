import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['pedidos', 'grpc.health.v1'],
        protoPath: [
          join(process.cwd(), '..', 'protos', 'pedidos.proto'),
          join(process.cwd(), '..', 'protos', 'health.proto'),
        ],
        url: 'localhost:5002',
        loader: { enums: String },
      },
    },
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen();
}
bootstrap();
