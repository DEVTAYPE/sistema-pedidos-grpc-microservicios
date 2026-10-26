import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { ICrearPedidoRequest } from '../pedidos.interface';

export class ItemPedidoDto {
  @IsInt({ message: 'productoId debe ser un entero' })
  @IsPositive({ message: 'productoId debe ser mayor que 0' })
  productoId: number;

  @IsInt({ message: 'cantidad debe ser un entero' })
  @IsPositive({ message: 'cantidad debe ser mayor que 0' })
  cantidad: number;
}

export class CrearPedidoDto implements ICrearPedidoRequest {
  @IsArray({ message: 'items debe ser una lista' })
  @ArrayNotEmpty({ message: 'el pedido debe tener al menos un ítem' })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[];
}
