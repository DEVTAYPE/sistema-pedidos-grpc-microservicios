import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PEDIDOS_PACKAGE } from './pedidos/pedidos.interface';
import { PedidosModule } from './pedidos/pedidos.module';
import { PRODUCTOS_PACKAGE } from './productos/productos.interface';
import { ProductosModule } from './productos/productos.module';

const proto = (archivo: string) => join(process.cwd(), '..', 'protos', archivo);

const loader = { enums: String, longs: Number, defaults: true };

@Module({
  imports: [
    ClientsModule.register({
      isGlobal: true,
      clients: [
        {
          name: PRODUCTOS_PACKAGE,
          transport: Transport.GRPC,
          options: {
            package: ['productos', 'grpc.health.v1'],
            protoPath: [proto('productos.proto'), proto('health.proto')],
            url: 'localhost:5001',
            loader,
          },
        },
        {
          name: PEDIDOS_PACKAGE,
          transport: Transport.GRPC,
          options: {
            package: ['pedidos', 'grpc.health.v1'],
            protoPath: [proto('pedidos.proto'), proto('health.proto')],
            url: 'localhost:5002',
            loader,
          },
        },
      ],
    }),
    HealthModule,
    ProductosModule,
    PedidosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
