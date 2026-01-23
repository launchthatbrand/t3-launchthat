"use client";

import type { FunctionReference } from "convex/server";

export interface OrganizationMembershipRow extends Record<string, unknown> {
  organizationId: string;
  role: string;
  isActive: boolean;
  org: {
    _id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
}

export type OrganizationDomainStatus = "unconfigured" | "pending" | "verified" | "error";

export interface OrganizationDomainRow extends Record<string, unknown> {
  _id: string;
  organizationId: string;
  appKey: string;
  hostname: string;
  status: OrganizationDomainStatus;
  verifiedAt?: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrganizationSummaryRow extends Record<string, unknown> {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
}

export interface OrganizationMemberRow extends Record<string, unknown> {
  userId: string;
  role: string;
  isActive: boolean;
}

interface ListOrganizationsByUserIdRef
  extends FunctionReference<
    "query",
    "public",
    { userId: string },
    OrganizationMembershipRow[]
  > {
  readonly __brand?: never;
}

interface CreateOrganizationRef
  extends FunctionReference<
    "mutation",
    "public",
    { userId: string; name: string; slug?: string },
    string
  > {
  readonly __brand?: never;
}

interface GetOrganizationByIdRef
  extends FunctionReference<
    "query",
    "public",
    { organizationId: string },
    OrganizationSummaryRow | null
  > {
  readonly __brand?: never;
}

interface SetActiveOrganizationForUserRef
  extends FunctionReference<
    "mutation",
    "public",
    { userId: string; organizationId: string },
    null
  > {
  readonly __brand?: never;
}

interface ListMembersByOrganizationIdRef
  extends FunctionReference<
    "query",
    "public",
    { organizationId: string },
    OrganizationMemberRow[]
  > {
  readonly __brand?: never;
}

interface EnsureMembershipRef
  extends FunctionReference<
    "mutation",
    "public",
    {
      userId: string;
      organizationId: string;
      role?: "owner" | "admin" | "editor" | "viewer" | "student";
    },
    null
  > {
  readonly __brand?: never;
}

interface RemoveMembershipRef
  extends FunctionReference<
    "mutation",
    "public",
    { userId: string; organizationId: string },
    null
  > {
  readonly __brand?: never;
}

interface ListDomainsForOrgRef
  extends FunctionReference<
    "query",
    "public",
    { organizationId: string; appKey?: string },
    OrganizationDomainRow[]
  > {
  readonly __brand?: never;
}

interface UpsertOrganizationDomainRef
  extends FunctionReference<
    "mutation",
    "public",
    {
      organizationId: string;
      appKey: string;
      hostname: string;
      status?: OrganizationDomainStatus;
    },
    null
  > {
  readonly __brand?: never;
}

interface RemoveOrganizationDomainRef
  extends FunctionReference<
    "mutation",
    "public",
    { organizationId: string; appKey: string; hostname: string },
    null
  > {
  readonly __brand?: never;
}

export interface CoreTenantOrganizationsUiApi {
  launchthat_core_tenant: {
    queries: {
      getOrganizationById?: GetOrganizationByIdRef;
      listOrganizationsByUserId: ListOrganizationsByUserIdRef;
      listDomainsForOrg: ListDomainsForOrgRef;
      listMembersByOrganizationId?: ListMembersByOrganizationIdRef;
    };
    mutations: {
      createOrganization: CreateOrganizationRef;
      setActiveOrganizationForUser: SetActiveOrganizationForUserRef;
      ensureMembership?: EnsureMembershipRef;
      removeMembership?: RemoveMembershipRef;
      upsertOrganizationDomain: UpsertOrganizationDomainRef;
      removeOrganizationDomain: RemoveOrganizationDomainRef;
    };
  };
}

