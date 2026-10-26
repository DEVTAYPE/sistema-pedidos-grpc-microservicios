import { Observable } from 'rxjs';

export const PRODUCTOS_PACKAGE = 'PRODUCTOS_PACKAGE';
export const INTERVALO_SEGUIMIENTO_MS = 'INTERVALO_SEGUIMIENTO_MS';

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

export interface IItemPedidoRequest {
  productoId: number;
  cantidad: number;
}

export interface ICrearPedidoRequest {
  items?: IItemPedidoRequest[];
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

// Cliente de Productos (solo lo que usa este servicio)
export interface IProducto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

export interface IStockRequest {
  productoId: number;
  cantidad: number;
}

export interface IProductoServicio {
  descontarStock(req: IStockRequest): Observable<IProducto>;
  reponerStock(req: IStockRequest): Observable<IProducto>;
}
