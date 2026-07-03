export type AuthUserPayload = {
  userId: string;
  tenantId: string;
  sessionId: string;
  email: string;
  permissions: string[];
};

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
  groups: string[];
  permissions: string[];
};

export type AuthSessionSummary = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  current: boolean;
};

export const REFRESH_COOKIE_NAME = "nexum_refresh";
export const ACCESS_COOKIE_NAME = "nexum_access";
