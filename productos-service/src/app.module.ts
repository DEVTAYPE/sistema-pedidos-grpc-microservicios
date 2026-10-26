import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ProductosModule } from './productos/productos.module';

@Module({
  imports: [HealthModule, ProductosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
