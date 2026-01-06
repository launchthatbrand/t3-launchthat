"use client";

import type { ReactNode } from "react";

import { CheckoutBrandHeader } from "./CheckoutBrandHeader";

export const CheckoutShell = ({
  orgBrand,
  maxWidth = "max-w-6xl",
  children,
}: {
  orgBrand: { name?: string; logoUrl?: string; isLoading: boolean };
  maxWidth?: string;
  children: ReactNode;
}) => {
  return (
    <div className="bg-muted/30 min-h-screen">
      <div className={`mx-auto w-full ${maxWidth} px-4 py-8`}>
        <CheckoutBrandHeader
          isLoading={orgBrand.isLoading}
          logoUrl={orgBrand.logoUrl}
          name={orgBrand.name}
        />
        <div className="mt-6">{children}</div>
        <div className="text-muted-foreground mt-10 border-t pt-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>Payments are processed securely.</div>
            <div>
              <a href="/" className="hover:text-foreground underline">
                Return to site
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


