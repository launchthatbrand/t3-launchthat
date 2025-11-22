"use client";

import "@measured/puck/puck.css";

import { AutoField, FieldLabel, Puck } from "@measured/puck";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import puckConfig, { setTemplateStorage } from "@acme/puck-config";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";

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

export default function EditPage() {
  const searchParams = useSearchParams();
  const pageIdentifier = searchParams.get("pageIdentifier");
  const title = searchParams.get("title") ?? "Puck Editor";
  const organizationIdParam = searchParams.get("organizationId");
  const scopeKey =
    organizationIdParam && organizationIdParam !== "public"
      ? organizationIdParam
      : "global";
  const convex = useConvex();
  const templateScopeRef = useRef<string | null>(null);

  if (templateScopeRef.current !== scopeKey) {
    setTemplateStorage((_key) =>
      createConvexTemplateStorage({
        convex,
        scopeKey,
      }),
    );
    templateScopeRef.current = scopeKey;
  }

  const storedData = useQuery(
    api.puckEditor.queries.getData,
    pageIdentifier ? { pageIdentifier } : "skip",
  );
  const saveMutation = useMutation(api.puckEditor.mutations.updateData);
  const [isSaving, setIsSaving] = useState(false);

  const isDataLoading = storedData === undefined;

  const initialData = useMemo<Data>(() => {
    if (typeof storedData !== "string") {
      return EMPTY_DATA;
    }
    try {
      return JSON.parse(storedData) as Data;
    } catch (error) {
      console.error("Failed to parse saved Puck data", error);
      return EMPTY_DATA;
    }
  }, [storedData]);

  if (!pageIdentifier) {
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

  if (isDataLoading) {
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
    console.log("Saving data", data);
    setIsSaving(true);
    try {
      await Promise.resolve(
        saveMutation({
          pageIdentifier,
          data: JSON.stringify({
            root: { ...data.root },
            content: [...data.content],
          }),
        }),
      );
      toast.success("Page saved successfully");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* <header className="flex flex-col border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Puck Visual Builder</p>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
        <div className="mt-4 flex gap-2 lg:mt-0">
          <Button variant="secondary" onClick={() => window.close()}>
            Exit Editor
          </Button>
        </div>
      </header> */}

      <section className="flex-1 overflow-auto">
        <Puck
          key={pageIdentifier}
          config={puckConfig}
          data={initialData}
          onPublish={handlePublish}
          plugins={[objectAccordionPlugin]}
          fieldTransforms={
            {
              userField: ({ value }: { value: unknown }) => value,
            } as any
          }
          overrides={
            {
              drawer: SearchableDrawer,
              fieldTypes: {
                userField: ({
                  readOnly,
                  field,
                  name,
                  value,
                  onChange,
                }: {
                  readOnly?: boolean;
                  field: { label?: string };
                  name: string;
                  value: unknown;
                  onChange: (next: unknown) => void;
                }) => (
                  <FieldLabel
                    label={field.label || name}
                    readOnly={readOnly}
                    icon={<Type size={16} />}
                  >
                    <AutoField
                      field={{ type: "text" }}
                      onChange={onChange}
                      value={value}
                    />
                  </FieldLabel>
                ),
              },
            } as any
          }
        />
      </section>
    </main>
  );
}
