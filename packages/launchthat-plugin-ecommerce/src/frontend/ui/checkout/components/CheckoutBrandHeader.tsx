"use client";

import { Lock } from "lucide-react";
import { Skeleton } from "@acme/ui/skeleton";

export const CheckoutBrandHeader = ({
  logoUrl,
  name,
  isLoading,
}: {
  logoUrl?: string;
  name?: string;
  isLoading: boolean;
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <a href="/" className="flex items-center gap-3">
        {isLoading ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : logoUrl ? (
          // Use <img> to avoid requiring Next/Image in a shared package.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name ? `${name} logo` : "Organization logo"}
            className="h-10 w-10 rounded-full object-contain"
          />
        ) : (
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
            {name?.trim()?.[0]?.toUpperCase() ?? "P"}
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              name?.trim() || "Checkout"
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Lock className="h-3 w-3" />
            Secure checkout
          </div>
        </div>
      </a>
    </div>
  );
};
