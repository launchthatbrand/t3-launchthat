import "~/lib/plugins/installHooks.server";

import React from "react";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { ContentAccessRuleRecord } from "~/lib/access/contentAccessRuleSources";
import { listContentAccessRules } from "~/lib/access/contentAccessRuleSources";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { getActiveTenantFromHeaders } from "~/lib/tenant-headers";

interface OptionsRow {
  metaKey: string;
  metaValue?: unknown;
}

export default async function ContentAccessPage() {
  // Avoid importing Convex generated API at module scope (keep it inside the handler).
  const apiModule = (await import(
    "@/convex/_generated/api"
  )) as typeof import("@/convex/_generated/api");
  const apiAny = apiModule.api as unknown as {
    core: { options: { getByType: Parameters<typeof fetchQuery>[0] } };
  } & Record<string, unknown>;

  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  const pluginOptions = (await fetchQuery(apiAny.core.options.getByType, {
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  })) as OptionsRow[];

  const optionMap = new Map(
    pluginOptions.map((o) => [o.metaKey, Boolean(o.metaValue)]),
  );

  const enabledPluginIds: string[] = [];
  for (const plugin of pluginDefinitions) {
    if (!plugin.activation) {
      enabledPluginIds.push(plugin.id);
      continue;
    }
    const stored = optionMap.get(plugin.activation.optionKey);
    const isEnabled = stored ?? plugin.activation.defaultEnabled ?? false;
    if (isEnabled) enabledPluginIds.push(plugin.id);
  }

  const rules = await listContentAccessRules({
    organizationId: organizationId ? String(organizationId) : null,
    enabledPluginIds,
    query: (fn, args) =>
      fetchQuery(
        fn as unknown as Parameters<typeof fetchQuery>[0],
        args as unknown as Parameters<typeof fetchQuery>[1],
      ),
    api: apiModule.api,
  });

  const grouped = (() => {
    const map = new Map<string, ContentAccessRuleRecord[]>();
    for (const row of rules) {
      const key = row.source.pluginId ?? "core";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Rules</Badge>
            <span className="text-muted-foreground text-sm">
              {`${rules.length} total`}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            This is a read-only view of effective access rules contributed by
            core and enabled plugins.
          </p>
        </CardContent>
      </Card>

      {grouped.map(([pluginId, items]) => (
        <Card key={pluginId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{pluginId}</span>
              <Badge variant="outline">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((row) => {
              const title =
                row.resource.title ??
                `${row.resource.contentType}:${row.resource.contentId}`;
              const href = row.resource.href;
              return (
                <div
                  key={row.id}
                  className="flex items-start justify-between gap-4 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {href ? (
                        <Link className="hover:underline" href={href}>
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {row.ruleSummary}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {row.resource.contentType}:{row.resource.contentId}
                    </div>
                  </div>
                  <Badge variant="secondary">{row.source.sourceId}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
