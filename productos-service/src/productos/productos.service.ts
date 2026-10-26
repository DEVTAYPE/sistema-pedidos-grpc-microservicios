import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  ECategoria,
  IActualizarRequest,
  ICrearRequest,
  IProducto,
  IStockRequest,
} from './productos.interface';

@Injectable()
export class ProductosService {
  private productos = new Map<number, IProducto>();
  private siguienteId = 1;

  crear(req: ICrearRequest): IProducto {
    const producto: IProducto = {
      id: this.siguienteId++,
      nombre: req.nombre,
      precio: req.precio,
      stock: req.stock ?? 0,
      categoria: req.categoria ?? ECategoria.CATEGORIA_DESCONOCIDO,
      etiquetas: req.etiquetas ?? [],
    };
    this.productos.set(producto.id, producto);
    return producto;
  }

  obtener(id: number): IProducto {
    const producto = this.productos.get(id);
    if (!producto) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Producto ${id} no encontrado`,
      });
    }
    return producto;
  }

  listar(): IProducto[] {
    return [...this.productos.values()];
  }

  actualizar(req: IActualizarRequest): IProducto {
    const producto = this.obtener(req.id);

    if (req.nombre !== undefined) producto.nombre = req.nombre;
    if (req.precio !== undefined) producto.precio = req.precio;
    if (req.categoria !== undefined) producto.categoria = req.categoria;
    if (req.etiquetas != null) producto.etiquetas = req.etiquetas.valores ?? [];

    return producto;
  }

  eliminar(id: number): boolean {
    this.obtener(id);
    return this.productos.delete(id);
  }

  descontarStock({ productoId, cantidad }: IStockRequest): IProducto {
    const producto = this.obtener(productoId);
    this.validarCantidad(cantidad);

    if (producto.stock < cantidad) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Stock insuficiente para producto ${productoId}: disponible ${producto.stock}, solicitado ${cantidad}`,
      });
    }

    producto.stock -= cantidad;
    return producto;
  }

  reponerStock({ productoId, cantidad }: IStockRequest): IProducto {
    const producto = this.obtener(productoId);
    this.validarCantidad(cantidad);

    producto.stock += cantidad;
    return producto;
  }

  private validarCantidad(cantidad: number | undefined): void {
    if (!cantidad || cantidad <= 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'La cantidad debe ser mayor que 0',
      });
    }
  }
}
