import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom, of, throwError, toArray } from 'rxjs';
import { PedidosService } from './pedidos.service';
import {
  EEstadoPedido,
  INTERVALO_SEGUIMIENTO_MS,
  IStockRequest,
  PRODUCTOS_PACKAGE,
} from './pedidos.interface';

const catalogo: Record<number, { nombre: string; precio: number }> = {
  1: { nombre: 'Teclado', precio: 50 },
  2: { nombre: 'Mouse', precio: 19.99 },
  3: { nombre: 'Monitor', precio: 300 },
};

const productoOk = ({ productoId }: IStockRequest) =>
  of({ id: productoId, stock: 10, ...catalogo[productoId] });

const errorGrpc = (code: status, details: string) =>
  throwError(() => ({ code, details }));

const codigoDeError = (error: unknown) =>
  ((error as RpcException).getError() as { code: number }).code;

describe('PedidosService', () => {
  let service: PedidosService;
  const productosMock = {
    descontarStock: jest.fn(),
    reponerStock: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    productosMock.descontarStock.mockImplementation(productoOk);
    productosMock.reponerStock.mockImplementation(productoOk);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: PRODUCTOS_PACKAGE,
          useValue: { getService: () => productosMock },
        },
        { provide: INTERVALO_SEGUIMIENTO_MS, useValue: 1 },
      ],
    }).compile();
    await moduleRef.init(); // dispara onModuleInit -> getService

    service = moduleRef.get(PedidosService);
  });

  describe('crear', () => {
    it('descuenta cada ítem en orden y arma el pedido con los datos del producto', async () => {
      const pedido = await service.crear({
        items: [
          { productoId: 1, cantidad: 2 },
          { productoId: 2, cantidad: 3 },
        ],
      });

      expect(productosMock.descontarStock.mock.calls).toEqual([
        [{ productoId: 1, cantidad: 2 }],
        [{ productoId: 2, cantidad: 3 }],
      ]);
      expect(pedido.items).toEqual([
        {
          productoId: 1,
          cantidad: 2,
          nombreProducto: 'Teclado',
          precioUnitario: 50,
          subtotal: 100,
        },
        {
          productoId: 2,
          cantidad: 3,
          nombreProducto: 'Mouse',
          precioUnitario: 19.99,
          subtotal: 59.97,
        },
      ]);
      expect(pedido.total).toBe(159.97);
      expect(pedido.estado).toBe(EEstadoPedido.ESTADO_PEDIDO_PENDIENTE);
      expect(pedido.creadoEn.seconds).toBeGreaterThan(0);
      expect(productosMock.reponerStock).not.toHaveBeenCalled();
    });

    it('si un descuento falla repone solo los confirmados y relanza el código original', async () => {
      productosMock.descontarStock.mockImplementation((req: IStockRequest) =>
        req.productoId === 2
          ? errorGrpc(status.FAILED_PRECONDITION, 'Stock insuficiente')
          : productoOk(req),
      );

      const error = await service
        .crear({
          items: [
            { productoId: 1, cantidad: 2 },
            { productoId: 2, cantidad: 99 },
            { productoId: 3, cantidad: 1 },
          ],
        })
        .catch((e: unknown) => e);

      expect(codigoDeError(error)).toBe(status.FAILED_PRECONDITION);
      // el ítem 3 nunca se intentó
      expect(productosMock.descontarStock).toHaveBeenCalledTimes(2);
      expect(productosMock.reponerStock.mock.calls).toEqual([
        [{ productoId: 1, cantidad: 2 }],
      ]);
      expect(service.listar()).toHaveLength(0);
    });

    it('si ReponerStock también falla lo registra y sigue lanzando el error original', async () => {
      const logError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      productosMock.descontarStock.mockImplementation((req: IStockRequest) =>
        req.productoId === 3
          ? errorGrpc(status.NOT_FOUND, 'Producto 3 no encontrado')
          : productoOk(req),
      );
      productosMock.reponerStock.mockImplementation((req: IStockRequest) =>
        req.productoId === 2
          ? errorGrpc(status.UNAVAILABLE, 'Productos caído')
          : productoOk(req),
      );

      const error = await service
        .crear({
          items: [
            { productoId: 1, cantidad: 1 },
            { productoId: 2, cantidad: 4 },
            { productoId: 3, cantidad: 1 },
          ],
        })
        .catch((e: unknown) => e);

      expect(codigoDeError(error)).toBe(status.NOT_FOUND);
      // intenta reponer los dos aunque el primero (en orden inverso) falle
      expect(productosMock.reponerStock).toHaveBeenCalledTimes(2);
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError.mock.calls[0][0]).toContain(
        '4 unidad(es) del producto 2',
      );
      logError.mockRestore();
    });

    it.each([
      ['sin ítems', { items: [] }],
      ['sin campo items', {}],
      ['cantidad 0', { items: [{ productoId: 1, cantidad: 0 }] }],
      ['cantidad negativa', { items: [{ productoId: 1, cantidad: -2 }] }],
    ])('lanza INVALID_ARGUMENT (%s) sin llamar a Productos', async (_, req) => {
      const error = await service.crear(req).catch((e: unknown) => e);

      expect(codigoDeError(error)).toBe(status.INVALID_ARGUMENT);
      expect(productosMock.descontarStock).not.toHaveBeenCalled();
    });
  });

  describe('obtener y listar', () => {
    it('obtener lanza NOT_FOUND si el pedido no existe', () => {
      expect.assertions(1);
      try {
        service.obtener(42);
      } catch (error) {
        expect(codigoDeError(error)).toBe(status.NOT_FOUND);
      }
    });

    it('listar filtra por estado solo si se indica', async () => {
      const p1 = await service.crear({
        items: [{ productoId: 1, cantidad: 1 }],
      });
      await service.crear({ items: [{ productoId: 2, cantidad: 1 }] });
      p1.estado = EEstadoPedido.ESTADO_PEDIDO_ENVIADO;

      expect(service.listar()).toHaveLength(2);
      expect(
        service.listar(EEstadoPedido.ESTADO_PEDIDO_DESCONOCIDO),
      ).toHaveLength(2);
      expect(service.listar(EEstadoPedido.ESTADO_PEDIDO_ENVIADO)).toEqual([p1]);
      expect(service.listar(EEstadoPedido.ESTADO_PEDIDO_ENTREGADO)).toEqual([]);
    });
  });

  describe('seguir', () => {
    it('emite el estado actual, avanza hasta ENTREGADO y completa', async () => {
      const pedido = await service.crear({
        items: [{ productoId: 1, cantidad: 1 }],
      });

      const eventos = await lastValueFrom(
        service.seguir(pedido.id).pipe(toArray()),
      );

      expect(eventos.map((e) => e.estado)).toEqual([
        EEstadoPedido.ESTADO_PEDIDO_PENDIENTE,
        EEstadoPedido.ESTADO_PEDIDO_PREPARANDO,
        EEstadoPedido.ESTADO_PEDIDO_ENVIADO,
        EEstadoPedido.ESTADO_PEDIDO_ENTREGADO,
      ]);
      expect(eventos.every((e) => e.pedidoId === pedido.id)).toBe(true);
      expect(service.obtener(pedido.id).estado).toBe(
        EEstadoPedido.ESTADO_PEDIDO_ENTREGADO,
      );
    });

    it('si ya está entregado emite una sola vez y completa', async () => {
      const pedido = await service.crear({
        items: [{ productoId: 1, cantidad: 1 }],
      });
      pedido.estado = EEstadoPedido.ESTADO_PEDIDO_ENTREGADO;

      const eventos = await lastValueFrom(
        service.seguir(pedido.id).pipe(toArray()),
      );

      expect(eventos).toHaveLength(1);
    });
  });
});
