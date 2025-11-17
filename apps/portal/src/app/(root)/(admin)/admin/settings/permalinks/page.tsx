"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Info, Loader2, Save } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

const PERMALINK_OPTION_KEY = "permalink_settings";
const SITE_BASE_URL = "http://mediasync.local";

type PermalinkStructure =
  | "plain"
  | "day-name"
  | "month-name"
  | "numeric"
  | "post-name"
  | "custom";

interface PermalinkSettings {
  structure: PermalinkStructure;
  customStructure: string;
  categoryBase: string;
  tagBase: string;
  trailingSlash: boolean;
}

const defaultSettings: PermalinkSettings = {
  structure: "post-name",
  customStructure: "/%category%/%postname%/",
  categoryBase: "",
  tagBase: "",
  trailingSlash: true,
};

const STRUCTURE_OPTIONS: Array<{
  value: PermalinkStructure;
  label: string;
  pattern: string;
  sample: string;
  description?: string;
}> = [
  {
    value: "plain",
    label: "Plain",
    pattern: "/?p=123",
    sample: `${SITE_BASE_URL}/?p=123`,
  },
  {
    value: "day-name",
    label: "Day and name",
    pattern: "/%year%/%monthnum%/%day%/%postname%/",
    sample: `${SITE_BASE_URL}/2025/11/16/sample-post/`,
  },
  {
    value: "month-name",
    label: "Month and name",
    pattern: "/%year%/%monthnum%/%postname%/",
    sample: `${SITE_BASE_URL}/2025/11/sample-post/`,
  },
  {
    value: "numeric",
    label: "Numeric",
    pattern: "/archives/%post_id%",
    sample: `${SITE_BASE_URL}/archives/123`,
  },
  {
    value: "post-name",
    label: "Post name",
    pattern: "/%postname%/",
    sample: `${SITE_BASE_URL}/sample-post/`,
  },
  {
    value: "custom",
    label: "Custom Structure",
    pattern: "",
    sample: `${SITE_BASE_URL}/%category%/%postname%/`,
    description: "Customize permalink structure by combining available tags.",
  },
];

const AVAILABLE_TAGS = [
  "%year%",
  "%monthnum%",
  "%day%",
  "%hour%",
  "%minute%",
  "%second%",
  "%post_id%",
  "%postname%",
  "%category%",
  "%author%",
];

export default function PermalinkSettingsPage() {
  const { data, isLoading } = usePermalinkSettings();
  const savePermalinks = useMutation(api.core.options.set);
  const [settings, setSettings] = useState<PermalinkSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.metaValue) {
      setSettings({
        ...defaultSettings,
        ...(data.metaValue as PermalinkSettings),
      });
    }
  }, [data]);

  const currentStructure = useMemo(
    () => STRUCTURE_OPTIONS.find((opt) => opt.value === settings.structure),
    [settings.structure],
  );

  const handleStructureChange = (value: PermalinkStructure) => {
    setSettings((prev) => ({
      ...prev,
      structure: value,
    }));
  };

  const handleCustomStructureChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      structure: "custom",
      customStructure: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await savePermalinks({
        metaKey: PERMALINK_OPTION_KEY,
        metaValue: settings,
        type: "site",
      });
      setStatusMessage("Permalink settings updated successfully.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Admin / Settings / Permalinks
          </p>
          <h1 className="text-3xl font-bold">Permalink Settings</h1>
          <p className="text-muted-foreground">
            Configure how URLs are generated across your site, just like classic
            WordPress installs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Common Settings</CardTitle>
            <CardDescription>
              Select the permalink structure for your website. Including the
              %postname% tag makes links easy to understand and improves SEO.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                current settings…
              </div>
            ) : (
              <RadioGroup
                value={settings.structure}
                onValueChange={(value: PermalinkStructure) =>
                  handleStructureChange(value)
                }
                className="space-y-4"
              >
                {STRUCTURE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="rounded-lg border p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="space-y-2">
                        <Label htmlFor={option.value} className="text-base">
                          {option.label}
                        </Label>
                        <p className="font-mono text-sm text-muted-foreground">
                          {option.sample}
                        </p>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        )}
                        {option.value === "custom" && (
                          <div className="flex flex-col gap-2 pt-2">
                            <Label htmlFor="custom-structure">
                              Custom Structure
                            </Label>
                            <div className="flex flex-col gap-3 md:flex-row">
                              <div className="relative flex-1">
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  {SITE_BASE_URL}
                                </div>
                                <Input
                                  id="custom-structure"
                                  className="pl-[180px]"
                                  value={settings.customStructure}
                                  onChange={(event) =>
                                    handleCustomStructureChange(
                                      event.target.value,
                                    )
                                  }
                                  placeholder="/%category%/%postname%/"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    customStructure: "/%category%/%postname%/",
                                  }))
                                }
                              >
                                Reset
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Available tags
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Combine these placeholders inside your custom structure.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-mono">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Add trailing slash</p>
                <p className="text-sm text-muted-foreground">
                  Append a trailing slash to generated URLs for consistency.
                </p>
              </div>
              <Switch
                checked={settings.trailingSlash}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, trailingSlash: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional</CardTitle>
            <CardDescription>
              Customize the base segments for category and tag archives. Leaving
              these blank keeps the defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-base">Category base</Label>
              <Input
                id="category-base"
                placeholder="categories"
                value={settings.categoryBase}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    categoryBase: event.target.value,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Example: topics → {SITE_BASE_URL}/topics/uncategorized/
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-base">Tag base</Label>
              <Input
                id="tag-base"
                placeholder="tags"
                value={settings.tagBase}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    tagBase: event.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {statusMessage && (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettings(defaultSettings)}
              disabled={isSaving}
            >
              Reset to defaults
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function usePermalinkSettings() {
  const data = useQuery(api.core.options.get, {
    metaKey: PERMALINK_OPTION_KEY,
    type: "site",
  });

  return {
    data,
    isLoading: data === undefined,
  };
}
