import { OrganizationTabs } from "./OrganizationTabs";

export default async function AdminOrganizationLayout(props: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const params = await props.params;
  const organizationId = params.organizationId;

  return (
    <div className="animate-in fade-in mx-auto space-y-8 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization profile, members, and connections.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex w-full overflow-x-auto md:w-auto">
          <OrganizationTabs organizationId={organizationId} />
        </div>
        {props.children}
      </div>
    </div>
  );
}

