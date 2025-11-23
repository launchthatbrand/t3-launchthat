"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@acme/ui/button";
import type { ReactNode } from "react";

interface AdminSinglePostHeaderProps {
  pluginBreadcrumb: string;
  heading: string;
  description?: string | null;
  onBack: () => void;
  showActions?: boolean;
  actionsSlot?: ReactNode;
  tabsSlot?: ReactNode;
}

export function AdminSinglePostHeader({
  pluginBreadcrumb,
  heading,
  description,
  onBack,
  showActions = true,
  actionsSlot,
  tabsSlot,
}: AdminSinglePostHeaderProps) {
  return (
    <div className="border-b bg-muted/40 space-y-4">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Admin / {pluginBreadcrumb}
          </p>
          <h1 className="text-3xl font-bold">{heading}</h1>
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
        </div>
        
      </div>
      <div className="container flex">
      {showActions ? (
          <div className="container flex flex-shrink-0 gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {actionsSlot}
          </div>
        ) : null}
      {tabsSlot ? <div className="container pb-4 justify-start">{tabsSlot}</div> : null}
    </div>
    </div>
  );
}

