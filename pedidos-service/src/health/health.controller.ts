import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EServingStatus } from './health.interface';
import type { IHealthResponse } from './health.interface';

@Controller()
export class HealthController {
  @GrpcMethod('Health', 'Check')
  check(): IHealthResponse {
    return {
      status: EServingStatus.SERVING,
    };
  }
}
