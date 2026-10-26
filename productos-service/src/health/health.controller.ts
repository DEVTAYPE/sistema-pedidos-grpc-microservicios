import { GrpcMethod } from '@nestjs/microservices';
import { EServingStatus } from './health.interface';
import { Controller } from '@nestjs/common';

@Controller()
export class HealthController {
  @GrpcMethod('Health', 'Check')
  check() {
    return {
      status: EServingStatus.SERVING,
    };
  }
}
