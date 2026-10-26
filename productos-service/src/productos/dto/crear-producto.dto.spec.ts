import { ArgumentMetadata } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GrpcValidationPipe } from '../../common/grpc-validation.pipe';
import { CrearProductoDto } from './crear-producto.dto';
import { ECategoria } from '../productos.interface';

describe('CrearProductoDto + GrpcValidationPipe', () => {
  const pipe = new GrpcValidationPipe();
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CrearProductoDto,
  };
  const valido = {
    nombre: 'Teclado',
    precio: 50,
    stock: 10,
    categoria: ECategoria.CATEGORIA_1,
  };

  it('acepta un producto válido y lo transforma en CrearProductoDto', async () => {
    const resultado = await pipe.transform(valido, metadata);
    expect(resultado).toBeInstanceOf(CrearProductoDto);
  });

  it('lanza INVALID_ARGUMENT si el precio es negativo', async () => {
    const error = await pipe
      .transform({ ...valido, precio: -5 }, metadata)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RpcException);
    expect((error as RpcException).getError()).toEqual({
      code: status.INVALID_ARGUMENT,
      message: 'precio debe ser mayor que 0',
    });
  });

  it('lanza INVALID_ARGUMENT si la categoría no existe', async () => {
    const error = await pipe
      .transform({ ...valido, categoria: 'CATEGORIA_99' }, metadata)
      .catch((e: unknown) => e);

    expect((error as RpcException).getError()).toMatchObject({
      code: status.INVALID_ARGUMENT,
    });
  });
});
