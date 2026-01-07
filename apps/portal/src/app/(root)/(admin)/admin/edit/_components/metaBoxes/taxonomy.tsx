import type { RegisteredMetaBox } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Label } from "@acme/ui/label";
import { MultiSelect } from "@acme/ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { AdminMetaBoxContext } from "../types";

interface TermOption { label: string; value: string }

interface TaxonomyBlock {
  options: TermOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  loadingLabel?: string | null;
  footerLabel?: string | null;
  disabled?: boolean;
}

const readTaxonomyBlock = (
  context: AdminMetaBoxContext,
  key: "categories" | "tags",
): TaxonomyBlock | null => {
  const taxonomy = (context as any).taxonomy as Record<string, unknown> | null;
  if (!taxonomy || typeof taxonomy !== "object") {
    return null;
  }
  const block = taxonomy[key] as any;
  if (!block || typeof block !== "object") {
    return null;
  }
  const options = Array.isArray(block.options) ? (block.options as TermOption[]) : [];
  const selected = Array.isArray(block.selected) ? (block.selected as string[]) : [];
  const onChange = typeof block.onChange === "function" ? (block.onChange as (v: string[]) => void) : null;
  const placeholder = typeof block.placeholder === "string" ? block.placeholder : "";
  if (!onChange || !placeholder) {
    return null;
  }
  return {
    options,
    selected,
    onChange,
    placeholder,
    loadingLabel:
      typeof block.loadingLabel === "string" ? (block.loadingLabel as string) : null,
    footerLabel:
      typeof block.footerLabel === "string" ? (block.footerLabel as string) : null,
    disabled: Boolean(block.disabled),
  };
};

const CategoriesMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const block = readTaxonomyBlock(context, "categories");
  if (!block) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Categories</Label>
      <MultiSelect
        options={block.options}
        defaultValue={block.selected}
        onValueChange={block.onChange}
        placeholder={block.placeholder}
        maxCount={3}
        disabled={block.disabled}
      />
      {block.loadingLabel ? (
        <p className="text-muted-foreground text-xs">{block.loadingLabel}</p>
      ) : null}
      {block.footerLabel ? (
        <p className="text-muted-foreground text-xs">{block.footerLabel}</p>
      ) : null}
    </div>
  );
};

const TagsMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const block = readTaxonomyBlock(context, "tags");
  if (!block) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Tags</Label>
      <MultiSelect
        options={block.options}
        defaultValue={block.selected}
        onValueChange={block.onChange}
        placeholder={block.placeholder}
        maxCount={3}
        disabled={block.disabled}
      />
      {block.loadingLabel ? (
        <p className="text-muted-foreground text-xs">{block.loadingLabel}</p>
      ) : null}
    </div>
  );
};

export const registerTaxonomyMetaBoxes: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>(
    "sidebar",
    (context): RegisteredMetaBox<AdminMetaBoxContext> | null => {
      if (context.visibility?.showSidebarTaxonomy === false) {
        return null;
      }
      const taxonomy = (context as any).taxonomy as
        | { supportsTaxonomy?: boolean }
        | null
        | undefined;
      if (!taxonomy?.supportsTaxonomy) {
        return null;
      }

      const hasCategories = Boolean(readTaxonomyBlock(context, "categories"));
      const hasTags = Boolean(readTaxonomyBlock(context, "tags"));
      if (!hasCategories && !hasTags) {
        return null;
      }

      const defaultTab = hasCategories ? "categories" : "tags";

      return {
        id: "core-taxonomy",
        title: "Taxonomy",
        description: "Assign categories and tags to this entry.",
        location: "sidebar",
        priority: 30,
        render: () => (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid h-9 w-full grid-cols-2">
              <TabsTrigger value="categories" disabled={!hasCategories}>
                Categories
              </TabsTrigger>
              <TabsTrigger value="tags" disabled={!hasTags}>
                Tags
              </TabsTrigger>
            </TabsList>
            <TabsContent value="categories" className="pt-3">
              <CategoriesMetaBox context={context} />
            </TabsContent>
            <TabsContent value="tags" className="pt-3">
              <TagsMetaBox context={context} />
            </TabsContent>
          </Tabs>
        ),
      };
    },
  );
};


