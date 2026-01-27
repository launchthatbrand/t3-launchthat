"use client";

import * as React from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { api } from "@convex-config/_generated/api";

export type GlobalPermissions = {
  globalEnabled: boolean;
  tradeIdeasEnabled: boolean;
  openPositionsEnabled: boolean;
  ordersEnabled: boolean;
};

export type FeatureType = "tradeIdeas" | "openPositions" | "orders";

export const isFeatureEnabled = (perms: GlobalPermissions, feature: FeatureType): boolean => {
  if (perms.globalEnabled) return true;
  if (feature === "tradeIdeas") return perms.tradeIdeasEnabled;
  if (feature === "openPositions") return perms.openPositionsEnabled;
  return perms.ordersEnabled;
};

export const useGlobalPermissions = () => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const entitlements = useQuery(
    api.accessPolicy.getMyEntitlements,
    shouldQuery ? {} : "skip",
  ) as
    | {
        isSignedIn: boolean;
        features: { journal: boolean; tradeIdeas: boolean; analytics: boolean; orders: boolean };
      }
    | undefined;

  const permissions: GlobalPermissions | undefined = entitlements
    ? {
        // Back-compat “master enable” semantics.
        globalEnabled:
          Boolean(entitlements.features.journal) &&
          Boolean(entitlements.features.tradeIdeas) &&
          Boolean(entitlements.features.orders),
        tradeIdeasEnabled: Boolean(entitlements.features.tradeIdeas),
        openPositionsEnabled: Boolean(entitlements.features.journal),
        ordersEnabled: Boolean(entitlements.features.orders),
      }
    : undefined;

  const isLoading = authLoading || (shouldQuery && permissions === undefined);

  return { permissions, isLoading, isAuthenticated };
};

export const FeatureAccessGate = ({
  feature,
  title = "Access restricted",
  description = "You do not have access to this feature.",
  children,
}: {
  feature: FeatureType;
  title?: string;
  description?: string;
  children: React.ReactNode;
}) => {
  const { permissions, isLoading, isAuthenticated } = useGlobalPermissions();

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  const hasAccess =
    Boolean(isAuthenticated) &&
    Boolean(permissions) &&
    isFeatureEnabled(permissions as GlobalPermissions, feature);

  if (!hasAccess) {
    return (
      <Alert className="bg-background/40">
        <ShieldAlert />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export const FeatureAccessAlert = ({
  title = "Access restricted",
  description = "You do not have access to this feature.",
}: {
  title?: string;
  description?: string;
}) => {
  return (
    <Alert className="bg-background/40">
      <ShieldAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};
