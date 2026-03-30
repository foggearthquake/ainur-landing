export type LeadFormPayload = {
  telegram_or_email: string;
  project_summary: string;
  consent: boolean;
  website?: string;
  name?: string;
  company?: string;
  budget_range?: string;
};

export type LeadRecord = LeadFormPayload & {
  id: string;
  name: string;
  company: string;
  created_at: string;
  source: string;
  ip_hash: string;
};

export type LeadApiStatus = "success" | "validation_error" | "throttled" | "delivery_error";

export type LeadApiResponse = {
  status: LeadApiStatus;
  message: string;
};
