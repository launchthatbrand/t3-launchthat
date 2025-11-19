"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

import type { PluginSettingComponentProps } from "~/lib/plugins/types";

export function LmsGeneralSettings({
  pluginName,
}: PluginSettingComponentProps) {
  const [isSaving, startTransition] = useTransition();
  const [title, setTitle] = useState("Learning Portal");
  const [description, setDescription] = useState(
    "Configure the default LMS branding and learner experience.",
  );
  const [enablePrerequisites, setEnablePrerequisites] = useState(true);

  const handleSubmit = () => {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`${pluginName} settings saved`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="lms-title">Portal name</Label>
          <Input
            id="lms-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Acme Learning"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lms-description">Description</Label>
          <Textarea
            id="lms-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <Label className="text-base">Enable course prerequisites</Label>
            <p className="text-sm text-muted-foreground">
              Learners must finish the previous lesson before continuing.
            </p>
          </div>
          <Switch
            checked={enablePrerequisites}
            onCheckedChange={setEnablePrerequisites}
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}


