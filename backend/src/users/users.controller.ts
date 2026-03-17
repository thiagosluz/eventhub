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

interface AuthRequest extends Request {
  user?: { sub: string; email: string; tenantId: string; role: string };
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Req() req: AuthRequest) {
    return this.usersService.findMe(req.user!.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: AuthRequest) {
    return this.usersService.updateProfile(req.user!.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me/password")
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Req() req: AuthRequest,
  ) {
    return this.usersService.updatePassword(req.user!.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Req() req: AuthRequest,
  ) {
    return this.usersService.uploadAvatar(req.user!.sub, file);
  }
}
