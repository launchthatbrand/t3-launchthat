import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock,
  FileKey,
  Info,
  KeyRound,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";

interface ConnectionLogsProps {
  connectionId: string;
}

interface AuditLog {
  _id: string;
  action: string;
  timestamp: number;
  metadata: {
    success?: boolean;
    error?: string;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

export default function ConnectionLogs({ connectionId }: ConnectionLogsProps) {
  // Fetch audit logs for the connection
  const logs = useQuery(api.integrations.audit.getAuditLogs, {
    resourceType: "connection",
    resourceId: connectionId,
    limit: 20,
  });

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get icon and label for each action type
  const getActionDetails = (action: string, success?: boolean) => {
    switch (action) {
      case "credential_store":
        return {
          icon: <FileKey className="h-4 w-4 text-blue-500" />,
          label: "Credentials Stored",
          variant: "outline" as const,
        };
      case "credential_update":
        return {
          icon: <KeyRound className="h-4 w-4 text-blue-500" />,
          label: "Credentials Updated",
          variant: "outline" as const,
        };
      case "credential_delete":
        return {
          icon: <Shield className="h-4 w-4 text-orange-500" />,
          label: "Credentials Deleted",
          variant: "warning" as const,
        };
      case "connection_test":
        return {
          icon: success ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          ),
          label: "Connection Test",
          variant: success ? ("success" as const) : ("destructive" as const),
        };
      case "connection_refresh":
        return {
          icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
          label: "Token Refresh",
          variant: success ? ("success" as const) : ("destructive" as const),
        };
      case "connection_use":
        return {
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          label: "Connection Used",
          variant: "secondary" as const,
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          label: action.replace(/_/g, " "),
          variant: "secondary" as const,
        };
    }
  };

  if (!logs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No activity logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const { icon, label, variant } = getActionDetails(
                log.action,
                log.metadata.success,
              );
              return (
                <TableRow key={log._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeof log.metadata.success === "boolean" && (
                      <Badge
                        variant={
                          log.metadata.success ? "success" : "destructive"
                        }
                      >
                        {log.metadata.success ? "Success" : "Failed"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.metadata.error && (
                      <span className="text-sm text-destructive">
                        {log.metadata.error}
                      </span>
                    )}
                    {log.ipAddress && (
                      <span className="text-xs text-muted-foreground">
                        IP: {log.ipAddress}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
