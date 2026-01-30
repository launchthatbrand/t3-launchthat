"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { AffiliateSponsorLink } from "./types";
import { stripClerkIssuerPrefix } from "./utils";

const getInitials = (name: string): string => {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? "" : "";
  const initials = (first + last).toUpperCase();
  return initials || "U";
};

export const AffiliateSponsorCard = (props: {
  sponsorLink: AffiliateSponsorLink | null | undefined;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your sponsor (upline)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {props.sponsorLink === undefined ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : props.sponsorLink ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-24 rounded-xl">
              <AvatarImage
                src={props.sponsorLink.sponsorImage ?? ""}
                alt={props.sponsorLink.sponsorName ?? "Sponsor"}
              />
              <AvatarFallback className="rounded-xl">
                {getInitials(props.sponsorLink.sponsorName ?? "User")}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="text-sm font-semibold">
                {props.sponsorLink.sponsorName ??
                  stripClerkIssuerPrefix(props.sponsorLink.sponsorUserId)}
              </div>
              <div className="text-muted-foreground text-xs font-mono">
                {stripClerkIssuerPrefix(props.sponsorLink.sponsorUserId)}
              </div>
              <div className="text-muted-foreground text-xs">
                Joined{" "}
                {props.sponsorLink.createdAt
                  ? new Date(props.sponsorLink.createdAt).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No sponsor linked.</div>
        )}
      </CardContent>
    </Card>
  );
};

