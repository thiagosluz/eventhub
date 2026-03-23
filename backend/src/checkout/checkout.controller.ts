import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CheckoutService } from "./checkout.service";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

class FormAnswerDto {
  @ApiProperty()
  fieldId!: string;
  @ApiProperty()
  value!: string;
}

class FormResponseDto {
  @ApiProperty()
  formId!: string;
  @ApiProperty({ type: [FormAnswerDto] })
  answers!: FormAnswerDto[];
}

class CheckoutDto {
  @ApiProperty()
  eventId!: string;
  @ApiProperty({ type: [String], required: false })
  activityIds?: string[];
  @ApiProperty({ type: [FormResponseDto], required: false })
  formResponses?: FormResponseDto[];
}

@ApiTags("checkout")
@ApiBearerAuth()
@Controller()
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post("checkout")
  @ApiOperation({ summary: "Process checkout for free tickets and activities" })
  async checkoutFree(@Body() body: CheckoutDto, @Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error("Missing user id on token payload.");
    }

    const activityIds = body.activityIds ?? [];
    const formResponses = body.formResponses?.map((fr) => ({
      formId: fr.formId,
      answers: fr.answers.map((a) => ({ fieldId: a.fieldId, value: a.value })),
    }));

    const result = await this.checkout.processCheckout({
      eventId: body.eventId,
      activityIds,
      userId,
      formResponses,
    });

    return {
      registrationId: result.registrationId,
      tickets: result.payment.tickets,
      totalAmount: result.payment.totalAmount,
    };
  }
}
