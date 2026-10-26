import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import type {
  IActualizarRequest,
  IEliminarResponse,
  IIdRequest,
  IListarResponse,
  IProducto,
  IStockRequest,
} from './productos.interface';

@Controller()
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @GrpcMethod('ProductoServicio', 'Crear')
  crear(req: CrearProductoDto): IProducto {
    return this.productosService.crear(req);
  }

  @GrpcMethod('ProductoServicio', 'Actualizar')
  actualizar(req: IActualizarRequest): IProducto {
    return this.productosService.actualizar(req);
  }

  @GrpcMethod('ProductoServicio', 'Obtener')
  obtener({ id }: IIdRequest): IProducto {
    return this.productosService.obtener(id);
  }

  @GrpcMethod('ProductoServicio', 'Eliminar')
  eliminar({ id }: IIdRequest): IEliminarResponse {
    return { eliminado: this.productosService.eliminar(id) };
  }

  @GrpcMethod('ProductoServicio', 'Listar')
  listar(): IListarResponse {
    return { productos: this.productosService.listar() };
  }

  @GrpcMethod('ProductoServicio', 'DescontarStock')
  descontarStock(req: IStockRequest): IProducto {
    return this.productosService.descontarStock(req);
  }

  @GrpcMethod('ProductoServicio', 'ReponerStock')
  reponerStock(req: IStockRequest): IProducto {
    return this.productosService.reponerStock(req);
  }
}
