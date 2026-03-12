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
}

