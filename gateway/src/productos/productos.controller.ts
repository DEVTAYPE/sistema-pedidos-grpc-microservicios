import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  OnModuleInit,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { map, Observable } from 'rxjs';
import { AuthGuard } from '../common/auth.guard';
import { DEADLINE_MS, llamarConDeadline } from '../common/grpc-deadline';
import { crearMetadata } from '../common/grpc-metadata';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { PRODUCTOS_PACKAGE } from './productos.interface';
import type {
  IEliminarResponse,
  IProducto,
  IProductoServicioClient,
} from './productos.interface';

@Controller('productos')
export class ProductosController implements OnModuleInit {
  private productos: IProductoServicioClient;

  constructor(@Inject(PRODUCTOS_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.productos =
      this.client.getService<IProductoServicioClient>('ProductoServicio');
  }

  @Post()
  @UseGuards(AuthGuard)
  crear(
    @Body() dto: CrearProductoDto,
    @Headers('authorization') auth: string,
  ): Observable<IProducto> {
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.productos.crear(dto, crearMetadata(auth), opciones),
    );
  }

  @Get()
  listar(@Headers('authorization') auth?: string): Observable<IProducto[]> {
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.productos.listar({}, crearMetadata(auth), opciones),
    ).pipe(map((res) => res.productos));
  }

  @Get(':id')
  obtener(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ): Observable<IProducto> {
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.productos.obtener({ id }, crearMetadata(auth), opciones),
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
    @Headers('authorization') auth: string,
  ): Observable<IProducto> {
    // En el proto, etiquetas va envuelta: sin wrapper = no tocar, { valores: [] } = vaciar
    const { etiquetas, ...campos } = dto;
    const req = {
      id,
      ...campos,
      etiquetas: etiquetas !== undefined ? { valores: etiquetas } : undefined,
    };
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.productos.actualizar(req, crearMetadata(auth), opciones),
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth: string,
  ): Observable<IEliminarResponse> {
    return llamarConDeadline(DEADLINE_MS, (opciones) =>
      this.productos.eliminar({ id }, crearMetadata(auth), opciones),
    );
  }
}
