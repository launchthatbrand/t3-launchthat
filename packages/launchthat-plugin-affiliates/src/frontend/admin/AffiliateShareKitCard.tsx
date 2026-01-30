"use client";

import type { ReactNode } from "react";
import * as React from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";

import type { AffiliateShareKitCardProps } from "./types";
import { formatUsd } from "./utils";

export const AffiliateShareKitCard = (props: AffiliateShareKitCardProps) => {
  const selectedTemplate =
    props.templates.find((t) => t.id === props.selectedTemplateId) ?? props.templates[0];

  const shareUrl = props.shortUrl ?? props.utmLink ?? props.referralUrl;
  const shortUrl = props.shortUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share kit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs">Landing path</div>
          <Input
            value={props.landingPath}
            onChange={(e) => props.onLandingPathChange(e.target.value)}
            placeholder="/"
          />
        </div>

        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs">Campaign</div>
          <Input
            value={props.campaign}
            onChange={(e) => props.onCampaignChange(e.target.value)}
            placeholder="affiliate"
          />
          <div className="text-muted-foreground text-xs">
            Used to build UTM links so you can test which content converts best.
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs">Referral URL</div>
          <div className="flex items-center gap-2">
            <Input value={props.referralUrl ?? ""} readOnly />
            <Button
              type="button"
              variant="outline"
              onClick={() => (props.referralUrl ? props.onCopy(props.referralUrl) : null)}
              disabled={!props.referralUrl}
            >
              Copy
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input value={props.utmLink ?? ""} readOnly />
            <Button
              type="button"
              variant="outline"
              onClick={() => (props.utmLink ? props.onCopy(props.utmLink) : null)}
              disabled={!props.utmLink}
            >
              Copy UTM link
            </Button>
          </div>
          {props.secondaryShareNode ? (
            <div className="text-muted-foreground text-xs">{props.secondaryShareNode}</div>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs">Tracked short link</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={props.onGenerateShortlink} disabled={props.shortlinkLoading}>
              {props.shortlinkLoading ? "Generating…" : "Generate short link"}
            </Button>
            {shortUrl ? (
              <Button type="button" variant="outline" onClick={() => props.onCopy(shortUrl)}>
                Copy short link
              </Button>
            ) : null}
          </div>
          <Input value={props.shortUrl ?? ""} readOnly placeholder="/s/..." />
          {props.shortlinkError ? (
            <div className="text-sm text-destructive">{props.shortlinkError}</div>
          ) : null}
          <div className="text-muted-foreground text-xs">
            Use this link in posts. Clicks will be tracked on the shortlink itself.
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs">Template</div>
          <div className="flex flex-wrap gap-2">
            {props.templates.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant={props.selectedTemplateId === t.id ? "default" : "outline"}
                onClick={() => props.onSelectTemplateId(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <Textarea value={selectedTemplate?.text ?? ""} readOnly className="min-h-[120px]" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (selectedTemplate?.text ? props.onCopy(selectedTemplate.text) : null)}
              disabled={!selectedTemplate?.text}
            >
              Copy text
            </Button>
            <Button type="button" variant="outline" onClick={props.onOpenX} disabled={!selectedTemplate?.text}>
              Open X
            </Button>
            <Button type="button" variant="outline" onClick={props.onOpenLinkedIn} disabled={!shareUrl}>
              Open LinkedIn
            </Button>
            <Button type="button" variant="outline" onClick={props.onShare} disabled={!shareUrl}>
              Share…
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs">QR code</div>
          {props.qrNode ? (
            props.qrNode
          ) : (
            <div className="text-muted-foreground text-xs">QR not available.</div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="text-muted-foreground text-xs">Credit balance</div>
          <div className="mt-1 font-semibold">{formatUsd(props.creditBalanceCents)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

