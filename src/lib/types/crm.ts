// src/lib/types/crm.ts
export type CRMStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface OnboardingDoc {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;

  brandDifferentiation?: string;
  currentWebsiteIssues?: string;
  customerAcquisition?: string;
  customerObjections?: string;
  designElements?: string;
  desiredFeelings?: string;
  futureFeatures?: string;
  inspirationalBrands?: string;
  longTermVision?: string;
  popularOfferings?: string;
  pricingStrategy?: string;
  requiredIntegrations?: string;
  storytellingBalance?: string;
  successDefinition?: string;
  unexpectedValue?: string;
  userTracking?: string;
  websiteRole?: string;

  status: CRMStatus;
  ownerUid?: string;
  score?: number;
  tags?: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
