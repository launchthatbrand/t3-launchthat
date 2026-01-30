import type { ReactNode } from "react";

export interface AffiliateSponsorLink extends Record<string, unknown> {
  userId: string;
  sponsorUserId: string;
  sponsorName?: string;
  sponsorImage?: string;
  createdAt: number;
  createdSource: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface AffiliateDownlineRow extends Record<string, unknown> {
  userId: string;
  name: string;
  joinedAt: number;
  createdSource: string;
}

export interface AffiliateRecruitRow extends Record<string, unknown> {
  referredUserId: string;
  name: string;
  attributedAt: number;
  activatedAt?: number;
  firstPaidConversionAt?: number;
  utmContent?: string;
  shortlinkCode?: string;
}

export interface AffiliateCreditEventRow extends Record<string, unknown> {
  kind?: string;
  amountCents: number;
  currency: string;
  reason: string;
  externalEventId?: string;
  createdAt: number;
  referredUserId?: string;
  referrerUserId?: string;
  conversionId?: string;
  utmContent?: string;
  shortlinkCode?: string;
}

export interface AffiliateTopLandingPaths {
  daysBack: number;
  topLandingPaths: { path: string; clicks: number }[];
}

export interface AffiliateShareLinkRow extends Record<string, unknown> {
  code: string;
  url?: string;
  path: string;
  createdAt: number;
  clickCount?: number;
  lastAccessAt?: number;
  campaign: string;
  templateId: string;
  signups: number;
  activations: number;
  paid: number;
  earningsCents: number;
}

export interface AffiliatePayoutSettings {
  payoutAccountStatus: string | null;
  payoutPolicy: "payout_only" | "apply_to_subscription_then_payout";
  minPayoutCents: number;
  creditBalanceCents: number;
  upcomingSubscriptionDueCents: number;
  payoutError: string | null;
  payoutLoading: boolean;
  onConnectOrManage: () => void;
  onDisconnectTest: () => void;
  onRefresh: () => void;
  onSetPolicy: (policy: "payout_only" | "apply_to_subscription_then_payout") => void;
  onSetMinPayoutCents: (minPayoutCents: number) => void;
}

export interface AffiliateShareKitTemplate {
  id: string;
  label: string;
  text: string;
}

export interface AffiliateShareKitCardProps {
  landingPath: string;
  onLandingPathChange: (next: string) => void;
  campaign: string;
  onCampaignChange: (next: string) => void;
  referralUrl: string | null;
  utmLink: string | null;
  shortUrl: string | null;
  onGenerateShortlink: () => void;
  shortlinkLoading: boolean;
  shortlinkError: string | null;
  templates: AffiliateShareKitTemplate[];
  selectedTemplateId: string;
  onSelectTemplateId: (id: string) => void;
  onCopy: (text: string) => void;
  onOpenX: () => void;
  onOpenLinkedIn: () => void;
  onShare: () => void;
  qrNode?: ReactNode;
  secondaryShareNode?: ReactNode;
  creditBalanceCents: number;
}

