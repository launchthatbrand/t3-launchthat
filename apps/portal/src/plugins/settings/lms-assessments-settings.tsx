"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

import type { PluginSettingComponentProps } from "~/lib/plugins/types";

export function LmsAssessmentsSettings({
  pluginName,
}: PluginSettingComponentProps) {
  const [isSaving, startTransition] = useTransition();
  const [passingScore, setPassingScore] = useState(80);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(3);

  const handleSubmit = () => {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`${pluginName} assessments updated`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <div className="grid gap-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="passing-score">Passing score (%)</Label>
            <Input
              id="passing-score"
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(event) =>
                setPassingScore(Number(event.target.value ?? 0))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <Label className="text-base">Allow quiz retakes</Label>
              <p className="text-sm text-muted-foreground">
                Learners can restart failed quizzes.
              </p>
            </div>
            <Switch
              checked={allowRetakes}
              onCheckedChange={(checked) => {
                setAllowRetakes(checked);
                if (!checked) {
                  setMaxAttempts(1);
                }
              }}
            />
          </div>
          {allowRetakes ? (
            <div className="space-y-2">
              <Label htmlFor="max-attempts">Maximum attempts</Label>
              <Input
                id="max-attempts"
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(event) =>
                  setMaxAttempts(Math.max(1, Number(event.target.value ?? 1)))
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}












