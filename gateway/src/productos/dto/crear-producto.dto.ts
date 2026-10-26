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

  @IsInt({ message: 'stock debe ser un entero' })
  @Min(0, { message: 'stock no puede ser negativo' })
  stock: number;

  @IsEnum(ECategoria, { message: 'categoria no es válida' })
  categoria: ECategoria;

  @IsOptional()
  @IsArray({ message: 'etiquetas debe ser una lista' })
  @IsString({ each: true, message: 'cada etiqueta debe ser texto' })
  etiquetas?: string[];
}
