import { Controller, Get, Param } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Public Organizers")
@Controller("public/organizers")
export class PublicTenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll() {
    return this.tenantsService.findAllPublic();
  }

  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    return this.tenantsService.findOnePublic(slug);
  }
}
