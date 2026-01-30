"use client";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";

export const AffiliateBecomeCard = (props: {
  acceptedTerms: boolean;
  onAcceptedTermsChange: (accepted: boolean) => void;
  onBecome: () => void;
  becoming: boolean;
  error: string | null;
  onRefresh: () => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Become an affiliate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          Create your affiliate profile to generate a referral link and earn rewards.
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="accept-terms"
            checked={props.acceptedTerms}
            onCheckedChange={(v) => props.onAcceptedTermsChange(v === true)}
          />
          <label htmlFor="accept-terms" className="text-sm leading-5">
            I agree to the{" "}
            <a
              href="/terms/affiliates"
              className="font-medium underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              affiliate terms and conditions
            </a>
            .
          </label>
        </div>

        {props.error ? <div className="text-sm text-destructive">{props.error}</div> : null}

        <div className="flex items-center gap-2">
          <Button type="button" onClick={props.onBecome} disabled={!props.acceptedTerms || props.becoming}>
            {props.becoming ? "Creating…" : "Become an affiliate"}
          </Button>
          <Button type="button" variant="outline" onClick={props.onRefresh}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

