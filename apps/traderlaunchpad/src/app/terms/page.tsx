import Link from "next/link";

export default function TermsIndexPage() {
  return (
    <div className="container py-10 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Terms</h1>
      <p className="text-muted-foreground text-sm">
        Legal terms and policies.
      </p>
      <div className="space-y-2">
        <Link
          href="/terms/affiliates"
          className="text-sm font-medium underline underline-offset-4"
        >
          Affiliate Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
}

