import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { DEADLINE_MS, llamarConDeadline } from '../common/grpc-deadline';
import { crearMetadata } from '../common/grpc-metadata';
import { PEDIDOS_PACKAGE } from '../pedidos/pedidos.interface';
import { PRODUCTOS_PACKAGE } from '../productos/productos.interface';
import type { IHealthClient } from './health.interface';

@Controller('health')
export class HealthController implements OnModuleInit {
  private productos!: IHealthClient;
  private pedidos!: IHealthClient;

  constructor(
    @Inject(PRODUCTOS_PACKAGE) private readonly productosClient: ClientGrpc,
    @Inject(PEDIDOS_PACKAGE) private readonly pedidosClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productos = this.productosClient.getService<IHealthClient>('Health');
    this.pedidos = this.pedidosClient.getService<IHealthClient>('Health');
  }

  @Get()
  async check() {
    const [productos, pedidos] = await Promise.all([
      this.consultar(this.productos),
      this.consultar(this.pedidos),
    ]);
    const servicios = { productos, pedidos };

    if (productos !== 'SERVING' || pedidos !== 'SERVING') {
      throw new ServiceUnavailableException({ status: 'error', servicios });
    }
    return { status: 'ok', servicios };
  }

  private async consultar(health: IHealthClient): Promise<string> {
    try {
      const { status } = await firstValueFrom(
        llamarConDeadline(DEADLINE_MS, (opciones) =>
          health.check({ service: '' }, crearMetadata(), opciones),
        ),
      );
      return status;
    } catch {
      return 'NO_DISPONIBLE';
    }
  }
}
