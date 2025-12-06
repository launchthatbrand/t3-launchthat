"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { useState } from "react";

export function MediaSettingsForm() {
  const [maxSize, setMaxSize] = useState("2048");
  const [enableCompression, setEnableCompression] = useState(true);
  const [defaultVisibility, setDefaultVisibility] = useState("published");

  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="max-size">Max upload size (MB)</Label>
        <Input
          id="max-size"
          type="number"
          min={1}
          value={maxSize}
          onChange={(event) => setMaxSize(event.target.value)}
        />
        <p className="text-muted-foreground text-sm">
          Applies to all local uploads. External connectors can override this.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border p-4">
        <div>
          <p className="font-medium">Enable automatic compression</p>
          <p className="text-muted-foreground text-sm">
            Lightly optimize images on upload to reduce bandwidth.
          </p>
        </div>
        <Switch
          checked={enableCompression}
          onCheckedChange={setEnableCompression}
        />
      </div>

      <div className="space-y-2">
        <Label>Default visibility</Label>
        <Select value={defaultVisibility} onValueChange={setDefaultVisibility}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="button">Save changes</Button>
    </form>
  );
}
