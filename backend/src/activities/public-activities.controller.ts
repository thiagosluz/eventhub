import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ActivitiesService } from "./activities.service";

@Controller("public/activities")
export class PublicActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(":activityId/feedback-info")
  async getFeedbackInfo(@Param("activityId") activityId: string) {
    return this.activitiesService.getPublicActivityInfo(activityId);
  }

  @Post(":activityId/feedbacks")
  async submitFeedback(
    @Param("activityId") activityId: string,
    @Body() body: { rating: number; comment?: string; userId?: string },
  ) {
    return this.activitiesService.submitPublicFeedback(activityId, body);
  }
}
