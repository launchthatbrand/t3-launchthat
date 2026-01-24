import { redirect } from "next/navigation";

export default async function AdminOrganizationRedirectPage(props: {
  params: Promise<{ organizationId: string }>;
}) {
  const params = await props.params;
  redirect(`/admin/settings/organizations/${encodeURIComponent(params.organizationId)}`);
}

