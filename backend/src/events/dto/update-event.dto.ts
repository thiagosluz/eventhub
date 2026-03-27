export class UpdateEventDto {
  name?: string;
  slug?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  themeConfig?: Record<string, unknown>;
  bannerUrl?: string;
  logoUrl?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";

  // Submission module config
  submissionsEnabled?: boolean;
  submissionStartDate?: string;
  submissionEndDate?: string;
  reviewStartDate?: string;
  reviewEndDate?: string;
  scientificCommitteeHead?: string;
  scientificCommitteeEmail?: string;
}
