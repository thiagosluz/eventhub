import { Test, TestingModule } from "@nestjs/testing";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

describe("CheckoutController", () => {
  let controller: CheckoutController;

  const mockCheckoutService = {
    processCheckout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [{ provide: CheckoutService, useValue: mockCheckoutService }],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
  });

  describe("checkoutFree", () => {
    it("should throw error if user is missing token payload", async () => {
      const req = { user: null } as any;
      await expect(
        controller.checkoutFree({ eventId: "e1" }, req),
      ).rejects.toThrow("Missing user id on token payload.");
    });

    it("should process checkout successfully and return result format", async () => {
      const dto = { eventId: "e1", activityIds: ["a1"] };
      const req = { user: { sub: "u1" } } as any;
      mockCheckoutService.processCheckout.mockResolvedValueOnce({
        registrationId: "r1",
        payment: { tickets: [], totalAmount: 0 },
      });

      const result = await controller.checkoutFree(dto, req);
      expect(mockCheckoutService.processCheckout).toHaveBeenCalledWith({
        eventId: "e1",
        activityIds: ["a1"],
        userId: "u1",
        formResponses: undefined,
      });
      expect(result).toEqual({
        registrationId: "r1",
        tickets: [],
        totalAmount: 0,
      });
    });

    it("should process checkout with mapped form responses", async () => {
      const dto = {
        eventId: "e1",
        activityIds: [],
        formResponses: [
          { formId: "f1", answers: [{ fieldId: "a1", value: "ok" }] },
        ],
      };
      const req = { user: { sub: "u1" } } as any;
      mockCheckoutService.processCheckout.mockResolvedValueOnce({
        registrationId: "r2",
        payment: { tickets: ["t2"], totalAmount: 0 },
      });

      const result = await controller.checkoutFree(dto, req);
      expect(mockCheckoutService.processCheckout).toHaveBeenCalledWith({
        eventId: "e1",
        activityIds: [],
        userId: "u1",
        formResponses: [
          { formId: "f1", answers: [{ fieldId: "a1", value: "ok" }] },
        ],
      });
      expect(result.registrationId).toEqual("r2");
    });
  });
});
