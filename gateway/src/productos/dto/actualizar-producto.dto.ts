import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CrearProductoDto } from './crear-producto.dto';

// El stock solo cambia vía DescontarStock/ReponerStock, no por PATCH
export class ActualizarProductoDto extends PartialType(
  OmitType(CrearProductoDto, ['stock'] as const),
) {}
