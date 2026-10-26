export enum ECategoria {
  CATEGORIA_DESCONOCIDO = 'CATEGORIA_DESCONOCIDO',
  CATEGORIA_1 = 'CATEGORIA_1',
  CATEGORIA_2 = 'CATEGORIA_2',
  CATEGORIA_3 = 'CATEGORIA_3',
}

export interface IProducto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: ECategoria;
  etiquetas: string[];
}

export interface ICrearRequest {
  nombre: string;
  precio: number;
  stock: number;
  categoria: ECategoria;
  etiquetas?: string[];
}

export interface IListaEtiquetas {
  valores?: string[];
}

export interface IActualizarRequest {
  id: number;
  nombre?: string;
  precio?: number;
  categoria?: ECategoria;
  etiquetas?: IListaEtiquetas;
}

export interface IIdRequest {
  id: number;
}

export interface IListarResponse {
  productos: IProducto[];
}

export interface IEliminarResponse {
  eliminado: boolean;
}

export interface IStockRequest {
  productoId: number;
  cantidad: number;
}
