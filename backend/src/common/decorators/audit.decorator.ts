import { SetMetadata } from "@nestjs/common";

export const AUDIT_ACTION_KEY = "audit_action";
export const AUDIT_RESOURCE_KEY = "audit_resource";

export const Audit = (action: string, resource: string) =>
  SetMetadata(AUDIT_ACTION_KEY, { action, resource });
