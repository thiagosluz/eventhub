import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";

@ApiTags("health")
@Controller("health")
export class PublicHealthController {
  @Get()
  @SkipThrottle()
  @Throttle({ default: { limit: 600, ttl: 60_000 } })
  @ApiOperation({ summary: "Public health endpoint (liveness)" })
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
