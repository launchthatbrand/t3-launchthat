"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { api } from "@convex-config/_generated/api";
import { useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";

const readCookie = (key: string): string | null => {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${key}=`)) continue;
    const value = part.slice(`${key}=`.length);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
};

const clearCookie = (key: string) => {
  if (typeof document === "undefined") return;
  // Ensure we match the cookie path we set elsewhere (`/`).
  document.cookie = `${key}=; path=/; max-age=0; samesite=lax`;
};

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  try {
    return String(err);
  } catch {
    return "";
  }
};

export const AffiliateSponsorOptInDialog = () => {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const sponsorLink = useQuery(
    api.traderlaunchpad.affiliates.getMySponsorLink,
    isAuthenticated && !isLoading ? {} : "skip",
  ) as { userId: string; sponsorUserId: string } | null | undefined;
  const join = useMutation(api.traderlaunchpad.affiliates.joinMySponsorNetwork);

  const [open, setOpen] = React.useState(false);
  const [referralCode, setReferralCode] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (pathname.startsWith("/platform")) return;
    if (pathname.startsWith("/admin")) return;
    if (!isAuthenticated || isLoading) return;

    // Only prompt if logged in (query resolved to null or object) and not already linked.
    if (sponsorLink === undefined) return; // loading
    if (sponsorLink) return;

    const code = readCookie("lt_aff_ref");
    const normalized = typeof code === "string" ? code.trim().toLowerCase() : "";
    if (!normalized) return;

    // Respect a local “declined” flag per referral code.
    const declineKey = `lt_aff_sponsor_declined:${normalized}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(declineKey) === "1") return;

    setReferralCode(normalized);
    setOpen(true);
  }, [isAuthenticated, isLoading, pathname, sponsorLink]);

  if (!referralCode) return null;

  const declineKey = `lt_aff_sponsor_declined:${referralCode}`;

  const handleDecline = () => {
    try {
      window.localStorage.setItem(declineKey, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await join({ referralCode });
      setOpen(false);
      // Once the sponsor choice is made, we no longer need the invite code cookie.
      clearCookie("lt_aff_ref");
    } catch (err) {
      console.error("[AffiliateSponsorOptInDialog] join failed", err);

      // If the invite code belongs to the current user (self-sponsorship), clear the cookie
      // so we don't keep re-prompting on refresh.
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("cannot sponsor yourself")) {
        clearCookie("lt_aff_ref");
        setOpen(false);
        setReferralCode(null);
        try {
          window.localStorage.setItem(declineKey, "1");
        } catch {
          // ignore
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join affiliate network?</DialogTitle>
          <DialogDescription>
            You visited with an affiliate invite code. If you join, your future affiliate sales can also benefit your
            sponsor.
          </DialogDescription>
        </DialogHeader>

        <div className="text-muted-foreground text-xs">
          Invite code: <span className="font-mono">{referralCode}</span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="text-foreground" onClick={handleDecline} disabled={isSubmitting}>
            Not now
          </Button>
          <Button onClick={handleAccept} disabled={isSubmitting}>
            {isSubmitting ? "Joining…" : "Join"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

