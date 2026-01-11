"use client";

import React from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

type Props = {
  productPostId: string;
  canEdit: boolean;
};

const parseOptionalInt = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
};

export const PortalOrgPlanProductSection = ({ productPostId, canEdit }: Props) => {
  const plan = useQuery(api.plugins.commerce.orgPlans.getOrgPlanForProduct, {
    productPostId,
  }) as any;

  const upsert = useMutation(api.plugins.commerce.orgPlans.upsertOrgPlanForProduct);
  const deactivate = useMutation(
    api.plugins.commerce.orgPlans.deactivateOrgPlanForProduct,
  );

  const isEnabled = Boolean(plan?.isActive);

  const [displayName, setDisplayName] = React.useState("");
  const [discordAiDaily, setDiscordAiDaily] = React.useState("");
  const [supportBubbleAiDaily, setSupportBubbleAiDaily] = React.useState("");
  const [crmMaxContacts, setCrmMaxContacts] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!plan) return;
    setDisplayName(typeof plan.displayName === "string" ? plan.displayName : "");
    setDiscordAiDaily(
      typeof plan.limits?.discordAiDaily === "number"
        ? String(plan.limits.discordAiDaily)
        : "",
    );
    setSupportBubbleAiDaily(
      typeof plan.limits?.supportBubbleAiDaily === "number"
        ? String(plan.limits.supportBubbleAiDaily)
        : "",
    );
    setCrmMaxContacts(
      typeof plan.limits?.crmMaxContacts === "number"
        ? String(plan.limits.crmMaxContacts)
        : "",
    );
  }, [plan?._id]);

  const handleToggle = async (checked: boolean) => {
    if (!canEdit) return;
    try {
      setIsSaving(true);
      if (!checked) {
        await deactivate({ productPostId });
        toast.success("Removed from organization plans");
        return;
      }

      await upsert({
        productPostId,
        isActive: true,
        displayName: displayName.trim() || undefined,
        limits: {
          discordAiDaily: parseOptionalInt(discordAiDaily),
          supportBubbleAiDaily: parseOptionalInt(supportBubbleAiDaily),
          crmMaxContacts: parseOptionalInt(crmMaxContacts),
        },
      });
      toast.success("Marked as organization plan");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update plan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit || !isEnabled) return;
    try {
      setIsSaving(true);
      await upsert({
        productPostId,
        isActive: true,
        displayName: displayName.trim() || undefined,
        limits: {
          discordAiDaily: parseOptionalInt(discordAiDaily),
          supportBubbleAiDaily: parseOptionalInt(supportBubbleAiDaily),
          crmMaxContacts: parseOptionalInt(crmMaxContacts),
        },
      });
      toast.success("Plan limits saved");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Organization plan (portal root)</CardTitle>
        <p className="text-muted-foreground text-sm">
          Mark this product as an assignable plan for organizations, and configure
          plan limits.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-3">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Use as organization plan</div>
            <div className="text-muted-foreground text-xs">
              When enabled, this product will appear in the organization plan picker.
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!canEdit || isSaving}
          />
        </div>

        {isEnabled ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-plan-display-name">Plan display name</Label>
              <Input
                id="org-plan-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                placeholder="e.g. Free, Pro, Enterprise"
                disabled={!canEdit || isSaving}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="org-plan-discord-ai-daily">
                  Discord AI daily budget
                </Label>
                <Input
                  id="org-plan-discord-ai-daily"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={discordAiDaily}
                  onChange={(e) => setDiscordAiDaily(e.currentTarget.value)}
                  placeholder="e.g. 200"
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-plan-support-bubble-ai-daily">
                  Support bubble AI daily budget
                </Label>
                <Input
                  id="org-plan-support-bubble-ai-daily"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={supportBubbleAiDaily}
                  onChange={(e) => setSupportBubbleAiDaily(e.currentTarget.value)}
                  placeholder="e.g. 200"
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-plan-crm-max-contacts">CRM max contacts</Label>
                <Input
                  id="org-plan-crm-max-contacts"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={crmMaxContacts}
                  onChange={(e) => setCrmMaxContacts(e.currentTarget.value)}
                  placeholder="e.g. 1000"
                  disabled={!canEdit || isSaving}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canEdit || isSaving}
              >
                Save plan limits
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};


