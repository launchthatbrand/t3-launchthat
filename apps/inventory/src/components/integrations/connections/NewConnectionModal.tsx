import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Check, Key, Lock, RefreshCw } from "lucide-react";

interface App {
  _id: string;
  name: string;
  description: string;
  iconUrl: string;
  authType: string;
}

interface NewConnectionModalProps {
  apps: App[];
  isOpen: boolean;
  onClose: () => void;
}

export default function NewConnectionModal({
  apps,
  isOpen,
  onClose,
}: NewConnectionModalProps) {
  const router = useRouter();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState("");
  const [authDetails, setAuthDetails] = useState<{
    apiKey?: string;
    username?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the selected app
  const selectedApp = apps.find((app) => app._id === selectedAppId);

  // Group apps by auth type for better organization
  const appsByAuthType = apps.reduce(
    (groups, app) => {
      const group = groups[app.authType] || [];
      group.push(app);
      return { ...groups, [app.authType]: group };
    },
    {} as Record<string, App[]>,
  );

  // Generate OAuth URL
  const generateAuthUrl = useMutation(
    api.integrations.connections.oauth.generateAuthUrl,
  );

  // Create API key or basic auth connection
  const createConnection = useMutation(api.integrations.connections.create);

  // Handle starting OAuth flow
  const handleOAuthConnect = async () => {
    if (!selectedApp || !connectionName.trim()) return;

    try {
      setIsSubmitting(true);

      // Generate a state parameter for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);

      // Generate the redirect URI
      const redirectUri = `${window.location.origin}/api/integrations/oauth/callback`;

      // Generate the authorization URL
      const authUrl = await generateAuthUrl({
        appId: selectedApp._id,
        redirectUri,
        state,
        connectionName: connectionName.trim(),
      });

      // Store the connection name in session storage for the callback
      sessionStorage.setItem(
        `oauth_connection_name_${state}`,
        connectionName.trim(),
      );

      // Redirect to the authorization URL
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initialize OAuth connection. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Handle direct auth (API key or basic auth)
  const handleDirectAuth = async () => {
    if (!selectedApp || !connectionName.trim()) return;

    try {
      setIsSubmitting(true);

      let credentials = {};

      if (selectedApp.authType === "apiKey" && authDetails.apiKey) {
        credentials = { apiKey: authDetails.apiKey };
      } else if (
        selectedApp.authType === "basic" &&
        authDetails.username &&
        authDetails.password
      ) {
        credentials = {
          username: authDetails.username,
          password: authDetails.password,
        };
      } else {
        throw new Error("Missing required credentials");
      }

      // Create the connection
      const result = await createConnection({
        appId: selectedApp._id,
        name: connectionName.trim(),
        credentials,
      });

      if (result.success) {
        toast({
          title: "Connection Created",
          description: "Your connection has been created successfully.",
          variant: "success",
        });

        onClose();
        router.refresh();
      } else {
        throw new Error(result.error || "Failed to create connection");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });

      setIsSubmitting(false);
    }
  };

  // Handle form submission based on auth type
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApp) return;

    if (selectedApp.authType === "oauth2") {
      await handleOAuthConnect();
    } else {
      await handleDirectAuth();
    }
  };

  // Render auth form based on the selected app's auth type
  const renderAuthForm = () => {
    if (!selectedApp) return null;

    switch (selectedApp.authType) {
      case "oauth2":
        return (
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="oauth-name">Connection Name</Label>
              <Input
                id="oauth-name"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="My Google Connection"
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p>
                You'll be redirected to {selectedApp.name} to authorize this
                connection. After authorization, you'll be redirected back to
                this application.
              </p>
            </div>
          </div>
        );

      case "apiKey":
        return (
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="apikey-name">Connection Name</Label>
              <Input
                id="apikey-name"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder={`My ${selectedApp.name} Connection`}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="apikey">API Key</Label>
              <Input
                id="apikey"
                type="password"
                value={authDetails.apiKey || ""}
                onChange={(e) =>
                  setAuthDetails({ ...authDetails, apiKey: e.target.value })
                }
                placeholder="Enter API key"
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p>
                Your API key will be encrypted and stored securely. It is used
                to authenticate requests to {selectedApp.name}.
              </p>
            </div>
          </div>
        );

      case "basic":
        return (
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="basic-name">Connection Name</Label>
              <Input
                id="basic-name"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder={`My ${selectedApp.name} Connection`}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={authDetails.username || ""}
                onChange={(e) =>
                  setAuthDetails({ ...authDetails, username: e.target.value })
                }
                placeholder="Enter username"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={authDetails.password || ""}
                onChange={(e) =>
                  setAuthDetails({ ...authDetails, password: e.target.value })
                }
                placeholder="Enter password"
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p>
                Your credentials will be encrypted and stored securely. They are
                used to authenticate requests to {selectedApp.name}.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 text-center text-muted-foreground">
            <p>This authentication type is not supported yet.</p>
          </div>
        );
    }
  };

  // Get auth type icon
  const getAuthTypeIcon = (authType: string) => {
    switch (authType) {
      case "oauth2":
        return <RefreshCw className="h-4 w-4" />;
      case "apiKey":
        return <Key className="h-4 w-4" />;
      case "basic":
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Check if form can be submitted
  const canSubmit = () => {
    if (!selectedApp || !connectionName.trim() || isSubmitting) return false;

    // Additional validation based on auth type
    if (selectedApp.authType === "apiKey" && !authDetails.apiKey) return false;
    if (
      selectedApp.authType === "basic" &&
      (!authDetails.username || !authDetails.password)
    ) {
      return false;
    }

    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>
            Connect to third-party services to enable integrations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {selectedApp ? (
            <div className="space-y-4 py-4">
              <div className="mb-4 flex items-center gap-3">
                {selectedApp.iconUrl && (
                  <img
                    src={selectedApp.iconUrl}
                    alt={selectedApp.name}
                    className="h-10 w-10 rounded-md"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium">{selectedApp.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedApp.description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    setSelectedAppId(null);
                    setConnectionName("");
                    setAuthDetails({});
                  }}
                >
                  Change
                </Button>
              </div>

              {renderAuthForm()}
            </div>
          ) : (
            <Tabs defaultValue="oauth2" className="py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="oauth2">OAuth</TabsTrigger>
                <TabsTrigger value="apiKey">API Key</TabsTrigger>
                <TabsTrigger value="basic">Basic Auth</TabsTrigger>
              </TabsList>

              {Object.entries(appsByAuthType).map(([authType, apps]) => (
                <TabsContent key={authType} value={authType}>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {apps.map((app) => (
                      <Card
                        key={app._id}
                        className="cursor-pointer transition-colors hover:border-primary"
                        onClick={() => {
                          setSelectedAppId(app._id);
                          setConnectionName(`My ${app.name} Connection`);
                        }}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center gap-2">
                            {app.iconUrl && (
                              <img
                                src={app.iconUrl}
                                alt={app.name}
                                className="h-8 w-8 rounded-md"
                              />
                            )}
                            <CardTitle className="text-base">
                              {app.name}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <CardDescription className="line-clamp-2">
                            {app.description}
                          </CardDescription>
                        </CardContent>
                        <CardFooter className="border-t p-4 pt-0">
                          <div className="flex items-center text-xs text-muted-foreground">
                            {getAuthTypeIcon(app.authType)}
                            <span className="ml-1">
                              {app.authType === "oauth2"
                                ? "OAuth"
                                : app.authType === "apiKey"
                                  ? "API Key"
                                  : "Basic Auth"}
                            </span>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          <DialogFooter>
            {isSubmitting ? (
              <Button disabled className="w-24">
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Connecting...</span>
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit()} className="gap-1">
                  <Check className="h-4 w-4" />
                  Connect
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
