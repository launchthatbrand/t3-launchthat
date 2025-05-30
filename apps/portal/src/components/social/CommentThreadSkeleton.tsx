import { Skeleton } from "@acme/ui/skeleton";

export interface CommentThreadSkeletonProps {
  commentCount?: number;
  className?: string;
}

export function CommentThreadSkeleton({
  commentCount = 3,
  className = "",
}: CommentThreadSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment sort header */}
      <div className="flex items-center justify-between border-b pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Comment form */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="mt-2 flex justify-end">
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {Array.from({ length: commentCount }).map((_, index) => (
          <div key={index} className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
              </div>

              {/* Nested replies (only for the first comment) */}
              {index === 0 && (
                <div className="mt-3 space-y-3 border-l-2 border-muted pl-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1">
                      <div className="rounded-md bg-muted p-2">
                        <Skeleton className="h-3 w-20" />
                        <div className="mt-1 space-y-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-4/6" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Skeleton className="h-2 w-12" />
                        <Skeleton className="h-2 w-6" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Load more button */}
        <div className="flex justify-center pt-2">
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
