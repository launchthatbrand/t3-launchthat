import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ADMIN_PERMISSIONS } from "@/convex/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { useMutation, useQuery } from "convex/react";
import { PlusCircle, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { LoadingSpinner } from "./ui/loading-spinner";
import { PermissionGuard } from "./ui/permission-guard";

interface UserRoleAssignmentProps {
  /**
   * The user ID to assign roles to
   */
  userId: Id<"users">;
  /**
   * The scope type for the role assignment
   */
  scopeType?: "global" | "group" | "course" | "organization";
  /**
   * The scope ID for the role assignment
   */
  scopeId?: string;
  /**
   * Whether to show the user's existing roles
   */
  showExistingRoles?: boolean;
  /**
   * The variant of the trigger button
   */
  buttonVariant?: "default" | "outline" | "ghost" | "link";
  /**
   * The size of the trigger button
   */
  buttonSize?: "default" | "sm" | "lg" | "icon";
  /**
   * Custom class name for the component
   */
  className?: string;
  /**
   * Custom class name for the button
   */
  buttonClassName?: string;
  /**
   * Custom content for the trigger button
   */
  buttonContent?: React.ReactNode;
  /**
   * Callback function after a role is assigned
   */
  onRoleAssigned?: () => void;
  /**
   * Callback function after a role is revoked
   */
  onRoleRevoked?: () => void;
}

/**
 * Component for assigning roles to users
 */
export function UserRoleAssignment({
  userId,
  scopeType = "global",
  scopeId,
  showExistingRoles = true,
  buttonVariant = "outline",
  buttonSize = "default",
  className,
  buttonClassName,
  buttonContent,
  onRoleAssigned,
  onRoleRevoked,
}: UserRoleAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Get user permissions
  const { hasPermission } = usePermissions();
  const canManageRoles = hasPermission(ADMIN_PERMISSIONS.MANAGE_ROLES);

  // Get available roles
  const roles = useQuery(api.roles.getAssignableRoles, {
    scopeType,
    scopeId,
  });

  // Get user's roles
  const userRoles = useQuery(api.roles.getUserRoles, {
    userId,
    scopeType,
    scopeId,
  });

  // Get user details
  const user = useQuery(api.core.users.getUserByClerkId, { userId });

  // Mutations
  const assignRole = useMutation(api.permissions.assignRole);
  const revokeRole = useMutation(api.permissions.revokeRole);

  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast.error("Please select a role to assign");
      return;
    }

    try {
      await assignRole({
        userId,
        roleId: selectedRoleId as Id<"roles">,
        scopeType,
        scopeId,
      });
      toast.success("Role assigned successfully");
      setSelectedRoleId(null);
      setIsOpen(false);
      onRoleAssigned?.();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    }
  };

  // Handle role revocation
  const handleRevokeRole = async (roleId: Id<"roles">) => {
    try {
      await revokeRole({
        userId,
        roleId,
        scopeType,
        scopeId,
      });
      toast.success("Role revoked successfully");
      onRoleRevoked?.();
    } catch (error) {
      console.error("Error revoking role:", error);
      toast.error("Failed to revoke role");
    }
  };

  // Loading states
  const isLoading =
    roles === undefined || userRoles === undefined || user === undefined;

  return (
    <PermissionGuard
      permissionKey={ADMIN_PERMISSIONS.MANAGE_ROLES}
      renderNothing={true}
    >
      <div className={className}>
        {showExistingRoles && userRoles && userRoles.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Current Roles
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {userRoles.map((role) => (
                <Badge
                  key={role.roleId}
                  variant="outline"
                  className="flex items-center gap-1 pl-2"
                >
                  <UserCheck className="h-3 w-3" />
                  {role.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRevokeRole(role.roleId)}
                  >
                    <UserX className="h-3 w-3" />
                    <span className="sr-only">Remove {role.name} role</span>
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant={buttonVariant}
              size={buttonSize}
              className={buttonClassName}
              disabled={!canManageRoles}
            >
              {buttonContent || (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Role
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>
                {user ? (
                  <>Assign a role to {user.name || user.email}</>
                ) : (
                  <>Assign a role to this user</>
                )}
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="role-select"
                      className="block text-sm font-medium"
                    >
                      Select Role
                    </label>
                    <Select
                      value={selectedRoleId || ""}
                      onValueChange={setSelectedRoleId}
                    >
                      <SelectTrigger id="role-select">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles &&
                          roles.map((role) => (
                            <SelectItem key={role._id} value={role._id}>
                              {role.name} - {role.description}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {scopeType !== "global" && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">
                        This role will be assigned in the{" "}
                        <span className="font-medium">{scopeType}</span> scope
                        {scopeId && (
                          <>
                            {" "}
                            with ID <code className="text-xs">{scopeId}</code>
                          </>
                        )}
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedRoleId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRoleId || isLoading}
              >
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
