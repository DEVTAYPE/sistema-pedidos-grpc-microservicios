export interface IHealthRequest {
  service: string;
}

export enum EServingStatus {
  UNKNOWN = 'UNKNOWN',
  SERVING = 'SERVING',
  NOT_SERVING = 'NOT_SERVING',
  SERVICE_UNKNOWN = 'SERVICE_UNKNOWN',
}

export interface IHealthResponse {
  status: EServingStatus;
}
