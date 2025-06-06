import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  CircleAlert,
  ExternalLink,
  RotateCw,
  Shield,
  Trash2,
  X,
} from "lucide-react";

import ConnectionLogs from "./ConnectionLogs";
import ConnectionUsageStats from "./ConnectionUsageStats";

interface ConnectionDetailsProps {
  connectionId: string;
  onClose: () => void;
}

export default function ConnectionDetails({
  connectionId,
  onClose,
}: ConnectionDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Fetch connection details
  const connection = useQuery(
    api.integrations.connections.management.getConnection,
    { connectionId },
  );

  // Mutations for testing, updating, and deleting connections
  const testConnection = useMutation(
    api.integrations.connections.management.testConnection,
  );
  const updateConnection = useMutation(api.integrations.connections.update);
  const deleteConnection = useMutation(
    api.integrations.connections.management.deleteConnection,
  );

  // Handle testing connection
  const handleTestConnection = async () => {
    if (!connection) return;

    try {
      setIsTestingConnection(true);
      toast({
        title: "Testing connection...",
        description: "Please wait while we verify your connection.",
      });

      const result = await testConnection({ connectionId });

      if (result.success) {
        toast({
          title: "Connection test successful",
          description: "Your connection is working properly.",
          variant: "success",
        });
      } else {
        toast({
          title: "Connection test failed",
          description:
            result.error || "An error occurred during connection test.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection test failed",
        description:
          "An unexpected error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handle updating connection name
  const handleUpdateConnection = async () => {
    if (!connection || !newName.trim()) return;

    try {
      await updateConnection({
        connectionId,
        name: newName.trim(),
      });

      toast({
        title: "Connection updated",
        description: "Connection name has been updated successfully.",
        variant: "success",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update connection name.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting connection
  const handleDeleteConnection = async () => {
    try {
      const result = await deleteConnection({ connectionId });

      if (result.success) {
        toast({
          title: "Connection deleted",
          description: "Connection has been deleted successfully.",
          variant: "success",
        });

        onClose();
        router.refresh();
      } else {
        toast({
          title: "Deletion failed",
          description: result.error || "Failed to delete connection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Deletion failed",
        description:
          "An unexpected error occurred while deleting the connection.",
        variant: "destructive",
      });
    }

    setIsDeleteDialogOpen(false);
  };

  // Start editing with current name
  const startEditing = () => {
    if (connection) {
      setNewName(connection.name);
      setIsEditing(true);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status details with icon and color
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "active":
        return {
          icon: <RotateCw className="h-4 w-4 text-green-500" />,
          badgeVariant: "success" as const,
          label: "Active",
          description: "Connection is working properly and ready to use.",
        };
      case "error":
        return {
          icon: <CircleAlert className="h-4 w-4 text-destructive" />,
          badgeVariant: "destructive" as const,
          label: "Error",
          description: "Connection encountered an error and needs attention.",
        };
      case "disconnected":
        return {
          icon: <X className="h-4 w-4 text-orange-500" />,
          badgeVariant: "warning" as const,
          label: "Disconnected",
          description: "Connection is currently disconnected.",
        };
      case "configured":
        return {
          icon: <Shield className="h-4 w-4 text-blue-500" />,
          badgeVariant: "outline" as const,
          label: "Configured",
          description: "Connection is configured but hasn't been used yet.",
        };
      case "incomplete":
        return {
          icon: <CircleAlert className="h-4 w-4 text-yellow-500" />,
          badgeVariant: "secondary" as const,
          label: "Incomplete",
          description: "Connection setup is incomplete.",
        };
      default:
        return {
          icon: <CircleAlert className="h-4 w-4 text-gray-500" />,
          badgeVariant: "secondary" as const,
          label: status,
          description: "Connection status is unknown.",
        };
    }
  };

  if (!connection) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Connection Details</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  const { icon, badgeVariant, label, description } = getStatusDetails(
    connection.status,
  );

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2">
            {connection.app?.iconUrl && (
              <img
                src={connection.app.iconUrl}
                alt={connection.app.name}
                className="h-6 w-6 rounded-sm"
              />
            )}
            <CardTitle>{connection.name}</CardTitle>
            <Badge variant={badgeVariant} className="ml-2">
              {label}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Status Information */}
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="mb-1 font-medium">Status: {label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                    ) : (
                      <RotateCw className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                </div>

                {connection.lastError && (
                  <div className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                    <p className="font-semibold">Last Error:</p>
                    <p>{connection.lastError}</p>
                  </div>
                )}
              </div>

              {/* Connection Info */}
              <div className="rounded-md border p-4">
                <h3 className="mb-4 font-medium">Connection Information</h3>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="name">Connection Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter connection name"
                        autoFocus
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleUpdateConnection}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Connection Name
                        </p>
                        <p>{connection.name}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Connection Type
                        </p>
                        <p>{connection.app?.name || "Unknown"}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Last Updated
                        </p>
                        <p>{formatDate(connection.updatedAt)}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Last Used
                        </p>
                        <p>{formatDate(connection.lastUsed)}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditing}
                      >
                        Edit Name
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Authentication Info */}
              <div className="rounded-md border p-4">
                <h3 className="mb-4 font-medium">Authentication Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Authentication Type
                    </p>
                    <p className="capitalize">
                      {connection.app?.authType || "Unknown"}
                    </p>
                  </div>

                  {connection.credentials && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Credentials Status
                      </p>
                      <div className="flex items-center">
                        <Shield className="mr-1.5 h-4 w-4 text-green-500" />
                        <span>Securely stored and encrypted</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Connection
                </Button>

                {connection.app?.baseUrl && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(connection.app?.baseUrl, "_blank")
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Service
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="usage">
              <ConnectionUsageStats connectionId={connectionId} />
            </TabsContent>

            <TabsContent value="logs">
              <ConnectionLogs connectionId={connectionId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Connection Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this connection? This action
              cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConnection}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
