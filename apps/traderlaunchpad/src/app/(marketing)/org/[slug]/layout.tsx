import { OrgPublicProfileShell } from "./OrgPublicProfileShell";
import React from "react";
import { redirect } from "next/navigation";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

export default async function PublicOrgLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const decoded = decodeURIComponent(slug);
  const canonical = slugify(decoded);
  if (canonical && canonical !== decoded.toLowerCase().trim()) {
    redirect(`/org/${encodeURIComponent(canonical)}`);
  }

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30">
      <OrgPublicProfileShell slug={canonical || decoded.toLowerCase().trim()}>
        {props.children}
      </OrgPublicProfileShell>
    </div>
  );
}

