/**
 * TriggerConfigurator component
 *
 * This component allows users to configure trigger nodes in the scenario builder,
 * including webhook and polling settings.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Copy, Loader } from "lucide-react";

interface TriggerConfiguratorProps {
  nodeId: Id<"nodes">;
}

export default function TriggerConfigurator({
  nodeId,
}: TriggerConfiguratorProps) {
  const [copied, setCopied] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5);
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Get the webhook URL for the node
  const webhookUrl = useQuery(
    api.integrations.scenarios.triggers.getNodeWebhookUrl,
    {
      nodeId,
    },
  );

  // Mutation to generate a webhook URL
  const generateWebhook = useMutation(
    api.integrations.scenarios.triggers.generateWebhookUrl,
  );

  // Handle webhook URL generation
  const handleGenerateWebhook = async () => {
    try {
      const result = await generateWebhook({ nodeId });
      if (!result.success) {
        console.error("Failed to generate webhook URL:", result.error);
      }
    } catch (error) {
      console.error("Error generating webhook URL:", error);
    }
  };

  // Handle copying webhook URL to clipboard
  const handleCopyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(`${window.location.origin}${webhookUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trigger Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="webhook">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="polling">Polling</TabsTrigger>
          </TabsList>

          <TabsContent value="webhook" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    id="webhook-url"
                    value={
                      webhookUrl
                        ? `${window.location.origin}${webhookUrl}`
                        : "No webhook URL generated"
                    }
                    readOnly
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyWebhook}
                  disabled={!webhookUrl}
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerateWebhook}>
                {webhookUrl ? "Regenerate" : "Generate"} Webhook URL
              </Button>
            </div>

            <div className="rounded-lg border p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="text-amber-500" />
                <span>Keep this URL secure</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Anyone with this URL can trigger your scenario. If compromised,
                regenerate a new URL to invalidate the old one.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="polling" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="polling-enabled">Enable Polling</Label>
                <Switch
                  id="polling-enabled"
                  checked={pollingEnabled}
                  onCheckedChange={setPollingEnabled}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Polling periodically checks for changes at the configured
                interval.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="polling-interval">
                Polling Interval (minutes)
              </Label>
              <Input
                id="polling-interval"
                type="number"
                min={1}
                max={60}
                value={pollingInterval}
                onChange={(e) => setPollingInterval(parseInt(e.target.value))}
                disabled={!pollingEnabled}
              />
              <p className="text-sm text-muted-foreground">
                How often to check for updates. Minimum 1 minute.
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled={!pollingEnabled}>Save Polling Settings</Button>
            </div>

            <div className="rounded-lg border p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="text-amber-500" />
                <span>About Polling</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Polling consumes resources. Use the longest interval that meets
                your needs. For real-time updates, webhooks are preferred when
                available.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
