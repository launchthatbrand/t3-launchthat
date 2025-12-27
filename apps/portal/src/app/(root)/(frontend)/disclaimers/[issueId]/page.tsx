"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { SignatureMaker } from "@docuseal/signature-maker-react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "sonner";

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = new Uint8Array(digest);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export default function DisclaimerSignPage({
  params,
}: {
  params: { issueId: string };
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setTokenHash(null);
      return;
    }
    void sha256Hex(token).then((hash) => {
      if (!cancelled) setTokenHash(hash);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signingContext = useQuery(
    api.plugins.disclaimers.queries.getSigningContext,
    tokenHash ? { issueId: params.issueId, tokenHash } : undefined,
  ) as
    | {
        status: "incomplete" | "complete";
        recipientEmail: string;
        recipientName?: string | null;
        template: {
          title: string;
          pdfUrl: string;
          pdfVersion: number;
          consentText: string;
        };
      }
    | null
    | undefined;

  const submitSignature = useAction(
    api.plugins.disclaimers.actions.submitSignature,
  ) as (args: {
    issueId: string;
    tokenHash: string;
    signatureDataUrl: string;
    signedName: string;
    signedEmail: string;
    consentText: string;
    userAgent?: string;
  }) => Promise<{ signatureId: string; signedPdfFileId: string }>;

  const [signedName, setSignedName] = useState("");
  const [signedEmail, setSignedEmail] = useState("");
  const [hasConsented, setHasConsented] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!signingContext) return;
    if (signedEmail.trim().length === 0) {
      setSignedEmail(signingContext.recipientEmail);
    }
    if (signedName.trim().length === 0 && signingContext.recipientName) {
      setSignedName(signingContext.recipientName);
    }
  }, [signingContext, signedEmail, signedName]);

  const signatureDataUrl = useMemo(() => {
    if (!signatureBase64) return null;
    if (signatureBase64.startsWith("data:")) return signatureBase64;
    return `data:image/png;base64,${signatureBase64}`;
  }, [signatureBase64]);

  const handleSubmit = () => {
    if (!tokenHash) {
      toast.error("Missing token.");
      return;
    }
    if (!signingContext) {
      toast.error("Invalid or expired link.");
      return;
    }
    if (signingContext.status !== "incomplete") {
      toast.error("This disclaimer has already been completed.");
      return;
    }
    if (!hasConsented) {
      toast.error("Please confirm consent.");
      return;
    }
    if (!signedName.trim()) {
      toast.error("Enter your name.");
      return;
    }
    if (!signedEmail.trim()) {
      toast.error("Enter your email.");
      return;
    }
    if (!signatureDataUrl) {
      toast.error("Please add a signature.");
      return;
    }

    startTransition(() => {
      void submitSignature({
        issueId: params.issueId,
        tokenHash,
        signatureDataUrl,
        signedName: signedName.trim(),
        signedEmail: signedEmail.trim().toLowerCase(),
        consentText: signingContext.template.consentText,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      })
        .then(() => {
          toast.success("Signed. Thank you!");
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Failed to submit signature");
        });
    });
  };

  const isLoading = signingContext === undefined && tokenHash !== null;
  const invalid = signingContext === null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div className="space-y-1">
        <div className="text-2xl font-semibold">Sign disclaimer</div>
        <div className="text-muted-foreground text-sm">
          Review the document and sign to complete.
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : null}

      {invalid ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This link is invalid or expired.
          </CardContent>
        </Card>
      ) : null}

      {signingContext ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>{signingContext.template.title}</CardTitle>
              <CardDescription>
                Version {signingContext.template.pdfVersion}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border">
                <iframe
                  title="Disclaimer PDF"
                  src={signingContext.template.pdfUrl}
                  className="h-[70vh] w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your signature</CardTitle>
              <CardDescription>
                Your signed PDF will be stored as evidence for compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={signedName} onChange={(e) => setSignedName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={signedEmail}
                    onChange={(e) => setSignedEmail(e.target.value)}
                    inputMode="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Signature</Label>
                <div className="rounded-md border p-2">
                  <SignatureMaker
                    withUpload={false}
                    withSubmit={false}
                    downloadOnSave={false}
                    onChange={(event: any) => {
                      setSignatureBase64(typeof event?.base64 === "string" ? event.base64 : null);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={hasConsented}
                  onCheckedChange={(v) => setHasConsented(Boolean(v))}
                />
                <Label htmlFor="consent" className="leading-snug">
                  {signingContext.template.consentText}
                </Label>
              </div>

              {signingContext.status === "complete" ? (
                <div className="text-sm text-muted-foreground">
                  This disclaimer is already complete.
                </div>
              ) : (
                <Button onClick={handleSubmit} disabled={isPending}>
                  Submit signature
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}


