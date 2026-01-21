import { SettingsTabs } from "./SettingsTabs";

export default function PlatformSettingsLayout(props: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-8 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure internal settings and integrations.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex w-full overflow-x-auto md:w-auto">
          <SettingsTabs />
        </div>

        {props.children}
      </div>
    </div>
  );
}

