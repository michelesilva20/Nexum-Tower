import { apiRequest, ApiError } from "./api";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "DISABLED";
export type CustomerType =
  | "CONTRACTING_CUSTOMER"
  | "SHIPPER"
  | "CONSIGNEE"
  | "SHIPPER_AND_CONSIGNEE"
  | "BROKER"
  | "PARTNER"
  | "OTHER";
export type CustomerDocumentType = "CNPJ" | "CPF" | "NIF" | "EIN" | "VAT" | "OTHER";

export type CustomerBranchLink = {
  id: string;
  branchId: string;
  isPrimary: boolean;
  status: CustomerStatus;
  updatedAt: string;
  branch: { id: string; code: string; name: string; status: string };
};

export type CustomerRow = {
  id: string;
  tenantId: string;
  code: string;
  legalName: string;
  tradeName: string | null;
  customerType: CustomerType;
  documentType: CustomerDocumentType | null;
  documentNumber: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  mainContactName: string | null;
  mainContactRole: string | null;
  email: string | null;
  billingEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingDistrict: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingCountry: string | null;
  billingZipCode: string | null;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  deletedAt: string | null;
  branches?: CustomerBranchLink[];
};

type ListPagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

async function apiRequestPaginated<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ items: T[]; pagination: ListPagination }> {
  const base =
    typeof window !== "undefined"
      ? "/api"
      : (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333");

  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let message = "Erro na requisição.";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  const payload = (await response.json()) as {
    data: T[];
    pagination?: ListPagination;
  };

  return {
    items: payload.data ?? [],
    pagination: payload.pagination ?? { page: 1, perPage: 20, total: 0, totalPages: 0 },
  };
}

export function listCustomers(params?: {
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  documentType?: CustomerDocumentType;
  branchId?: string;
  city?: string;
  state?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) {
  const qs = buildQuery({
    search: params?.search,
    status: params?.status,
    customerType: params?.customerType,
    documentType: params?.documentType,
    branchId: params?.branchId,
    city: params?.city,
    state: params?.state,
    page: params?.page,
    perPage: params?.perPage,
    sortBy: params?.sortBy,
    sortDirection: params?.sortDirection,
  });
  return apiRequestPaginated<CustomerRow>(`/logistics/customers${qs}`);
}

export function getCustomer(id: string) {
  return apiRequest<CustomerRow>(`/logistics/customers/${id}`);
}

export function createCustomer(
  data: Partial<CustomerRow> & {
    code: string;
    legalName: string;
    customerType: CustomerType;
    branchIds: string[];
    primaryBranchId?: string;
  },
) {
  return apiRequest<CustomerRow>("/logistics/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCustomer(id: string, data: Partial<CustomerRow>) {
  return apiRequest<CustomerRow>(`/logistics/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function disableCustomer(id: string) {
  return apiRequest<CustomerRow>(`/logistics/customers/${id}/disable`, { method: "PATCH" });
}

export function enableCustomer(id: string) {
  return apiRequest<CustomerRow>(`/logistics/customers/${id}/enable`, { method: "PATCH" });
}

export function deleteCustomer(id: string) {
  return apiRequest<{ success: boolean }>(`/logistics/customers/${id}`, { method: "DELETE" });
}

export function listCustomerBranches(id: string) {
  return apiRequest<CustomerBranchLink[]>(`/logistics/customers/${id}/branches`);
}

export function assignCustomerBranches(
  id: string,
  data: { branchIds: string[]; primaryBranchId?: string },
) {
  return apiRequest<CustomerBranchLink[]>(`/logistics/customers/${id}/branches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function setCustomerPrimaryBranch(id: string, branchId: string) {
  return apiRequest<CustomerBranchLink[]>(`/logistics/customers/${id}/branches/${branchId}/primary`, {
    method: "PATCH",
  });
}

export function removeCustomerBranch(id: string, branchId: string) {
  return apiRequest<CustomerBranchLink[]>(`/logistics/customers/${id}/branches/${branchId}`, {
    method: "DELETE",
  });
}

export type LocationStatus = "ACTIVE" | "INACTIVE" | "DISABLED";
export type LocationType =
  | "CUSTOMER_SITE"
  | "BRANCH_BASE"
  | "PORT"
  | "TERMINAL"
  | "WAREHOUSE"
  | "DISTRIBUTION_CENTER"
  | "DEPOT"
  | "YARD"
  | "CROSS_DOCKING"
  | "BORDER_CROSSING"
  | "FUEL_STATION"
  | "MAINTENANCE_SITE"
  | "SUPPLIER_SITE"
  | "PARKING_AREA"
  | "OTHER";

export type LocationCustomerRef = {
  id: string;
  code: string;
  legalName: string;
  tradeName: string | null;
};

export type LocationBranchLink = {
  id: string;
  branchId: string;
  isPrimary: boolean;
  status: LocationStatus;
  updatedAt: string;
  branch: { id: string; code: string; name: string; status: string };
};

export type LocationRow = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  locationType: LocationType;
  customerId: string | null;
  customer: LocationCustomerRef | null;
  addressLine1: string;
  addressLine2: string | null;
  district: string | null;
  city: string;
  state: string;
  country: string;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  geofenceRadiusMeters: number | null;
  contactName: string | null;
  contactRole: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  operatingHours: string | null;
  accessInstructions: string | null;
  dockInfo: string | null;
  referencePoint: string | null;
  status: LocationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  deletedAt: string | null;
  branches?: LocationBranchLink[];
};

export function listLocations(params?: {
  search?: string;
  status?: LocationStatus;
  locationType?: LocationType;
  branchId?: string;
  customerId?: string;
  city?: string;
  state?: string;
  country?: string;
  hasCoordinates?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) {
  const qs = buildQuery({
    search: params?.search,
    status: params?.status,
    locationType: params?.locationType,
    branchId: params?.branchId,
    customerId: params?.customerId,
    city: params?.city,
    state: params?.state,
    country: params?.country,
    hasCoordinates: params?.hasCoordinates,
    page: params?.page,
    perPage: params?.perPage,
    sortBy: params?.sortBy,
    sortDirection: params?.sortDirection,
  });
  return apiRequestPaginated<LocationRow>(`/logistics/locations${qs}`);
}

export function getLocation(id: string) {
  return apiRequest<LocationRow>(`/logistics/locations/${id}`);
}

export function createLocation(
  data: Partial<LocationRow> & {
    code: string;
    name: string;
    locationType: LocationType;
    addressLine1: string;
    city: string;
    state: string;
    branchIds: string[];
    primaryBranchId?: string;
  },
) {
  return apiRequest<LocationRow>("/logistics/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateLocation(id: string, data: Partial<LocationRow>) {
  return apiRequest<LocationRow>(`/logistics/locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function disableLocation(id: string) {
  return apiRequest<LocationRow>(`/logistics/locations/${id}/disable`, { method: "PATCH" });
}

export function enableLocation(id: string) {
  return apiRequest<LocationRow>(`/logistics/locations/${id}/enable`, { method: "PATCH" });
}

export function deleteLocation(id: string) {
  return apiRequest<{ success: boolean }>(`/logistics/locations/${id}`, { method: "DELETE" });
}

export function listLocationBranches(id: string) {
  return apiRequest<LocationBranchLink[]>(`/logistics/locations/${id}/branches`);
}

export function assignLocationBranches(
  id: string,
  data: { branchIds: string[]; primaryBranchId?: string },
) {
  return apiRequest<LocationBranchLink[]>(`/logistics/locations/${id}/branches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function setLocationPrimaryBranch(id: string, branchId: string) {
  return apiRequest<LocationBranchLink[]>(
    `/logistics/locations/${id}/branches/${branchId}/primary`,
    { method: "PATCH" },
  );
}

export function removeLocationBranch(id: string, branchId: string) {
  return apiRequest<LocationBranchLink[]>(`/logistics/locations/${id}/branches/${branchId}`, {
    method: "DELETE",
  });
}

export type DriverStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "DISABLED";
export type DriverType =
  | "INTERNAL"
  | "THIRD_PARTY"
  | "OWNER_OPERATOR"
  | "AGGREGATED"
  | "TEMPORARY"
  | "OTHER";
export type EmploymentType =
  | "EMPLOYEE"
  | "CONTRACTOR"
  | "FREELANCER"
  | "AGGREGATED"
  | "OUTSOURCED"
  | "OTHER";
export type DriverAvailabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "ON_TRIP"
  | "OFF_DUTY"
  | "ON_VACATION"
  | "ON_LEAVE";
export type DriverDocumentType = "CPF" | "RG" | "CNH" | "PASSPORT" | "RNE" | "OTHER";
export type LicenseCategory = "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE" | "OTHER";

export type DriverBranchLink = {
  id: string;
  branchId: string;
  isPrimary: boolean;
  status: "ACTIVE" | "INACTIVE" | "DISABLED";
  updatedAt: string;
  branch: { id: string; code: string; name: string; status: string };
};

export type DriverRow = {
  id: string;
  tenantId: string;
  code: string;
  fullName: string;
  preferredName: string | null;
  driverType: DriverType;
  employmentType: EmploymentType;
  documentType: DriverDocumentType | null;
  documentNumber: string | null;
  licenseNumber: string | null;
  licenseCategory: LicenseCategory | null;
  licenseState: string | null;
  licenseCountry: string | null;
  licenseIssuedAt: string | null;
  licenseExpiresAt: string | null;
  hasEar: boolean;
  moppCertified: boolean;
  moppExpiresAt: string | null;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  admissionDate: string | null;
  terminationDate: string | null;
  contractorCompanyName: string | null;
  availabilityStatus: DriverAvailabilityStatus;
  status: DriverStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  deletedAt: string | null;
  branches?: DriverBranchLink[];
};

export function listDrivers(params?: {
  search?: string;
  status?: DriverStatus;
  availabilityStatus?: DriverAvailabilityStatus;
  driverType?: DriverType;
  employmentType?: EmploymentType;
  branchId?: string;
  licenseCategory?: LicenseCategory;
  licenseExpiringUntil?: string;
  moppExpiringUntil?: string;
  city?: string;
  state?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) {
  const qs = buildQuery({
    search: params?.search,
    status: params?.status,
    availabilityStatus: params?.availabilityStatus,
    driverType: params?.driverType,
    employmentType: params?.employmentType,
    branchId: params?.branchId,
    licenseCategory: params?.licenseCategory,
    licenseExpiringUntil: params?.licenseExpiringUntil,
    moppExpiringUntil: params?.moppExpiringUntil,
    city: params?.city,
    state: params?.state,
    page: params?.page,
    perPage: params?.perPage,
    sortBy: params?.sortBy,
    sortDirection: params?.sortDirection,
  });
  return apiRequestPaginated<DriverRow>(`/logistics/drivers${qs}`);
}

export function getDriver(id: string) {
  return apiRequest<DriverRow>(`/logistics/drivers/${id}`);
}

export function createDriver(
  data: Partial<DriverRow> & {
    code: string;
    fullName: string;
    driverType: DriverType;
    employmentType: EmploymentType;
    branchIds: string[];
    primaryBranchId?: string;
  },
) {
  return apiRequest<DriverRow>("/logistics/drivers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDriver(id: string, data: Partial<DriverRow>) {
  return apiRequest<DriverRow>(`/logistics/drivers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function disableDriver(id: string) {
  return apiRequest<DriverRow>(`/logistics/drivers/${id}/disable`, { method: "PATCH" });
}

export function enableDriver(id: string) {
  return apiRequest<DriverRow>(`/logistics/drivers/${id}/enable`, { method: "PATCH" });
}

export function deleteDriver(id: string) {
  return apiRequest<{ success: boolean }>(`/logistics/drivers/${id}`, { method: "DELETE" });
}

export function listDriverBranches(id: string) {
  return apiRequest<DriverBranchLink[]>(`/logistics/drivers/${id}/branches`);
}

export function assignDriverBranches(
  id: string,
  data: { branchIds: string[]; primaryBranchId?: string },
) {
  return apiRequest<DriverBranchLink[]>(`/logistics/drivers/${id}/branches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function setDriverPrimaryBranch(id: string, branchId: string) {
  return apiRequest<DriverBranchLink[]>(
    `/logistics/drivers/${id}/branches/${branchId}/primary`,
    { method: "PATCH" },
  );
}

export function removeDriverBranch(id: string, branchId: string) {
  return apiRequest<DriverBranchLink[]>(`/logistics/drivers/${id}/branches/${branchId}`, {
    method: "DELETE",
  });
}
