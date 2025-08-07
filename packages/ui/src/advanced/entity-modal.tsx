"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../sheet";

import { Button } from "../button";
import { X } from "lucide-react";
import { cn } from "@acme/ui";

// Types
export type EntityActionType = "create" | "edit" | "delete" | "view" | "manage";

export type EntityModalType = "dialog" | "sheet";

export type EntityModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface EntityModalProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  type?: EntityModalType;
  size?: EntityModalSize;
  position?: "right" | "left" | "top" | "bottom";
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

// Generic modal/slideover for entity management
export function EntityModal({
  title,
  description,
  children,
  footer,
  isOpen,
  onClose,
  type = "dialog",
  size = "md",
  position = "right",
  showCloseButton = true,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
}: EntityModalProps) {
  // Size class maps for both dialog and sheet
  const dialogSizeClassMap: Record<EntityModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[90vw] h-[90vh]",
  };

  const sheetSizeClassMap: Record<EntityModalSize, string> = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full:
      position === "top" || position === "bottom"
        ? "h-[90vh]"
        : "sm:max-w-[90vw]",
  };

  // Render Dialog variant
  if (type === "dialog") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            dialogSizeClassMap[size],
            size === "full" && "flex flex-col",
            className,
          )}
        >
          <DialogHeader className={cn(headerClassName)}>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div
            className={cn(
              "py-4",
              size === "full" && "flex-1 overflow-auto",
              contentClassName,
            )}
          >
            {children}
          </div>

          {footer && (
            <DialogFooter className={cn(footerClassName)}>
              {footer}
            </DialogFooter>
          )}

          {showCloseButton && (
            <Button
              className="absolute right-4 top-4 h-6 w-6 rounded-full p-0"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Render Sheet variant
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={
          position === "top" || position === "bottom"
            ? position
            : (position)
        }
        className={cn(
          sheetSizeClassMap[size],
          size === "full" && "flex flex-col",
          className,
        )}
      >
        <SheetHeader className={cn(headerClassName)}>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div
          className={cn(
            "py-4",
            size === "full" && "flex-1 overflow-auto",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <SheetFooter className={cn(footerClassName)}>{footer}</SheetFooter>
        )}

        {showCloseButton && (
          <SheetClose asChild>
            <Button
              className="absolute right-4 top-4 h-6 w-6 rounded-full p-0"
              variant="ghost"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Preset variants for common entity actions
export function CreateEntityModal({
  entityName,
  ...props
}: Omit<EntityModalProps, "title" | "description"> & {
  entityName: string;
}) {
  return (
    <EntityModal
      title={`Create ${entityName}`}
      description={`Enter the details to create a new ${entityName.toLowerCase()}.`}
      {...props}
    />
  );
}

export function EditEntityModal({
  entityName,
  entityTitle,
  ...props
}: Omit<EntityModalProps, "title" | "description"> & {
  entityName: string;
  entityTitle?: string;
}) {
  return (
    <EntityModal
      title={`Edit ${entityName}${entityTitle ? `: ${entityTitle}` : ""}`}
      description={`Update the details of this ${entityName.toLowerCase()}.`}
      {...props}
    />
  );
}

export function DeleteEntityModal({
  entityName,
  entityTitle,
  ...props
}: Omit<EntityModalProps, "title" | "description"> & {
  entityName: string;
  entityTitle?: string;
}) {
  return (
    <EntityModal
      title={`Delete ${entityName}${entityTitle ? `: ${entityTitle}` : ""}`}
      description={`Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`}
      size="sm"
      {...props}
    />
  );
}

export function ViewEntityModal({
  entityName,
  entityTitle,
  ...props
}: Omit<EntityModalProps, "title" | "description"> & {
  entityName: string;
  entityTitle?: string;
}) {
  return (
    <EntityModal
      title={`${entityName} Details${entityTitle ? `: ${entityTitle}` : ""}`}
      {...props}
    />
  );
}

// Action buttons for entity modals
export function EntityModalActions({
  actionType = "create",
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isLoading = false,
  isDanger = false,
  isDisabled = false,
}: {
  actionType?: EntityActionType;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDanger?: boolean;
  isDisabled?: boolean;
}) {
  // Default text based on action type
  const defaultConfirmText: Record<EntityActionType, string> = {
    create: "Create",
    edit: "Save Changes",
    delete: "Delete",
    view: "Close",
    manage: "Save",
  };

  const defaultCancelText = actionType === "view" ? "Close" : "Cancel";

  // Determine button variant based on action type and isDanger flag
  const getButtonVariant = () => {
    if (isDanger || actionType === "delete") return "destructive";
    if (actionType === "view") return "outline";
    return "default";
  };

  return (
    <div className="flex w-full flex-row-reverse justify-start gap-2 sm:justify-end">
      <Button
        onClick={onConfirm}
        disabled={isLoading || isDisabled}
        variant={getButtonVariant()}
      >
        {isLoading
          ? "Loading..."
          : confirmText || defaultConfirmText[actionType]}
      </Button>
      <Button onClick={onCancel} disabled={isLoading} variant="outline">
        {cancelText || defaultCancelText}
      </Button>
    </div>
  );
}
