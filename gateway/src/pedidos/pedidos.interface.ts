import type { CallOptions, Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export const PEDIDOS_PACKAGE = 'PEDIDOS_PACKAGE';

export enum EEstadoPedido {
  ESTADO_PEDIDO_DESCONOCIDO = 'ESTADO_PEDIDO_DESCONOCIDO',
  ESTADO_PEDIDO_PENDIENTE = 'ESTADO_PEDIDO_PENDIENTE',
  ESTADO_PEDIDO_PREPARANDO = 'ESTADO_PEDIDO_PREPARANDO',
  ESTADO_PEDIDO_ENVIADO = 'ESTADO_PEDIDO_ENVIADO',
  ESTADO_PEDIDO_ENTREGADO = 'ESTADO_PEDIDO_ENTREGADO',
}

export interface ITimestamp {
  seconds: number;
  nanos: number;
}

export interface IItemPedido {
  productoId: number;
  cantidad: number;
  nombreProducto: string;
  precioUnitario: number;
  subtotal: number;
}

export interface IPedido {
  id: number;
  items: IItemPedido[];
  total: number;
  estado: EEstadoPedido;
  creadoEn: ITimestamp;
}

export interface ICrearPedidoRequest {
  items: { productoId: number; cantidad: number }[];
}

export interface IIdRequest {
  id: number;
}

export interface IListarPedidosRequest {
  estado?: EEstadoPedido;
}

export interface IListarPedidosResponse {
  pedidos: IPedido[];
}

export interface ISeguimientoPedido {
  pedidoId: number;
  estado: EEstadoPedido;
  fecha: ITimestamp;
  mensaje: string;
}

// En REST las fechas viajan como ISO 8601 en vez de { seconds, nanos }
export type IPedidoRest = Omit<IPedido, 'creadoEn'> & { creadoEn: string };
export type ISeguimientoRest = Omit<ISeguimientoPedido, 'fecha'> & {
  fecha: string;
};

export interface IPedidoServicioClient {
  crearPedido(
    req: ICrearPedidoRequest,
    metadata?: Metadata,
    opciones?: CallOptions,
  ): Observable<IPedido>;
  obtenerPedido(
    req: IIdRequest,
    metadata?: Metadata,
    opciones?: CallOptions,
  ): Observable<IPedido>;
  listarPedidos(
    req: IListarPedidosRequest,
    metadata?: Metadata,
    opciones?: CallOptions,
  ): Observable<IListarPedidosResponse>;
  seguirPedido(
    req: IIdRequest,
    metadata?: Metadata,
    opciones?: CallOptions,
  ): Observable<ISeguimientoPedido>;
}
