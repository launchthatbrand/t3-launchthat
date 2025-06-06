import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, CircleAlert, Clock, RefreshCw, WrenchIcon } from "lucide-react";

// Define the connection shape
interface Connection {
  _id: string;
  name: string;
  status: string;
  updatedAt: number;
  lastUsed: number;
  lastError?: string;
  app?: {
    name: string;
    iconUrl: string;
  };
}

interface ConnectionsListProps {
  connections: Connection[];
  selectedConnectionId: string | null;
  onSelect: (connectionId: string) => void;
}

/**
 * Component to display a list of connections with status indicators
 */
export default function ConnectionsList({
  connections,
  selectedConnectionId,
  onSelect,
}: ConnectionsListProps) {
  // Function to render status icon and color
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "active":
        return {
          icon: <Check className="h-4 w-4 text-green-500" />,
          badgeVariant: "success" as const,
          label: "Active",
        };
      case "error":
        return {
          icon: <CircleAlert className="h-4 w-4 text-destructive" />,
          badgeVariant: "destructive" as const,
          label: "Error",
        };
      case "disconnected":
        return {
          icon: <Clock className="h-4 w-4 text-orange-500" />,
          badgeVariant: "warning" as const,
          label: "Disconnected",
        };
      case "configured":
        return {
          icon: <WrenchIcon className="h-4 w-4 text-blue-500" />,
          badgeVariant: "outline" as const,
          label: "Configured",
        };
      case "incomplete":
        return {
          icon: <RefreshCw className="h-4 w-4 text-gray-500" />,
          badgeVariant: "secondary" as const,
          label: "Incomplete",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          badgeVariant: "secondary" as const,
          label: status,
        };
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // If no connections, show empty state
  if (connections.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
        <p className="mb-2 text-muted-foreground">No connections found</p>
        <p className="text-sm text-muted-foreground">
          Add a new connection to get started
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="divide-y">
        {connections.map((connection) => {
          const { icon, badgeVariant, label } = getStatusDetails(
            connection.status,
          );

          return (
            <div
              key={connection._id}
              onClick={() => onSelect(connection._id)}
              className={cn(
                "flex cursor-pointer items-start p-4 transition-colors hover:bg-muted/50",
                selectedConnectionId === connection._id && "bg-muted",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {connection.app?.iconUrl && (
                    <img
                      src={connection.app.iconUrl}
                      alt={connection.app.name || "App"}
                      className="h-6 w-6 rounded-sm"
                    />
                  )}
                  <h3 className="truncate font-medium">{connection.name}</h3>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  {icon}
                  <Badge variant={badgeVariant}>{label}</Badge>
                </div>

                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Updated: {formatDate(connection.updatedAt)}</span>
                  <span>Last used: {formatDate(connection.lastUsed)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
