import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import { MinioService } from "../../storage/minio.service";

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  constructor(private readonly minioService: MinioService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Tenta listar buckets para verificar conectividade
      // Como o service não expõe o client diretamente, vamos usar o service
      // Poderíamos adicionar um método .ping() no MinioService para ser mais limpo
      await (this.minioService as any).client.listBuckets();
      return this.getStatus(key, true);
    } catch (error: any) {
      throw new HealthCheckError(
        "Minio check failed",
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
