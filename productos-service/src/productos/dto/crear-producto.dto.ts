import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ECategoria, ICrearRequest } from '../productos.interface';

export class CrearProductoDto implements ICrearRequest {
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  nombre: string;

  @IsPositive({ message: 'precio debe ser mayor que 0' })
  precio: number;

  @IsOptional()
  @IsInt({ message: 'stock debe ser un entero' })
  @Min(0, { message: 'stock no puede ser negativo' })
  stock: number;

  @IsOptional()
  @IsEnum(ECategoria, { message: 'categoria no es válida' })
  categoria: ECategoria;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];
}
