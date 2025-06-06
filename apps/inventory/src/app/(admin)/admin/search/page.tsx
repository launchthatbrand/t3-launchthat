import { GlobalSearchCommand } from "@/components/shared/GlobalSearchCommand";

export default function GlobalSearchTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-2xl font-bold">Global Search Test</h1>

      <div className="mb-8">
        <h2 className="mb-3 text-xl">Dialog Mode (Default)</h2>
        <div className="w-full max-w-sm">
          <GlobalSearchCommand />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xl">Inline Mode</h2>
        <div className="w-full max-w-lg">
          <GlobalSearchCommand displayMode="inline" />
        </div>
      </div>
    </div>
  );
}
