import { redirect } from "next/navigation";

export default async function AdminOrganizationPage(props: {
  params: Promise<{ organizationId: string }>;
}) {
  const params = await props.params;
  redirect(`/admin/organization/${encodeURIComponent(params.organizationId)}/public-profile`);
}

