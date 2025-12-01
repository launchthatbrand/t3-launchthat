"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { Share } from "lucide-react";

import { Button } from "@acme/ui/button";

import { ContentToShare, ShareDialog } from "./ShareDialog";

// Extend ButtonProps but omit the content property since we use it differently
type ShareButtonBaseProps = Omit<ComponentProps<typeof Button>, "content">;

interface ShareButtonProps extends ShareButtonBaseProps {
  content: ContentToShare;
  onShareComplete?: () => void;
  iconOnly?: boolean;
}

export function ShareButton({
  content,
  onShareComplete,
  iconOnly = false,
  className = "",
  size = "sm",
  variant = "ghost",
  ...props
}: ShareButtonProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleOpenShareDialog = () => {
    setShowShareDialog(true);
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
    if (onShareComplete) {
      onShareComplete();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${iconOnly ? "" : "flex items-center space-x-1"} ${className}`}
        onClick={handleOpenShareDialog}
        {...props}
      >
        <Share className="h-4 w-4" />
        {!iconOnly && <span>Share</span>}
      </Button>

      {showShareDialog && (
        <ShareDialog
          isOpen={showShareDialog}
          onClose={handleCloseShareDialog}
          content={content}
        />
      )}
    </>
  );
}
