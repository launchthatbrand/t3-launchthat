"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui";

import { useAddToHomeScreen } from "./useAddToHomeScreen";

export type AddToHomeScreenHeaderButtonProps = {
  appName?: string;
  buttonLabel?: string;
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
};

export const AddToHomeScreenHeaderButton = ({
  appName = "this app",
  buttonLabel = "Install",
  buttonVariant = "ghost",
  buttonSize = "sm",
  buttonClassName,
}: AddToHomeScreenHeaderButtonProps) => {
  const { isIOS, isStandalone, canPromptInstall, promptInstall } =
    useAddToHomeScreen();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  if (isStandalone) return null;

  const iosInstructions = `To install ${appName} on iOS, tap the Share button in Safari, then “Add to Home Screen”.`;
  const desktopInstructions = `To install ${appName}, use your browser’s “Install app” option (or enable install prompts for this site).`;

  const handleInstall = async () => {
    if (isInstalling) return;
    if (!canPromptInstall) {
      setDialogOpen(true);
      return;
    }

    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  if (isIOS) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClassName}
          >
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {appName}</DialogTitle>
            <DialogDescription>{iosInstructions}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={buttonClassName}
        disabled={isInstalling}
        onClick={() => void handleInstall()}
      >
        {buttonLabel}
      </Button>

      {!canPromptInstall && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {appName}</DialogTitle>
            <DialogDescription>{desktopInstructions}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      )}
    </Dialog>
  );
};

