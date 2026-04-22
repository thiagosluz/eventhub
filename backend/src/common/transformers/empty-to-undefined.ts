/**
 * Normaliza strings vazias/whitespace para `undefined`, permitindo que
 * decorators como `@IsUrl()`, `@IsEmail()`, `@IsOptional()` ignorem o
 * campo em vez de rejeitá-lo. Útil em DTOs de `PATCH` alimentados por
 * forms que enviam `""` quando o usuário não preenche um campo.
 *
 * Uso:
 *   @Transform(emptyStringToUndefined)
 *   @IsOptional()
 *   @IsUrl()
 *   websiteUrl?: string;
 */
export const emptyStringToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? undefined : value;
};
