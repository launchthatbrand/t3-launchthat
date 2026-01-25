import { redirect } from "next/navigation";

export default async function AdminSettingsConnectionAccountPage(props: {
  params: Promise<{ accountRowId: string }>;
}) {
  const params = await props.params;
  redirect(`/admin/connections/${encodeURIComponent(params.accountRowId)}`);
}

