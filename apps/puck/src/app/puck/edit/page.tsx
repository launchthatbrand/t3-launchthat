"use client";

import "@measured/puck/puck.css";

import { AutoField, FieldLabel, Puck } from "@measured/puck";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type {
  Doc,
  Id,
} from "../../../../../portal/convex/_generated/dataModel";
import puckConfig, { setTemplateStorage } from "@acme/puck-config";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@acme/ui/button";
import type { Data } from "@measured/puck";
import { SearchableDrawer } from "~/app/_components/SearchableDrawer";
import { Skeleton } from "@acme/ui";
import { Type } from "lucide-react";
import { api } from "../../../../../portal/convexspec";
import { createConvexTemplateStorage } from "~/lib/createConvexTemplateStorage";
import { objectAccordionPlugin } from "@acme/puck-config/plugins";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const EMPTY_DATA: Data = { root: {}, content: [] };

const resolveTenantSlugFromHost = (host?: string | null): string | null => {
  if (!host) {
    return null;
  }

  const normalized = host.toLowerCase();

  if (normalized.includes("localhost")) {
    const localMatch = /^([^.]+)\.localhost$/.exec(normalized);
    if (localMatch?.[1]) {
      return localMatch[1];
    }
    return null;
  }

  if (normalized.includes("---") && normalized.endsWith(".vercel.app")) {
    const [tenant] = normalized.split("---");
    return tenant ?? null;
  }

  const segments = normalized.split(".");
  if (segments.length <= 2) {
    return null;
  }

  return segments[0] ?? null;
};

export default function EditPage() {
  const searchParams = useSearchParams();
  const pageIdentifier = searchParams.get("pageIdentifier");
  const title = searchParams.get("title") ?? "Puck Editor";
  const postIdParam = searchParams.get("postId");
  const postId = postIdParam ? (postIdParam as Id<"posts">) : null;
  const postTypeSlug = searchParams.get("postType") ?? undefined;

  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [slugResolved, setSlugResolved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setTenantSlug(resolveTenantSlugFromHost(window.location.hostname));
    setSlugResolved(true);
  }, []);

  const tenantRecord = useQuery(
    api.core.organizations.queries.getBySlug,
    tenantSlug ? { slug: tenantSlug } : "skip",
  ) as Doc<"organizations"> | null | undefined;

  const organizationId = tenantRecord?._id as Id<"organizations"> | undefined;
  const organizationLoading = tenantSlug ? tenantRecord === undefined : false;
  const organizationNotFound = tenantSlug ? tenantRecord === null : false;
  const missingTenant = slugResolved && !tenantSlug;
  console.log("[EditPage] Params", {
    pageIdentifier,
    title,
    organizationId,
    postId,
    postTypeSlug,
    tenantSlug,
  });
  const scopeKey = organizationId ?? "global";
  const convex = useConvex();
  const templateScopeRef = useRef<string | null>(null);

  if (slugResolved && templateScopeRef.current !== scopeKey) {
    setTemplateStorage((_key) =>
      createConvexTemplateStorage({
        convex,
        scopeKey,
      }),
    );
    templateScopeRef.current = scopeKey;
  }

  const puckPayload = useQuery(
    api.puckEditor.queries.getData,
    pageIdentifier
      ? postId
        ? { pageIdentifier, postId }
        : { pageIdentifier }
      : "skip",
  );
  console.log("[EditPage] useQuery result", { puckPayload });
  const saveMutation = useMutation(api.puckEditor.mutations.updateData);
  const shouldFetchPost =
    Boolean(postId) &&
    slugResolved &&
    !missingTenant &&
    !organizationNotFound &&
    Boolean(organizationId);
  const primaryPostRecord = useQuery(
    api.core.posts.queries.getPostById,
    shouldFetchPost
      ? organizationId
        ? { id: postId as Id<"posts">, organizationId }
        : { id: postId as Id<"posts"> }
      : "skip",
  ) as Doc<"posts"> | null | undefined;

  const fallbackPostRecord = useQuery(
    api.core.posts.queries.getPostById,
    shouldFetchPost && organizationId
      ? {
          id: postId as Id<"posts">,
        }
      : "skip",
  ) as Doc<"posts"> | null | undefined;

  const postRecord = (primaryPostRecord ?? fallbackPostRecord) as
    | Doc<"posts">
    | null
    | undefined;
  const [isSaving, setIsSaving] = useState(false);

  const isPostLoading = shouldFetchPost && postRecord === undefined;
  const isPuckDataLoading = pageIdentifier ? puckPayload === undefined : false;
  const isDataLoading =
    isPostLoading ||
    isPuckDataLoading ||
    organizationLoading ||
    !slugResolved;

  const parsedPostContent = useMemo<Data | null>(() => {
    if (!postRecord || !postRecord.content) {
      return null;
    }
    try {
      return JSON.parse(postRecord.content) as Data;
    } catch (error) {
      console.error("Failed to parse stored post content", error);
      return null;
    }
  }, [postRecord]);

  const [editorData, setEditorData] = useState<Data | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current || isDataLoading) {
      return;
    }

    let resolvedData: Data | null = null;

    if (typeof puckPayload === "string") {
      try {
        const parsed = JSON.parse(puckPayload) as Data;
        if (parsed?.content) {
          console.log("[EditPage] Hydrating from puckPayload", parsed);
          resolvedData = parsed;
        }
      } catch (error) {
        console.error("Failed to parse stored Puck data", error);
      }
    }

    if (!resolvedData && parsedPostContent) {
      console.log("[EditPage] Hydrating from post.content");
      resolvedData = parsedPostContent;
    }

    if (!resolvedData) {
      console.log("[EditPage] No stored data found, using blank state");
      resolvedData = EMPTY_DATA;
    }

    setEditorData(resolvedData);
    hasHydrated.current = true;
  }, [isDataLoading, parsedPostContent, puckPayload]);

  if (!postId && !pageIdentifier) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Missing page identifier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              We couldn&apos;t determine which page you&apos;re trying to edit.
              Close this tab and relaunch the Puck editor from the portal.
            </p>
            <Button onClick={() => window.close()} variant="outline">
              Close tab
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (missingTenant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              This editor can only be opened from an organization subdomain.
              Launch it from your tenant (e.g.
              <code className="mx-1 rounded bg-muted px-1">
                tenant.localhost
              </code>
              ) and try again.
            </p>
            <Button onClick={() => window.close()} variant="outline">
              Close tab
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (tenantSlug && slugResolved && organizationNotFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Organization not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The tenant <span className="font-semibold">{tenantSlug}</span>{" "}
              could not be found. Open the editor from a valid organization
              subdomain.
            </p>
            <Button onClick={() => window.close()} variant="outline">
              Close tab
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (postId && postRecord === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Post not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The post associated with this editor could not be located. Close
              this tab and try again.
            </p>
            <Button onClick={() => window.close()} variant="outline">
              Close tab
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  console.log("[EditPage] editorData", editorData);

  if (isDataLoading || editorData === null) {
    return (
      <main className="flex min-h-screen flex-col bg-muted">
        <div className="z-10 h-16 w-full bg-white shadow-sm"></div>
        <div className="flex w-full flex-1">
          <div className="w-1/5 bg-white"></div>
          <div className="w-3/5 space-y-5 p-6">
            <div className="space-y-5 bg-white p-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="w-1/5 bg-white"></div>
        </div>
        {/* <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Loading Puck data…</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground">
            <p>Fetching the saved layout. This usually takes just a second.</p>
          </CardContent>
        </Card> */}
      </main>
    );
  }

  const handlePublish = async (data: Data) => {
    setIsSaving(true);
    try {
      const payload = JSON.stringify({
        root: { ...data.root },
        content: [...data.content],
      });

      if (!pageIdentifier) {
        throw new Error("Missing target for save operation");
      }

      await saveMutation({
        pageIdentifier,
        data: payload,
        ...(postId ? { postId } : {}),
        ...(organizationId ? { organizationId } : {}),
        ...(postTypeSlug ? { postTypeSlug } : {}),
        title,
      });

      toast.success("Page saved successfully");
    } catch (error) {
      console.error("Failed to save Puck data", error);
      toast.error(
        `Failed to save: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">


      <section className="flex-1 overflow-auto">
        <Puck
          config={puckConfig}
          data={editorData}
          onPublish={handlePublish}
          onChange={setEditorData}
          plugins={[objectAccordionPlugin]}
          // fieldTransforms={
          //   {
          //     userField: ({ value }: { value: unknown }) => value,
          //   } as any
          // }
          overrides={
            {
              drawer: SearchableDrawer,
              // fieldTypes: {
              //   // Example of user field provided via overrides
              //   userField: ({ readOnly, field, name, value, onChange }) => (
              //     <FieldLabel
              //       label={field.label || name}
              //       readOnly={readOnly}
              //       icon={<Type size={16} />}
              //     >
              //       <AutoField
              //         field={{ type: "text" }}
              //         onChange={onChange}
              //         value={value}
              //       />
              //     </FieldLabel>
              //   ),
              // },
            } as any
          }
        />
      </section>
    </main>
  );
}
