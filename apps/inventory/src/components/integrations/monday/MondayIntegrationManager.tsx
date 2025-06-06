import { useEffect, useState } from "react";
import BoardMappingsList from "@/components/integrations/monday/BoardMappingsList";
import { MondayRulesManager } from "@/components/monday/MondayRulesManager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SyncStatus from "@/components/ui/monday/SyncStatus";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

interface MondayIntegrationManagerProps {
  defaultTab?: "overview" | "board-mappings" | "rules" | "settings";
  connectionId?: string; // Optional ID of the specific Monday integration connection
}

export default function MondayIntegrationManager({
  defaultTab = "overview",
  connectionId, // Accept connectionId parameter
}: MondayIntegrationManagerProps) {
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get integration config - either specific connection or default
  const integrationConfig = useQuery(
    api.monday.client.getIntegrationConfig,
    connectionId ? { id: connectionId } : {},
  );

  // Mutations for testing and saving integration
  const testConnection = useMutation(api.monday.client.testConnection);
  const saveIntegration = useMutation(api.monday.client.createIntegration);
  const updateIntegration = useMutation(api.monday.client.updateIntegration);

  // Handle testing connection
  const handleTestConnection = async () => {
    try {
      setIsLoading(true);
      const result = await testConnection({ apiKey });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        "Error testing connection: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving integration
  const handleSaveIntegration = async () => {
    try {
      setIsLoading(true);

      if (!apiKey) {
        toast.error("API key is required");
        return;
      }

      if (integrationConfig) {
        // Update existing integration
        await updateIntegration({
          id: integrationConfig._id,
          apiKey,
          isEnabled: true,
        });
        toast.success("Monday.com integration updated successfully");
      } else {
        // Create new integration
        await saveIntegration({
          apiKey,
          isEnabled: true,
          name: "Monday.com Integration", // Allow customized names later
        });
        toast.success("Monday.com integration created successfully");
      }
    } catch (error) {
      toast.error(
        "Error saving integration: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling integration status
  const handleToggleIntegration = async (enabled: boolean) => {
    if (!integrationConfig) return;

    try {
      await updateIntegration({
        id: integrationConfig._id,
        isEnabled: enabled,
      });

      toast.success(
        `Monday.com integration ${enabled ? "enabled" : "disabled"}`,
      );
    } catch (error) {
      toast.error(
        "Error updating integration: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Set API key from config when available
  useEffect(() => {
    if (integrationConfig?.apiKey) {
      setApiKey(integrationConfig.apiKey);
    }
  }, [integrationConfig]);

  // If no integration config, show setup UI
  if (!integrationConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monday.com Integration</CardTitle>
          <CardDescription>
            Configure your Monday.com integration to sync data between Convex
            and Monday.com
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="mt-4">
              <h3 className="mb-2 text-lg font-medium">API Key</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Monday.com API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Monday.com API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored securely and used only for syncing
                    data.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={!apiKey || isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveIntegration}
                    disabled={!apiKey || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Integration"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If integration is configured, show tabbed interface
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {integrationConfig.name || "Monday.com Integration"}
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {integrationConfig.isEnabled ? "Enabled" : "Disabled"}
          </span>
          <Switch
            checked={integrationConfig.isEnabled}
            onCheckedChange={handleToggleIntegration}
          />
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(tab) => setCurrentTab(tab as any)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="board-mappings">Board Mappings</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {integrationConfig.name || "Monday.com Integration"}
                  </CardTitle>
                  <CardDescription>
                    Configure your Monday.com integration to sync data between
                    Convex and Monday.com
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          Integration Status
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {integrationConfig?.isEnabled
                            ? "Monday.com integration is active"
                            : "Monday.com integration is disabled"}
                        </p>
                      </div>
                      <Switch
                        checked={integrationConfig?.isEnabled ?? false}
                        onCheckedChange={handleToggleIntegration}
                      />
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 text-lg font-medium">API Key</h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">Monday.com API Key</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Enter your Monday.com API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Your API key is stored securely and used only for
                            syncing data.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleTestConnection}
                            disabled={!apiKey || isLoading}
                            variant="outline"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                          <Button
                            onClick={handleSaveIntegration}
                            disabled={!apiKey || isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Integration"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <SyncStatus connectionId={integrationConfig._id} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="board-mappings" className="mt-6">
          <BoardMappingsList connectionId={integrationConfig._id} />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          {integrationConfig._id && (
            <MondayRulesManager integrationId={integrationConfig._id} />
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for the Monday.com integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Automatic Syncing</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic syncing every hour
                    </p>
                  </div>
                  <Switch
                    checked={integrationConfig?.autoSync ?? false}
                    onCheckedChange={async (enabled) => {
                      if (!integrationConfig) return;
                      try {
                        await updateIntegration({
                          id: integrationConfig._id,
                          autoSync: enabled,
                        });

                        toast.success(
                          `Automatic syncing ${enabled ? "enabled" : "disabled"}`,
                        );
                      } catch (error) {
                        toast.error("Error updating setting");
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Process Subitems</h3>
                    <p className="text-sm text-muted-foreground">
                      Process subitems by default for all boards
                    </p>
                  </div>
                  <Switch
                    checked={integrationConfig?.processSubitems ?? false}
                    onCheckedChange={async (enabled) => {
                      if (!integrationConfig) return;
                      try {
                        await updateIntegration({
                          id: integrationConfig._id,
                          processSubitems: enabled,
                        });

                        toast.success(
                          `Subitem processing ${enabled ? "enabled" : "disabled"}`,
                        );
                      } catch (error) {
                        toast.error("Error updating setting");
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
