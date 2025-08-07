import { AlertCircle, Loader2, Plug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { Plugin, PluginContext } from "../types";
import { useActivePlugins, usePluginActivation } from "../hooks";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";
import React from "react";
import { Switch } from "@acme/ui/switch";
import { pluginRegistry } from "../registry";

interface PluginManagerProps {
  context?: PluginContext;
  className?: string;
}

interface PluginCardProps {
  plugin: Plugin;
  context?: PluginContext;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, context }) => {
  const { isActive, isLoading, error, activate, deactivate } =
    usePluginActivation(plugin.id);

  const handleToggle = async () => {
    if (isActive) {
      await deactivate(context);
    } else {
      await activate(context);
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Plug className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {plugin.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">v{plugin.version}</p>
              {plugin.author && (
                <p className="text-xs text-muted-foreground">
                  by {plugin.author}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>

            <div className="flex items-center space-x-2">
              <Switch
                id={`plugin-${plugin.id}`}
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={isLoading}
              />
              <Label
                htmlFor={`plugin-${plugin.id}`}
                className="cursor-pointer text-xs"
              >
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {plugin.description && (
          <p className="mb-3 text-sm text-muted-foreground">
            {plugin.description}
          </p>
        )}

        {error && (
          <div className="mb-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error.message}
          </div>
        )}

        {/* Plugin capabilities */}
        <div className="space-y-2">
          {plugin.tabs && plugin.tabs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Tabs:</span>
              <div className="flex gap-1">
                {plugin.tabs.map((tab) => (
                  <Badge key={tab.id} variant="outline" className="text-xs">
                    {tab.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {plugin.sidebar && plugin.sidebar.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Sidebar:</span>
              <Badge variant="outline" className="text-xs">
                {plugin.sidebar.length} component(s)
              </Badge>
            </div>
          )}

          {plugin.slots && Object.keys(plugin.slots).length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Slots:</span>
              <Badge variant="outline" className="text-xs">
                {Object.keys(plugin.slots).length} slot(s)
              </Badge>
            </div>
          )}

          {plugin.areas && plugin.areas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Areas:</span>
              <div className="flex gap-1">
                {plugin.areas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const PluginManager: React.FC<PluginManagerProps> = ({
  context,
  className,
}) => {
  const activePlugins = useActivePlugins();
  const allPlugins = pluginRegistry.getAllPlugins();

  const activeCount = activePlugins.length;
  const totalCount = allPlugins.length;

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Plugin Manager</h2>
            <p className="text-muted-foreground">
              Manage plugins to extend functionality
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">
              {activeCount}/{totalCount}
            </div>
            <p className="text-sm text-muted-foreground">Plugins Active</p>
          </div>
        </div>
      </div>

      {allPlugins.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center">
            <Plug className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No Plugins Available</h3>
            <p className="text-center text-muted-foreground">
              No plugins have been registered yet. Register plugins to extend
              functionality.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allPlugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} context={context} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PluginManager;
