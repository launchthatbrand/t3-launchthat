"use client";

export const EmailsSettingsShell = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    // Tabs + title/description are provided by `admin/settings/layout.tsx` (AdminLayoutHeader).
    <div className="mx-auto max-w-6xl space-y-6">{children}</div>
  );
};


