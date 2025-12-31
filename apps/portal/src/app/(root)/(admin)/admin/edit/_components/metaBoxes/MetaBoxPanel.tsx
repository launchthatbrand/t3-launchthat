import type { ReactNode } from "react";

import { cn } from "@acme/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";

export type MetaBoxPanelVariant = "main" | "sidebar";

export interface MetaBoxPanelProps {
  id: string;
  title: string;
  description?: string | null;
  isOpen: boolean;
  onToggle: (nextOpen: boolean) => void;
  children: ReactNode;
  variant: MetaBoxPanelVariant;
}

export const MetaBoxPanel = ({
  id,
  title,
  description,
  isOpen,
  onToggle,
  children,
  variant,
}: MetaBoxPanelProps) => {
  const headerClassName =
    variant === "sidebar"
      ? "px-3 py-2 text-left text-sm bg-sidebar"
      : "px-4 py-3 text-left bg-sidebar ";
  const contentClassName = variant === "sidebar" ? "px-3 pb-3" : "px-4 pb-4";
  const bodyClassName =
    variant === "sidebar" ? "space-y-3 pt-2" : "space-y-4 pt-2";

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? id : undefined}
      onValueChange={(value) => onToggle(Boolean(value))}
      className={cn(
        "bg-card rounded-lg border",
        variant === "sidebar" ? "shadow-sm" : "",
      )}
    >
      <AccordionItem value={id} className="border-none">
        <AccordionTrigger className={cn(headerClassName, "border-b")}>
          <div className="flex flex-col text-left">
            <span className="text-md font-semibold">{title}</span>
            {description ? (
              <span
                className={cn(
                  "text-muted-foreground",
                  variant === "sidebar" ? "text-xs" : "text-sm",
                )}
              >
                {description}
              </span>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className={contentClassName}>
          <div
            className={cn(
              bodyClassName,
              variant === "sidebar" ? "text-sm" : "",
            )}
          >
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
