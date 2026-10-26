import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';

// El cliente PEDIDOS_PACKAGE se registra de forma global en AppModule
@Module({
  controllers: [PedidosController],
})
export class PedidosModule {}
