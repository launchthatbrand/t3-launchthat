import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export interface GroupOverviewProps {
  title?: string;
  description: string;
  categoryTags?: string[];
  creationTime: number;
}

export function GroupOverview({
  title = "Group Overview",
  description,
  categoryTags = [],
  creationTime,
}: GroupOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Group created {formatDistanceToNow(creationTime)} ago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">{description}</div>
          {categoryTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoryTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-muted px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          View Complete About
        </Button>
      </CardFooter>
    </Card>
  );
}
