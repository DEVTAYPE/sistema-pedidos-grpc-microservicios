import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['productos', 'pedidos'],
        protoPath: [
          join(process.cwd(), '..', 'protos', 'productos.proto'),
          join(process.cwd(), '..', 'protos', 'pedidos.proto'),
        ],
        url: 'localhost:5000',
        loader: { enums: String, default: false },
      },
    },
  );
  await app.listen();
}
bootstrap();
