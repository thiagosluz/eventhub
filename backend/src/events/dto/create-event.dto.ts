export class CreateEventDto {
  name!: string;
  slug!: string;
  description?: string;
  location?: string;
  startDate!: string;
  endDate!: string;
  seoTitle?: string;
  seoDescription?: string;
  themeConfig?: Record<string, unknown>;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
