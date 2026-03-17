import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CheckoutService } from "./checkout.service";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

class FormAnswerDto {
  fieldId!: string;
  value!: string;
}

class FormResponseDto {
  formId!: string;
  answers!: FormAnswerDto[];
}

class CheckoutDto {
  eventId!: string;
  activityIds?: string[];
  formResponses?: FormResponseDto[];
}

@Controller()
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post("checkout")
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
