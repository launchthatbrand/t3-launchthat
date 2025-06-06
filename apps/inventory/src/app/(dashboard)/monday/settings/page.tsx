import { BoardMappingsTable } from "@/components/monday/BoardMappingsTable";
import { MondayIntegrationForm } from "@/components/monday/MondayIntegrationForm";
import { PerformanceSettingsForm } from "@/components/monday/PerformanceSettingsForm";
import { SyncRulesManager } from "@/components/monday/SyncRulesManager";
import { api } from "@/lib/convex";
import { useQuery } from "convex/react";

export default function MondaySettingsPage() {
  const integration = useQuery(api.monday.queries.getIntegration);
  const isLoading = integration === undefined;

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Monday.com Integration Settings</h1>
        <p className="text-muted-foreground">
          Configure your Monday.com integration, board mappings, and
          synchronization settings.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative mb-4 h-10 w-10">
              <Spinner />
            </div>
            <p className="text-muted-foreground">
              Loading integration settings...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                Integration Configuration
              </h2>
              <MondayIntegrationForm existingIntegration={integration?.[0]} />
            </div>

            {integration?.[0] && (
              <>
                <div>
                  <h2 className="mb-4 text-xl font-semibold">
                    Performance Settings
                  </h2>
                  <PerformanceSettingsForm
                    integrationId={integration[0]._id}
                    integration={integration[0]}
                  />
                </div>

                <div>
                  <h2 className="mb-4 text-xl font-semibold">Board Mappings</h2>
                  <BoardMappingsTable integrationId={integration[0]._id} />
                </div>

                <div>
                  <h2 className="mb-4 text-xl font-semibold">Sync Rules</h2>
                  <SyncRulesManager integrationId={integration[0]._id} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
