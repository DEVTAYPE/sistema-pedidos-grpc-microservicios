import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PRODUCTOS_PACKAGE } from './pedidos.interface';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCTOS_PACKAGE,
        transport: Transport.GRPC,
        options: {
          package: 'productos',
          protoPath: join(process.cwd(), '..', 'protos', 'productos.proto'),
          url: 'localhost:5001',
          loader: { enums: String },
        },
      },
    ]),
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
