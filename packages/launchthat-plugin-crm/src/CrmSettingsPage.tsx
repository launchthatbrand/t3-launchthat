export const CrmSettingsPage = () => {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">CRM Settings</div>
        <div className="text-muted-foreground text-sm">
          Configure the CRM plugin and jump to the Contacts admin.
        </div>
      </div>
      <div>
        <a className="text-primary underline" href="/admin/contacts">
          Open Contacts
        </a>
      </div>
    </div>
  );
};
