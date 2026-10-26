import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { PedidosService } from './pedidos.service';
import type {
  ICrearPedidoRequest,
  IIdRequest,
  IListarPedidosRequest,
  IListarPedidosResponse,
  IPedido,
  ISeguimientoPedido,
} from './pedidos.interface';

@Controller()
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @GrpcMethod('PedidoServicio', 'CrearPedido')
  crearPedido(req: ICrearPedidoRequest): Promise<IPedido> {
    return this.pedidosService.crear(req);
  }

  @GrpcMethod('PedidoServicio', 'ObtenerPedido')
  obtenerPedido({ id }: IIdRequest): IPedido {
    return this.pedidosService.obtener(id);
  }

  @GrpcMethod('PedidoServicio', 'ListarPedidos')
  listarPedidos({ estado }: IListarPedidosRequest): IListarPedidosResponse {
    return { pedidos: this.pedidosService.listar(estado) };
  }

  @GrpcMethod('PedidoServicio', 'SeguirPedido')
  seguirPedido({ id }: IIdRequest): Observable<ISeguimientoPedido> {
    return this.pedidosService.seguir(id);
  }
}
