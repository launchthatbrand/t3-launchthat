import { redirect } from "next/navigation";

export default async function AdminSettingsConnectionsDiscordPage(props: {
  params: Promise<{ segments?: string | string[] }>;
}) {
  const params = await props.params;
  const segments = Array.isArray(params.segments)
    ? params.segments
    : params.segments
      ? [params.segments]
      : [];
  const suffix = segments.map((s) => encodeURIComponent(String(s))).join("/");
  redirect(`/admin/connections/discord${suffix ? `/${suffix}` : ""}`);
}

