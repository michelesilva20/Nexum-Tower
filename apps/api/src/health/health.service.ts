import { Injectable } from "@nestjs/common";
import type { HealthResponse } from "@nexum-tower/shared";

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "nexum-tower-api",
      timestamp: new Date().toISOString(),
    };
  }
}
