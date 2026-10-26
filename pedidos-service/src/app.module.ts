import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PedidosModule } from './pedidos/pedidos.module';

@Module({
  imports: [HealthModule, PedidosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
