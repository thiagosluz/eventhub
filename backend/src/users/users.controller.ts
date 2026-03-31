import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UpdateProfileDto, UpdatePasswordDto } from "./dto/update-user.dto";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";

interface AuthRequest extends Request {
  user?: { sub: string; email: string; tenantId: string; role: string };
}

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get currently logged in user profile" })
  @Get("me")
  async getMe(@Req() req: AuthRequest) {
    return this.usersService.findMe(req.user!.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update current user profile" })
  @Patch("me")
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: AuthRequest) {
    return this.usersService.updateProfile(req.user!.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update current user password" })
  @Patch("me/password")
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Req() req: AuthRequest,
  ) {
    return this.usersService.updatePassword(req.user!.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Upload user avatar" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: AuthRequest,
  ) {
    return this.usersService.uploadAvatar(req.user!.sub, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "List all users in the tenant (Organizer only)" })
  @Get()
  async findAll(@Req() req: AuthRequest) {
    return this.usersService.findAll(req.user!.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List events where current user is a monitor" })
  @Get("me/monitored-events")
  async getMyMonitoredEvents(@Req() req: AuthRequest) {
    return this.usersService.findMyMonitoredEvents(req.user!.sub);
  }
}
