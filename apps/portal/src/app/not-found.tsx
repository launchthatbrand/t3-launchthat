import Link from "next/link";

import { Button } from "@acme/ui/button";

export default function NotFound() {
  return (
    <main className="container mx-auto flex min-h-[70vh] max-w-3xl flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          404
        </p>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you’re looking for doesn’t exist (or may have moved).
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Admin</Link>
        </Button>
      </div>
    </main>
  );
}
