import { Module } from '@nestjs/common';
import { ProductosController } from './productos.controller';

// El cliente PRODUCTOS_PACKAGE se registra de forma global en AppModule
@Module({
  controllers: [ProductosController],
})
export class ProductosModule {}
