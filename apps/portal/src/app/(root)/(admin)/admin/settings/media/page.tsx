"use client";

import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Switch } from "@acme/ui/switch";

const DEFAULTS = {
  maxFileSize: 10, // MB
  allowedTypes: "jpg,png,gif,webp,pdf",
  enableImageResizing: false,
};

export default function MediaSettingsPage() {
  const [maxFileSize, setMaxFileSize] = useState(DEFAULTS.maxFileSize);
  const [allowedTypes, setAllowedTypes] = useState(DEFAULTS.allowedTypes);
  const [enableImageResizing, setEnableImageResizing] = useState(
    DEFAULTS.enableImageResizing,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save settings to backend
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
  };

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Media Library Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSave}>
            <div>
              <label
                htmlFor="maxFileSize"
                className="mb-1 block text-sm font-medium"
              >
                Max File Size (MB)
              </label>
              <Input
                id="maxFileSize"
                type="number"
                min={1}
                value={maxFileSize}
                onChange={(e) => setMaxFileSize(Number(e.target.value))}
                className="w-32"
                required
              />
            </div>
            <div>
              <label
                htmlFor="allowedTypes"
                className="mb-1 block text-sm font-medium"
              >
                Allowed File Types
              </label>
              <Input
                id="allowedTypes"
                type="text"
                value={allowedTypes}
                onChange={(e) => setAllowedTypes(e.target.value)}
                placeholder="jpg,png,gif,webp,pdf"
                className="w-full"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Comma-separated list, e.g. jpg,png,gif
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="enableImageResizing"
                checked={enableImageResizing}
                onCheckedChange={setEnableImageResizing}
              />
              <label
                htmlFor="enableImageResizing"
                className="text-sm font-medium"
              >
                Enable Image Resizing
              </label>
            </div>
            <Button type="submit" disabled={saving} className="mt-4 w-full">
              {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
