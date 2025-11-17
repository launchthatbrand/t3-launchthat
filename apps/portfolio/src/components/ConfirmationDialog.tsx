"use client";

import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Button } from "@acme/ui/button";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  /**
   * Button label. If `triggerButtonIcon` provided, label will be hidden on sm screens to keep icon-only.
   */
  triggerButtonText?: string;
  /** Icon element (lucide-react icon or any ReactNode) to render inside the trigger button */
  triggerButtonIcon?: React.ReactNode;
  /** Optional additional Tailwind classes for the trigger button */
  triggerButtonClassName?: string;
  /** Button variant to pass to shadcn Button */
  triggerButtonVariant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive";
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  description,
  onConfirm,
  triggerButtonText = "Confirm",
  triggerButtonIcon,
  triggerButtonClassName,
  triggerButtonVariant = "ghost",
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={triggerButtonVariant}
          size="sm"
          className={triggerButtonClassName}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {triggerButtonIcon ? (
            <span className="flex items-center gap-1">
              {triggerButtonIcon}
              {triggerButtonText && (
                <span className="hidden sm:inline">{triggerButtonText}</span>
              )}
            </span>
          ) : (
            triggerButtonText
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {triggerButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
