"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { AlertCircle, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Slider } from "@acme/ui/slider";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export interface ContentFilterSettingsProps {
  className?: string;
}

interface FilterSettings {
  sensitiveContentFilter: boolean;
  contentFilterLevel: number;
  hideBlockedUsers: boolean;
  hideBlockedContent: boolean;
  matureContentEnabled: boolean;
  contentCategories: {
    violence: boolean;
    harassment: boolean;
    hate_speech: boolean;
    adult: boolean;
    graphic: boolean;
    spam: boolean;
  };
}

const DEFAULT_SETTINGS: FilterSettings = {
  sensitiveContentFilter: true,
  contentFilterLevel: 2, // 0-4, with 0 being no filtering and 4 being maximum
  hideBlockedUsers: true,
  hideBlockedContent: true,
  matureContentEnabled: false,
  contentCategories: {
    violence: true,
    harassment: true,
    hate_speech: true,
    adult: true,
    graphic: true,
    spam: true,
  },
};

export function ContentFilterSettings({
  className = "",
}: ContentFilterSettingsProps) {
  const { userId } = useAuth();
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual user settings mutations when available
  // Currently placeholders
  const saveUserSettings = useMutation(api.socialfeed.mutations.addComment);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have settings in localStorage (for demo purposes)
        const savedSettings = localStorage.getItem("contentFilterSettings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        // In a real app, we would fetch settings from the server
        // const userSettings = await convex.query(api.users.getSettings, { userId });
        // if (userSettings) {
        //   setSettings(userSettings.contentFilters);
        // }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load your content filter settings");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadSettings();
    }
  }, [userId]);

  // Save settings
  const handleSaveSettings = async () => {
    if (!userId) {
      toast.error("You must be signed in to save settings");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Save to localStorage for demo purposes
      localStorage.setItem("contentFilterSettings", JSON.stringify(settings));

      // In a real implementation, this would call a dedicated API
      // This is just a placeholder
      await saveUserSettings({
        userId: userId as Id<"users">,
        feedItemId: "placeholder" as Id<"feedItems">,
        content: `SAVE_SETTINGS: ${JSON.stringify(settings)}`,
      });

      toast.success("Content filter settings saved successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle a category
  const handleCategoryToggle = (
    category: keyof FilterSettings["contentCategories"],
    checked: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      contentCategories: {
        ...prev.contentCategories,
        [category]: checked,
      },
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Content Filter Settings
        </CardTitle>
        <CardDescription>
          Customize how you want to filter content in your feed
        </CardDescription>
      </CardHeader>

      {error && (
        <CardContent className="pb-0">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Loading your preferences...
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content-types">Content Types</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sensitive-content" className="font-medium">
                      Sensitive Content Filter
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically filter potentially sensitive content
                    </p>
                  </div>
                  <Switch
                    id="sensitive-content"
                    checked={settings.sensitiveContentFilter}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        sensitiveContentFilter: checked,
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="filter-level" className="font-medium">
                    Filter Strength
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Set how strictly content should be filtered
                  </p>
                  <div className="pt-2">
                    <Slider
                      id="filter-level"
                      value={[settings.contentFilterLevel]}
                      min={0}
                      max={4}
                      step={1}
                      onValueChange={(values) =>
                        setSettings((prev) => ({
                          ...prev,
                          contentFilterLevel: values[0],
                        }))
                      }
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>None</span>
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                      <span>Maximum</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-medium">Blocked Content</Label>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-blocked-users"
                      checked={settings.hideBlockedUsers}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          hideBlockedUsers: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="hide-blocked-users" className="text-sm">
                      Hide all content from blocked users
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-blocked-content"
                      checked={settings.hideBlockedContent}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          hideBlockedContent: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="hide-blocked-content" className="text-sm">
                      Hide content that includes blocked keywords
                    </Label>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mature-content" className="font-medium">
                      Mature Content
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow viewing of mature content (18+)
                    </p>
                  </div>
                  <Switch
                    id="mature-content"
                    checked={settings.matureContentEnabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        matureContentEnabled: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content-types" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select which types of content should be filtered from your feed
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-violence"
                    checked={settings.contentCategories.violence}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle("violence", checked === true)
                    }
                  />
                  <Label htmlFor="filter-violence" className="font-medium">
                    Violence and gore
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-harassment"
                    checked={settings.contentCategories.harassment}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle("harassment", checked === true)
                    }
                  />
                  <Label htmlFor="filter-harassment" className="font-medium">
                    Harassment and bullying
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-hate"
                    checked={settings.contentCategories.hate_speech}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle("hate_speech", checked === true)
                    }
                  />
                  <Label htmlFor="filter-hate" className="font-medium">
                    Hate speech
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-adult"
                    checked={settings.contentCategories.adult}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle("adult", checked === true)
                    }
                  />
                  <Label htmlFor="filter-adult" className="font-medium">
                    Adult and sexual content
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-graphic"
                    checked={settings.contentCategories.graphic}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle("graphic", checked === true)
                    }
                  />
                  <Label htmlFor="filter-graphic" className="font-medium">
                    Graphic medical content
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-spam"
                    checked={settings.contentCategories.spam}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle("spam", checked === true)
                    }
                  />
                  <Label htmlFor="filter-spam" className="font-medium">
                    Spam and misleading content
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading || isSaving}
          className="ml-auto flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}
