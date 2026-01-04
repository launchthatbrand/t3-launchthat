"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export default function FrontendCatchAllNotFound() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const debugRouting = searchParams.get("debugRouting");
    console.log("[frontendRouting] not-found", {
      pathname,
      debugRouting,
      searchParams: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  const debugRouting = searchParams.get("debugRouting");

  return (
    <div className="p-6">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-muted-foreground text-sm">
            <div>
              <span className="font-medium">Path:</span> {pathname}
            </div>
            <div>
              <span className="font-medium">Query:</span>{" "}
              {searchParams.toString() || "(none)"}
            </div>
          </div>

          {!debugRouting && (
            <div className="text-sm">
              Tip: add <code>?debugRouting=1</code> to this URL and reload to
              print detailed routing logs.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
