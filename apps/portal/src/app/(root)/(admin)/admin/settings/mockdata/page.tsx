"use client";

import React, { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";
import { Activity, Database } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

export default function MockDataPage() {
  const [isCreatingAuditLogs, setIsCreatingAuditLogs] = useState(false);

  const createSampleAuditLogs = useMutation(
    api.core.auditLog.createSampleAuditLogs,
  );

  const handleCreateSampleAuditLogs = async () => {
    setIsCreatingAuditLogs(true);
    try {
      const result = await createSampleAuditLogs({});

      if (result.success) {
        toast.success(
          result.message ||
            `Successfully created ${result.count} sample audit log entries!`,
        );
      } else {
        toast.error("Failed to create sample audit logs");
      }
    } catch (error) {
      console.error("Error creating sample audit logs:", error);
      toast.error("Failed to create sample audit logs");
    } finally {
      setIsCreatingAuditLogs(false);
    }
  };

  /*
  const handleFixMockOrdersEmail = async () => {
    setIsMigrating(true); // Reuse the same loading state
    try {
      const result = await fixMockOrdersEmail({});

      if (result.success) {
        toast.success(
          `Fixed ${result.fixedOrders} mock orders! Added missing email fields.`,
        );
        if (result.errors.length > 0) {
          console.warn("Some errors occurred:", result.errors);
        }
      } else {
        toast.error("Failed to fix mock orders");
        if (result.errors.length > 0) {
          console.error("Errors:", result.errors);
        }
      }
    } catch (error) {
      console.error("Error fixing mock orders:", error);
      toast.error("Failed to fix mock orders");
    } finally {
      setIsMigrating(false);
    }
  };
  */

  return (
    <div className="space-y-6">
      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <Database className="h-5 w-5" />
            Development Only
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 dark:text-orange-300">
            This functionality is only available in development environments.
            Mock data generation can significantly impact database performance
            and should not be used in production.
          </p>
        </CardContent>
      </Card>

      {/* Mock Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Mock Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate sample audit log entries for testing audit log UI.
          </p>

          <Button
            onClick={handleCreateSampleAuditLogs}
            disabled={isCreatingAuditLogs}
            className="w-full"
          >
            {isCreatingAuditLogs ? (
              <>
                <Database className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Create Sample Audit Logs
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
