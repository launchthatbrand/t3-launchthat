"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { usePathname } from "next/navigation";

import { api } from "@convex-config/_generated/api";

import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";

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

export const AffiliateSponsorOptInDialog = () => {
  const pathname = usePathname();
  const sponsorLink = useQuery(api.traderlaunchpad.affiliates.getMySponsorLink, {});
  const join = useMutation(api.traderlaunchpad.affiliates.joinMySponsorNetwork);

  const [open, setOpen] = React.useState(false);
  const [referralCode, setReferralCode] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (pathname.startsWith("/platform")) return;
    if (pathname.startsWith("/admin")) return;

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
  }, [pathname, sponsorLink]);

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
    } catch (err) {
      console.error("[AffiliateSponsorOptInDialog] join failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
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
          <Button variant="outline" onClick={handleDecline} disabled={isSubmitting}>
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

