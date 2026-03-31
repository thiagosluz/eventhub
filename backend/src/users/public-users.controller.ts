import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users/p")
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Get a public user profile by username" })
  @Get(":username")
  async getByUsername(@Param("username") username: string) {
    return this.usersService.findByUsername(username);
  }
}
