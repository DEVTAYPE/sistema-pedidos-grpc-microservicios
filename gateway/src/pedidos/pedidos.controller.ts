import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthGuard } from '../common/auth.guard';
import {
  conDeadline,
  DEADLINE_CREAR_PEDIDO_MS,
  DEADLINE_ENTRE_EVENTOS_MS,
  DEADLINE_MS,
  llamarConDeadline,
} from '../common/grpc-deadline';
import { aHttpException } from '../common/grpc-exception.filter';
import { crearMetadata } from '../common/grpc-metadata';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ListarPedidosQueryDto } from './dto/listar-pedidos.query';
import { PEDIDOS_PACKAGE } from './pedidos.interface';
import type {
  IPedido,
  IPedidoRest,
  IPedidoServicioClient,
  ISeguimientoPedido,
  ISeguimientoRest,
  ITimestamp,
} from './pedidos.interface';

const aIso = ({ seconds, nanos }: ITimestamp): string =>
  new Date(seconds * 1000 + Math.floor(nanos / 1e6)).toISOString();

const aPedidoRest = (pedido: IPedido): IPedidoRest => ({
  ...pedido,
  creadoEn: aIso(pedido.creadoEn),
});

const aSeguimientoRest = (s: ISeguimientoPedido): ISeguimientoRest => ({
  ...s,
  fecha: aIso(s.fecha),
});

@Controller('pedidos')
export class PedidosController implements OnModuleInit {
  private pedidos: IPedidoServicioClient;

  constructor(@Inject(PEDIDOS_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.pedidos =
      this.client.getService<IPedidoServicioClient>('PedidoServicio');
  }

  @Post()
  @UseGuards(AuthGuard)
  crear(
    @Body() dto: CrearPedidoDto,
    @Headers('authorization') auth: string,
  ): Observable<IPedidoRest> {
    return llamarConDeadline(DEADLINE_CREAR_PEDIDO_MS, (opciones) =>
      this.pedidos.crearPedido(dto, crearMetadata(auth), opciones),
    ).pipe(map(aPedidoRest));
  }

  @Get()
  listar(
    @Query() { estado }: ListarPedidosQueryDto,
    @Headers('authorization') auth?: string,
  ): Observable<IPedidoRest[]> {
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.pedidos.listarPedidos({ estado }, crearMetadata(auth), opciones),
    ).pipe(map((res) => res.pedidos.map(aPedidoRest)));
  }

  @Get(':id')
  obtener(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ): Observable<IPedidoRest> {
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.pedidos.obtenerPedido({ id }, crearMetadata(auth), opciones),
    ).pipe(map(aPedidoRest));
  }

  @Sse(':id/seguimiento')
  seguir(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ): Observable<MessageEvent> {
    // Nest envía las cabeceras SSE (200) antes de la primera respuesta gRPC,
    // así que un error (p. ej. NOT_FOUND) llega como "event: error" con su
    // mensaje; por eso se traduce con aHttpException.
    // Sin deadline nativo (el stream dura lo que tarde el pedido); en su lugar,
    // máximo DEADLINE_ENTRE_EVENTOS_MS entre mensajes. Si el cliente HTTP se
    // desconecta, Nest se desuscribe y el cliente gRPC hace call.cancel().
    return this.pedidos.seguirPedido({ id }, crearMetadata(auth)).pipe(
      conDeadline(DEADLINE_ENTRE_EVENTOS_MS),
      map((seguimiento) => ({ data: aSeguimientoRest(seguimiento) })),
      catchError((error: unknown) => throwError(() => aHttpException(error))),
    );
  }
}
