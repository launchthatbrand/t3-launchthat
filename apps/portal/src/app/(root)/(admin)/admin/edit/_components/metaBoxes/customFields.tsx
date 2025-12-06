import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import type { AdminMetaBoxContext } from "../types";
import type { RegisteredMetaBox } from "./registry";
import { registerMetaBoxHook } from "./registry";

const CustomFieldsMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const data = context.customFields!;
  const {
    postTypeFieldsLoading,
    unassignedFields,
    renderCustomFieldControl,
    postMetaMap,
    slug,
  } = data;

  if (postTypeFieldsLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Fetching the latest custom fields for this post type.
      </div>
    );
  }

  if (unassignedFields.length === 0) {
    return (
      <div className="space-y-3">
        <Button variant="outline" asChild>
          <Link
            href={`/admin/settings/post-types?tab=fields&post_type=${slug}`}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Configure Fields
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm">
          Custom fields mirror WordPress&apos; post_meta table so plugins can
          rely on a familiar contract.
        </p>
      </div>
    );
  }

  return (
    <>
      {unassignedFields.map((field) => (
        <div key={field._id} className="space-y-2 rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor={`custom-field-${field._id}`}>
              {field.name}
              {field.required ? " *" : ""}
            </Label>
            <span className="text-muted-foreground text-xs tracking-wide uppercase">
              {field.type}
            </span>
          </div>
          {field.description ? (
            <p className="text-muted-foreground text-sm">{field.description}</p>
          ) : null}
          {renderCustomFieldControl(field)}
        </div>
      ))}
      <div className="space-y-2 rounded-md border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="custom-field-puck-data">Puck Data (JSON)</Label>
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            system
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Read-only representation of the stored Puck layout. Updates are
          managed automatically when using the Puck editor.
        </p>
        <Textarea
          id="custom-field-puck-data"
          value={
            typeof postMetaMap.puck_data === "string"
              ? postMetaMap.puck_data
              : ""
          }
          readOnly
          rows={8}
          className="font-mono text-xs"
        />
      </div>
    </>
  );
};

const registerCustomFieldsMetaBox = () =>
  registerMetaBoxHook("main", (context): RegisteredMetaBox | null => {
    if (
      context.visibility?.showCustomFieldsPanel === false ||
      !context.customFields
    ) {
      return null;
    }

    return {
      id: "core-custom-fields",
      title: "Custom Fields",
      description:
        "Fields defined in Post Type settings are stored as post_meta records.",
      location: "main",
      priority: 90,
      render: () => <CustomFieldsMetaBox context={context} />,
    };
  });

registerCustomFieldsMetaBox();
