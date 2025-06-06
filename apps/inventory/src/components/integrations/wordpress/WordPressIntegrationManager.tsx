import { useEffect, useState } from "react";
import { WordPressRulesManager } from "@/components/wordpress/WordPressRulesManager";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Define types for WordPress integration
interface WordPressIntegration {
  _id: Id<"connections">;
  name: string;
  siteUrl?: string;
  username?: string;
  isEnabled?: boolean;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export interface WordPressIntegrationManagerProps {
  integrationId?: Id<"connections">;
}

export function WordPressIntegrationManager({
  integrationId,
}: WordPressIntegrationManagerProps) {
  // Define state for the integration
  const [name, setName] = useState("WordPress Integration");
  const [siteUrl, setSiteUrl] = useState("https://");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Define mutations for WordPress integration
  const createIntegration = useMutation(api.integrations.test.testMutation);
  const updateIntegration = useMutation(api.integrations.test.testMutation);
  const testConnection = useMutation(api.integrations.test.testMutation);

  // Fetch the integration if ID is provided
  const integration = useQuery(api.integrations.test.testQuery, "skip");

  // Load integration data when it's fetched
  useEffect(() => {
    if (integration) {
      setName("WordPress Integration (Test Mode)");
      setSiteUrl("https://wordpress-test.example.com");
      setUsername("testuser");
      setIsEnabled(true);
    }
  }, [integration]);

  // Initialize webhook URL on the client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/wordpress/webhook`);
    }
  }, []);

  // Function to copy webhook URL to clipboard
  const copyWebhookUrl = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl).catch((error) => {
        console.error("Failed to copy webhook URL", error);
      });
      toast.success("Webhook URL copied to clipboard");
    }
  };

  // Function to save the integration
  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await createIntegration({
        name: name,
      });
      toast.success("Test mode: " + response);
    } catch (error) {
      console.error("Error in test mode:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to test the connection
  const handleTestConnection = async () => {
    setIsLoading(true);

    try {
      const result = await testConnection({
        name: "Test Connection",
      });

      toast.success("Test mode: " + result);
    } catch (error) {
      console.error("Error in test mode:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>

      {/* Configuration Tab */}
      <TabsContent value="config" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">WordPress Integration</CardTitle>
            <CardDescription>
              Connect your WordPress site to enable automation rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  placeholder="WordPress Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="site-url">WordPress Site URL</Label>
                <Input
                  id="site-url"
                  placeholder="https://yoursite.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="WordPress admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="WordPress admin password (leave blank to keep current)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="WordPress API key (if using Application Passwords plugin)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="integration-enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="integration-enabled">
                  Enable this integration
                </Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Configuration
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Setup</CardTitle>
            <CardDescription>
              Set up a webhook in your WordPress site to trigger rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex items-center space-x-2">
                <Input id="webhook-url" readOnly value={webhookUrl} />
                <Button variant="outline" onClick={copyWebhookUrl}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    WordPress Plugin Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      To use webhooks with WordPress, you&apos;ll need to
                      install a webhooks plugin like &quot;WP Webhooks&quot; or
                      &quot;WP Webhooks Pro&quot; from the WordPress plugin
                      repository.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Rules Tab */}
      <TabsContent value="rules" className="space-y-4">
        {integrationId ? (
          <WordPressRulesManager integrationId={integrationId} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
              <CardDescription>
                Save the integration configuration first to access rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Configuration First
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Logs Tab */}
      <TabsContent value="logs" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Integration Logs</CardTitle>
            <CardDescription>
              View logs for this WordPress integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* This would be implemented in a real app */}
            <p className="py-8 text-center italic text-muted-foreground">
              No logs available yet
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
