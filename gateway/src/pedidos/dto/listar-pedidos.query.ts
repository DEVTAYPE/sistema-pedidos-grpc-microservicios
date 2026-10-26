import { IsEnum, IsOptional } from 'class-validator';
import { EEstadoPedido, IListarPedidosRequest } from '../pedidos.interface';

export class ListarPedidosQueryDto implements IListarPedidosRequest {
  @IsOptional()
  @IsEnum(EEstadoPedido, { message: 'estado no es válido' })
  estado?: EEstadoPedido;
}
