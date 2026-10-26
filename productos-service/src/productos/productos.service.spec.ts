import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ProductosService } from './productos.service';
import { ECategoria, IProducto } from './productos.interface';

function codigoDeError(fn: () => unknown): number | undefined {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(RpcException);
    return ((e as RpcException).getError() as { code: number }).code;
  }
  throw new Error('Se esperaba una RpcException');
}

describe('ProductosService', () => {
  let service: ProductosService;
  let producto: IProducto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductosService],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
    producto = service.crear({
      nombre: 'Teclado',
      precio: 50,
      stock: 10,
      categoria: ECategoria.CATEGORIA_1,
      etiquetas: ['perifericos'],
    });
  });

  describe('descontarStock', () => {
    it('descuenta el stock cuando hay suficiente', () => {
      const resultado = service.descontarStock({
        productoId: producto.id,
        cantidad: 3,
      });
      expect(resultado.stock).toBe(7);
    });

    it('lanza FAILED_PRECONDITION si no hay stock suficiente', () => {
      const codigo = codigoDeError(() =>
        service.descontarStock({ productoId: producto.id, cantidad: 11 }),
      );
      expect(codigo).toBe(status.FAILED_PRECONDITION);
      expect(service.obtener(producto.id).stock).toBe(10);
    });

    it('lanza NOT_FOUND si el producto no existe', () => {
      const codigo = codigoDeError(() =>
        service.descontarStock({ productoId: 999, cantidad: 1 }),
      );
      expect(codigo).toBe(status.NOT_FOUND);
    });

    it('lanza INVALID_ARGUMENT si la cantidad es <= 0', () => {
      const codigo = codigoDeError(() =>
        service.descontarStock({ productoId: producto.id, cantidad: 0 }),
      );
      expect(codigo).toBe(status.INVALID_ARGUMENT);
    });
  });

  describe('reponerStock', () => {
    it('suma la cantidad al stock', () => {
      const resultado = service.reponerStock({
        productoId: producto.id,
        cantidad: 5,
      });
      expect(resultado.stock).toBe(15);
    });

    it('lanza INVALID_ARGUMENT si la cantidad es negativa', () => {
      const codigo = codigoDeError(() =>
        service.reponerStock({ productoId: producto.id, cantidad: -2 }),
      );
      expect(codigo).toBe(status.INVALID_ARGUMENT);
    });
  });

  describe('actualizar', () => {
    it('solo modifica los campos que llegan', () => {
      const resultado = service.actualizar({ id: producto.id, precio: 0 });
      expect(resultado).toEqual({ ...producto, precio: 0 });
    });

    it('reemplaza las etiquetas cuando llega el wrapper', () => {
      const resultado = service.actualizar({
        id: producto.id,
        etiquetas: { valores: ['oferta'] },
      });
      expect(resultado.etiquetas).toEqual(['oferta']);
    });

    it('vacía las etiquetas si el wrapper llega sin valores', () => {
      const resultado = service.actualizar({ id: producto.id, etiquetas: {} });
      expect(resultado.etiquetas).toEqual([]);
    });
  });
});
