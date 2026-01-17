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
import { Textarea } from "@acme/ui/textarea";

import { useTenant } from "~/context/TenantContext";

type StepDraft = {
  id: string;
  title: string;
  description: string;
  route: string;
  required: boolean;
};

const createStep = (): StepDraft => ({
  id: `step-${Date.now()}`,
  title: "",
  description: "",
  route: "",
  required: true,
});

export default function AdminOnboardingSettingsPage() {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const config = useQuery(
    api.plugins.onboarding.queries.getOnboardingConfig,
    organizationId ? { organizationId: String(organizationId) } : "skip",
  );
  const upsertConfig = useMutation(
    api.plugins.onboarding.mutations.upsertOnboardingConfig,
  );

  const [enabled, setEnabled] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [ctaLabel, setCtaLabel] = React.useState("Continue onboarding");
  const [ctaRoute, setCtaRoute] = React.useState("/admin/onboarding");
  const [steps, setSteps] = React.useState<Array<StepDraft>>([createStep()]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!config) return;
    setEnabled(Boolean(config.enabled));
    setTitle(config.title ?? "Complete onboarding");
    setDescription(
      config.description ??
        "Finish these steps before accessing the rest of the portal.",
    );
    setCtaLabel(config.ctaLabel ?? "Continue onboarding");
    setCtaRoute(config.ctaRoute ?? "/admin/onboarding");
    setSteps(
      (config.steps ?? []).map((step: any) => ({
        id: String(step.id),
        title: String(step.title ?? ""),
        description: String(step.description ?? ""),
        route: String(step.route ?? ""),
        required: step.required !== false,
      })),
    );
  }, [config]);

  const handleStepChange = (
    index: number,
    next: Partial<StepDraft>,
  ): void => {
    setSteps((prev) =>
      prev.map((step, idx) => (idx === index ? { ...step, ...next } : step)),
    );
  };

  const handleAddStep = () => {
    setSteps((prev) => [...prev, createStep()]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!organizationId) return;
    setSaving(true);
    try {
      const normalizedSteps = steps
        .filter((step) => step.title.trim())
        .map((step) => ({
          id: step.id,
          title: step.title.trim(),
          description: step.description.trim() || undefined,
          route: step.route.trim() || undefined,
          required: step.required,
        }));
      await upsertConfig({
        organizationId: String(organizationId),
        enabled,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        ctaRoute: ctaRoute.trim() || undefined,
        steps: normalizedSteps,
      });
      toast.success("Onboarding settings saved");
    } catch (error) {
      toast.error("Failed to save onboarding settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure the onboarding flow shown to members before they access the
          portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gate settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">
                Enable onboarding gate
              </div>
              <div className="text-xs text-muted-foreground">
                When enabled, users must complete onboarding steps to proceed.
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="onboardingTitle">Modal title</Label>
              <Input
                id="onboardingTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">CTA label</Label>
              <Input
                id="ctaLabel"
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctaRoute">CTA route</Label>
              <Input
                id="ctaRoute"
                value={ctaRoute}
                onChange={(event) => setCtaRoute(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboardingDescription">Modal description</Label>
            <Textarea
              id="onboardingDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-lg border border-border/60 p-4 space-y-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Step title</Label>
                  <Input
                    value={step.title}
                    onChange={(event) =>
                      handleStepChange(index, { title: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Route (optional)</Label>
                  <Input
                    value={step.route}
                    onChange={(event) =>
                      handleStepChange(index, { route: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={step.description}
                  onChange={(event) =>
                    handleStepChange(index, { description: event.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.required}
                    onCheckedChange={(checked) =>
                      handleStepChange(index, { required: checked })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    Required
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveStep(index)}
                >
                  Remove step
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddStep}>
            Add step
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !organizationId}>
          {saving ? "Saving..." : "Save onboarding"}
        </Button>
      </div>
    </div>
  );
}
