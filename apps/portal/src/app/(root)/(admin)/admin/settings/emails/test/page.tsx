"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { useTenant } from "~/context/TenantContext";

export default function AdminEmailTestPage() {
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;
   
  const sendTestEmail = useAction(
    api.core.emails.reactEmailRender.sendTestEmail,
  ) as (args: {
    orgId: Id<"organizations">;
    to: string;
  }) => Promise<Id<"emailOutbox">>;

  const [testTo, setTestTo] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async () => {
    if (!orgId) return;
    setIsSending(true);
    try {
      const outboxId: Id<"emailOutbox"> = await sendTestEmail({
        orgId,
        to: testTo,
      });
      toast.success("Test email queued", { description: String(outboxId) });
    } catch (err) {
      toast.error("Failed to send test email", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test send</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="testTo">Recipient email</Label>
            <Input
              id="testTo"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex items-end justify-end">
            <Button
              disabled={!orgId || isSending || testTo.length === 0}
              onClick={() => void handleSendTest()}
            >
              Send test email
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          Test send uses template key <code>core.email.test</code>.
        </div>
      </CardContent>
    </Card>
  );
}
