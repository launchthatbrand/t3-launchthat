export const CmsSettingsPage = () => {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">CMS Settings</div>
        <div className="text-muted-foreground text-sm">
          Configure the CRM/CMS plugin and jump to the Contacts admin.
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


