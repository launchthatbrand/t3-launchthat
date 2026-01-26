"use client";

import * as React from "react";
import { useMutation } from "convex/react";

import { Button } from "@acme/ui/button";
import { api } from "@convex-config/_generated/api";

const buildIssueBody = (error: Error & { digest?: string }): string => {
  const parts: string[] = [];
  try {
    parts.push(`URL: ${typeof window !== "undefined" ? window.location.href : "unknown"}`);
  } catch {
    parts.push("URL: unknown");
  }
  parts.push(`Time: ${new Date().toISOString()}`);
  if (error.digest) parts.push(`Digest: ${error.digest}`);
  if (error.message) parts.push(`\nMessage:\n${error.message}`);
  if (error.stack) parts.push(`\nStack:\n${error.stack}`);
  try {
    parts.push(`\nUser agent:\n${navigator.userAgent}`);
  } catch {
    // ignore
  }
  return parts.join("\n");
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const createThread = useMutation(api.feedback.mutations.createThread);
  const [submitting, setSubmitting] = React.useState(false);
  const [submittedId, setSubmittedId] = React.useState<string>("");
  const [submitError, setSubmitError] = React.useState<string>("");

  React.useEffect(() => {
    console.error("[AppErrorBoundary]", error);
  }, [error]);

  const handleGoDashboard = () => {
    window.location.assign("/admin/dashboard");
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const title = `Issue: ${typeof window !== "undefined" ? window.location.pathname : "unknown"}`;
      const body = buildIssueBody(error);
      const threadId = (await createThread({ title, body, type: "issue" })) as unknown as string;
      if (typeof threadId === "string" && threadId) {
        setSubmittedId(threadId);
        window.location.assign(`/admin/feedback/${encodeURIComponent(threadId)}`);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit error report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 px-4">
      <div className="w-full rounded-xl border border-border/60 bg-card/70 p-6 text-foreground backdrop-blur">
        <h2 className="text-lg font-semibold">Sorry there was an issue loading this page</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can go back to the dashboard, retry, or submit an error report so we can fix it.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" className="bg-orange-600 text-white hover:bg-orange-700" onClick={handleGoDashboard}>
            Go To Dashboard
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting || Boolean(submittedId)}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Submitting…" : "Submit Error Report"}
          </Button>
        </div>

        {submitError ? (
          <div className="mt-3 text-sm text-red-400">{submitError}</div>
        ) : null}

        {error.message ? (
          <pre className="mt-5 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-foreground/80">
            {error.message}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

