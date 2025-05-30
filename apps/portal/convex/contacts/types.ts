// Common types used across the contacts module

// Customer type enum
export type CustomerType =
  | "lead"
  | "prospect"
  | "customer"
  | "former-customer"
  | "partner";

// Lead status enum
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "dormant";

// Contact filter type
export interface ContactFilters {
  customerType?: CustomerType;
  leadStatus?: LeadStatus;
  tags?: string[];
}

// Contact address structure
export interface ContactAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Social profiles structure
export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}
