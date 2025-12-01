import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

export function FeedItemSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-3 p-4 pb-0">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-5 w-1/3 rounded-md" />
          <Skeleton className="h-3 w-1/4 rounded-md" />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        <Skeleton className="mb-2 h-4 w-full rounded-md" />
        <Skeleton className="mb-2 h-4 w-5/6 rounded-md" />
        <Skeleton className="mb-4 h-4 w-4/6 rounded-md" />

        {/* Simulate image placeholder */}
        <Skeleton className="h-40 w-full rounded-md" />
      </CardContent>

      <CardFooter className="flex justify-between border-t px-4 py-2">
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
        </div>

        <Skeleton className="h-8 w-8 rounded-md" />
      </CardFooter>
    </Card>
  );
}
