import { redirect } from "next/navigation";

const allowedTabs = new Set([
  "account",
  "connections",
  "journal",
  "visibility",
  "notifications",
  "billing",
  "organizations",
]);

export default async function AdminSettingsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const raw = searchParams.tab;
  const tab = typeof raw === "string" && allowedTabs.has(raw) ? raw : "account";
  redirect(`/admin/settings/${tab}`);
}
