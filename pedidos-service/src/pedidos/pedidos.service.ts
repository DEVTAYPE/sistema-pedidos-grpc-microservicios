import { status } from '@grpc/grpc-js';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import {
  concat,
  firstValueFrom,
  interval,
  map,
  Observable,
  of,
  takeWhile,
} from 'rxjs';
import {
  EEstadoPedido,
  ICrearPedidoRequest,
  IItemPedido,
  IItemPedidoRequest,
  INTERVALO_SEGUIMIENTO_MS,
  IPedido,
  IProductoServicio,
  ISeguimientoPedido,
  ITimestamp,
  PRODUCTOS_PACKAGE,
} from './pedidos.interface';

const SIGUIENTE_ESTADO: Partial<Record<EEstadoPedido, EEstadoPedido>> = {
  [EEstadoPedido.ESTADO_PEDIDO_PENDIENTE]:
    EEstadoPedido.ESTADO_PEDIDO_PREPARANDO,
  [EEstadoPedido.ESTADO_PEDIDO_PREPARANDO]: EEstadoPedido.ESTADO_PEDIDO_ENVIADO,
  [EEstadoPedido.ESTADO_PEDIDO_ENVIADO]: EEstadoPedido.ESTADO_PEDIDO_ENTREGADO,
};

const MENSAJES: Record<EEstadoPedido, string> = {
  [EEstadoPedido.ESTADO_PEDIDO_DESCONOCIDO]: 'Estado desconocido',
  [EEstadoPedido.ESTADO_PEDIDO_PENDIENTE]:
    'Pedido recibido, pendiente de preparar',
  [EEstadoPedido.ESTADO_PEDIDO_PREPARANDO]: 'Preparando el pedido',
  [EEstadoPedido.ESTADO_PEDIDO_ENVIADO]: 'Pedido enviado',
  [EEstadoPedido.ESTADO_PEDIDO_ENTREGADO]: 'Pedido entregado',
};

const ahora = (): ITimestamp => {
  const ms = Date.now();
  return { seconds: Math.floor(ms / 1000), nanos: (ms % 1000) * 1_000_000 };
};

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

@Injectable()
export class PedidosService implements OnModuleInit {
  private readonly logger = new Logger(PedidosService.name);
  private productosServicio!: IProductoServicio;
  private pedidos = new Map<number, IPedido>();
  private siguienteId = 1;

  constructor(
    @Inject(PRODUCTOS_PACKAGE) private readonly client: ClientGrpc,
    @Optional()
    @Inject(INTERVALO_SEGUIMIENTO_MS)
    private readonly intervaloMs: number = 3000,
  ) {}

  onModuleInit() {
    this.productosServicio =
      this.client.getService<IProductoServicio>('ProductoServicio');
  }

  async crear(req: ICrearPedidoRequest): Promise<IPedido> {
    const solicitados = req.items ?? [];
    this.validarItems(solicitados);

    const confirmados: IItemPedido[] = [];
    try {
      for (const { productoId, cantidad } of solicitados) {
        const producto = await firstValueFrom(
          this.productosServicio.descontarStock({ productoId, cantidad }),
        );
        confirmados.push({
          productoId,
          cantidad,
          nombreProducto: producto.nombre,
          precioUnitario: producto.precio,
          subtotal: redondear(producto.precio * cantidad),
        });
      }
    } catch (error) {
      await this.compensar(confirmados);
      throw this.aRpcException(error);
    }

    const pedido: IPedido = {
      id: this.siguienteId++,
      items: confirmados,
      total: redondear(confirmados.reduce((suma, i) => suma + i.subtotal, 0)),
      estado: EEstadoPedido.ESTADO_PEDIDO_PENDIENTE,
      creadoEn: ahora(),
    };
    this.pedidos.set(pedido.id, pedido);
    return pedido;
  }

  obtener(id: number): IPedido {
    const pedido = this.pedidos.get(id);
    if (!pedido) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Pedido ${id} no encontrado`,
      });
    }
    return pedido;
  }

  listar(estado?: EEstadoPedido): IPedido[] {
    const todos = [...this.pedidos.values()];
    // El valor 0 del enum no viaja por la red: sin estado = sin filtro
    if (!estado || estado === EEstadoPedido.ESTADO_PEDIDO_DESCONOCIDO) {
      return todos;
    }
    return todos.filter((p) => p.estado === estado);
  }

  seguir(id: number): Observable<ISeguimientoPedido> {
    const pedido = this.obtener(id);
    const actual = of(this.seguimiento(pedido));

    if (pedido.estado === EEstadoPedido.ESTADO_PEDIDO_ENTREGADO) {
      return actual;
    }

    return concat(
      actual,
      interval(this.intervaloMs).pipe(
        map(() => {
          pedido.estado = SIGUIENTE_ESTADO[pedido.estado] ?? pedido.estado;
          return this.seguimiento(pedido);
        }),
        takeWhile(
          (s) => s.estado !== EEstadoPedido.ESTADO_PEDIDO_ENTREGADO,
          true,
        ),
      ),
    );
  }

  private seguimiento(pedido: IPedido): ISeguimientoPedido {
    return {
      pedidoId: pedido.id,
      estado: pedido.estado,
      fecha: ahora(),
      mensaje: MENSAJES[pedido.estado],
    };
  }

  private validarItems(items: IItemPedidoRequest[]): void {
    if (items.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'El pedido debe tener al menos un ítem',
      });
    }
    for (const { productoId, cantidad } of items) {
      if (!productoId || productoId <= 0) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Cada ítem debe indicar un productoId válido',
        });
      }
      if (!cantidad || cantidad <= 0) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: `La cantidad del producto ${productoId} debe ser mayor que 0`,
        });
      }
    }
  }

  private async compensar(confirmados: IItemPedido[]): Promise<void> {
    for (const { productoId, cantidad } of [...confirmados].reverse()) {
      try {
        await firstValueFrom(
          this.productosServicio.reponerStock({ productoId, cantidad }),
        );
      } catch (error) {
        this.logger.error(
          `Compensación fallida: no se pudo reponer ${cantidad} unidad(es) del producto ${productoId} (${this.detalle(error)})`,
        );
      }
    }
  }

  private aRpcException(error: unknown): RpcException {
    if (error instanceof RpcException) return error;
    const { code } = error as { code?: number };
    return new RpcException({
      code: code ?? status.INTERNAL,
      message: this.detalle(error),
    });
  }

  private detalle(error: unknown): string {
    const { details, message } = error as {
      details?: string;
      message?: string;
    };
    return details ?? message ?? 'Error desconocido';
  }
}
