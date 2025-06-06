import { Badge } from "@acme/ui/badge";
import { EntityListItem } from "./types";
import { formatDistanceToNow } from "date-fns";

interface SimpleEntityListProps {
  items: EntityListItem[];
  onItemClick?: (id: string) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function SimpleEntityList({
  items,
  onItemClick,
  emptyMessage = "No items found",
  isLoading = false,
}: SimpleEntityListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Format time
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="divide-y">
      {items.map((item) => (
        <div
          key={item.id}
          className={`cursor-pointer p-4 transition-colors hover:bg-muted/50 ${
            item.isSelected ? "bg-muted" : ""
          }`}
          onClick={() => onItemClick && onItemClick(item.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-medium">{item.title}</h4>
                {item.badge && (
                  <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
                )}
              </div>
              {item.subtitle && (
                <p className="truncate text-sm text-muted-foreground">
                  {item.subtitle}
                </p>
              )}
              {item.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
            {item.timestamp && (
              <div className="whitespace-nowrap text-xs text-muted-foreground">
                {formatTime(item.timestamp)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
