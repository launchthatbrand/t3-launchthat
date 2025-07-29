"use client";

import {
  Activity,
  AlertTriangle,
  Database,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Shuffle,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useMutation } from "convex/react";

export default function MockDataPage() {
  const [orderQuantity, setOrderQuantity] = useState(10);
  const [isCreatingOrders, setIsCreatingOrders] = useState(false);
  const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingChargeback, setIsCreatingChargeback] = useState(false);
  const [isCreatingAuditLogs, setIsCreatingAuditLogs] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Mock data creation mutations - using standard API notation
  const createMockOrders = useMutation(
    api.ecommerce.orders.mockData.createMockOrders,
  );
  const createMockTransfer = useMutation(
    api.ecommerce.transfers.mockData.createMockTransfer,
  );
  const createMockUser = useMutation(api.users.mockData.createMockUser);
  const createMockChargeback = useMutation(
    api.ecommerce.chargebacks.mockData.createMockChargeback,
  );
  const createSampleAuditLogs = useMutation(
    api.core.auditLog.createSampleAuditLogs,
  );

  // Migration mutation
  const migrateTransfers = useMutation(
    api.ecommerce.balances.index.migrateAllTransfersToJunctionTable,
  );
  /*
  const fixMockOrdersEmail = useMutation(
    api.ecommerce.orders.mockData.fixMockOrdersEmail,
  );
  */

  const handleCreateMockOrders = async () => {
    if (orderQuantity < 1 || orderQuantity > 100) {
      toast.error("Order quantity must be between 1 and 100");
      return;
    }

    setIsCreatingOrders(true);
    try {
      const result = await createMockOrders({ quantity: orderQuantity });

      if (result.success) {
        toast.success(`Successfully created ${result.count} mock orders!`);
      } else {
        toast.error("Failed to create mock orders");
      }
    } catch (error) {
      console.error("Error creating mock orders:", error);
      toast.error("Failed to create mock orders");
    } finally {
      setIsCreatingOrders(false);
    }
  };

  const handleCreateMockTransfer = async () => {
    setIsCreatingTransfer(true);
    try {
      const result = await createMockTransfer({});

      if (result.success) {
        toast.success(
          `Successfully created mock transfer with ${result.orderIds.length} orders!`,
        );
      } else {
        toast.error("Failed to create mock transfer");
      }
    } catch (error) {
      console.error("Error creating mock transfer:", error);
      toast.error("Failed to create mock transfer");
    } finally {
      setIsCreatingTransfer(false);
    }
  };

  const handleCreateMockUser = async () => {
    setIsCreatingUser(true);
    try {
      const result = await createMockUser({});

      if (result.success) {
        toast.success("Successfully created mock user!");
      } else {
        toast.error("Failed to create mock user");
      }
    } catch (error) {
      console.error("Error creating mock user:", error);
      toast.error("Failed to create mock user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateMockChargeback = async () => {
    setIsCreatingChargeback(true);
    try {
      const result = await createMockChargeback({});

      if (result.success) {
        toast.success(
          `Successfully created mock chargeback! Order: ${result.orderId}, Chargeback: ${result.chargebackId}`,
        );
      } else {
        toast.error("Failed to create mock chargeback");
      }
    } catch (error) {
      console.error("Error creating mock chargeback:", error);
      toast.error("Failed to create mock chargeback");
    } finally {
      setIsCreatingChargeback(false);
    }
  };

  const handleMigrateTransfers = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateTransfers({});

      if (result.success) {
        toast.success(
          `Migration completed! ${result.migratedTransfers} transfers migrated, ${result.totalLinksCreated} order links created.`,
        );
      } else {
        toast.error("Failed to migrate transfers");
      }
    } catch (error) {
      console.error("Error migrating transfers:", error);
      toast.error("Failed to migrate transfers");
    } finally {
      setIsMigrating(false);
    }
  };

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
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mock Data Management</h1>
        <p className="text-muted-foreground">
          Generate test data for development and testing purposes
        </p>
      </div>

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

      {/* Migration Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <RefreshCw className="h-5 w-5" />
            Data Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-blue-700 dark:text-blue-300">
            Migrate existing transfers to use the new proper junction table
            relationship with orders. This will convert transfers that store
            order IDs in notes to use proper database relationships.
          </p>

          <Button
            onClick={handleMigrateTransfers}
            disabled={isMigrating}
            className="w-full"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Migrate Transfer-Order Relationships
              </>
            )}
          </Button>

          {/*
          <Button
            onClick={handleFixMockOrdersEmail}
            disabled={isMigrating}
            className="w-full"
            variant="outline"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fix Mock Orders Email
              </>
            )}
          </Button>
          */}

          <p className="text-xs text-blue-600 dark:text-blue-400">
            Run this once to fix existing transfers that don't show their
            related orders properly.
          </p>
        </CardContent>
      </Card>

      {/* Mock Data Generation Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Mock Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Mock Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate orders with various payment statuses, customer
              information, and product combinations.
            </p>

            <div className="space-y-2">
              <Label htmlFor="orderQuantity">Number of Orders</Label>
              <Input
                id="orderQuantity"
                type="number"
                min="1"
                max="100"
                value={orderQuantity}
                onChange={(e) =>
                  setOrderQuantity(parseInt(e.target.value) || 10)
                }
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 100 orders per generation
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={isCreatingOrders}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreatingOrders ? "Creating..." : "Create Mock Orders"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Mock Orders</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    This will create <strong>{orderQuantity}</strong> mock
                    orders with:
                  </p>
                  <ul className="list-disc space-y-1 pl-6 text-sm">
                    <li>Random customer information</li>
                    <li>
                      Various payment statuses (pending, paid, failed, refunded)
                    </li>
                    <li>
                      Different order statuses (processing, shipped, delivered,
                      etc.)
                    </li>
                    <li>Random product combinations and quantities</li>
                    <li>Realistic pricing and totals</li>
                  </ul>

                  <div className="flex justify-end space-x-4">
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        onClick={handleCreateMockOrders}
                        disabled={isCreatingOrders}
                      >
                        {isCreatingOrders ? "Creating..." : "Create Orders"}
                      </Button>
                    </DialogTrigger>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Mock Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Mock Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a mock transfer with 3 associated orders for testing
              transfer functionality. Uses the new proper junction table
              relationship.
            </p>

            <Button
              onClick={handleCreateMockTransfer}
              disabled={isCreatingTransfer}
              className="w-full"
            >
              {isCreatingTransfer ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-spin" />
                  Creating Transfer...
                </>
              ) : (
                <>
                  <Shuffle className="mr-2 h-4 w-4" />
                  Create Mock Transfer
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Creates 1 transfer + 3 new orders with proper database
              relationships
            </p>
          </CardContent>
        </Card>

        {/* Mock User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mock User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a single mock user (MOCK USER - mockuser@launchthat.app)
              that will be used by all other mock data functions.
            </p>

            <Button
              onClick={handleCreateMockUser}
              disabled={isCreatingUser}
              className="w-full"
            >
              {isCreatingUser ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create Mock User
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Creates a standardized mock user with address that other mock
              functions will reference.
            </p>
          </CardContent>
        </Card>

        {/* Mock Chargeback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Mock Chargeback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a mock order and then initiate a chargeback on it for
              testing chargeback management and dispute workflows.
            </p>

            <Button
              onClick={handleCreateMockChargeback}
              disabled={isCreatingChargeback}
              className="w-full"
            >
              {isCreatingChargeback ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Create Mock Chargeback
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Creates 1 order + 1 chargeback with realistic dispute data and
              proper database relationships.
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
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate 75 sample audit log entries with various actions, user
              activities, and system events for testing audit functionality.
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

            <p className="text-xs text-muted-foreground">
              Creates 75 audit log entries with realistic user actions, system
              events, and security activities for comprehensive testing.
            </p>
          </CardContent>
        </Card>

        {/* Mock Products (Future) */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Mock Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate products with categories, variants, and inventory data.
            </p>

            <Button className="w-full" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Utilities for managing and cleaning up test data.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button variant="outline" disabled>
              <Database className="mr-2 h-4 w-4" />
              Clear All Mock Data
            </Button>

            <Button variant="outline" disabled>
              <Shuffle className="mr-2 h-4 w-4" />
              Randomize Existing Data
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Data management features coming soon. Use with caution in
            development.
          </p>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Current Data Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">1</div>
              <div className="text-sm text-muted-foreground">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Transfers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
