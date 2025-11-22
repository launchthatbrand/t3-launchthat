/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useState } from "react";
import {
  AutoField,
  Button,
  ComponentConfig,
  createUsePuck,
  FieldLabel,
  Slot,
  walkTree,
} from "@measured/puck";

import { withLayout } from "../../components/Layout";
import { generateId } from "../../core/lib/generate-id";
import TemplateComponent, { TemplateProps } from "./Template";
import {
  getTemplateStorage,
  type TemplateData,
} from "./storage";

const usePuck = createUsePuck();
const DEFAULT_STORAGE_SCOPE = "puck-template-storage";

export const TemplateInternal: ComponentConfig<TemplateProps> = {
  fields: {
    template: {
      type: "custom",
      render: ({ name, value, onChange }) => {
        const templateKey = `puck-demo-templates:${DEFAULT_STORAGE_SCOPE}`;
        const storage = useMemo(
          () => getTemplateStorage(templateKey),
          [templateKey],
        );

        const props = usePuck((s) => s.selectedItem?.props) as
          | TemplateProps
          | undefined;

        const [templates, setTemplates] = useState<TemplateData>({
          blank: { label: "Blank", data: [] },
        });

        useEffect(() => {
          let mounted = true;
          (async () => {
            const storedTemplates = await storage.load();
            if (mounted) {
              setTemplates({
                blank: { label: "Blank", data: [] },
                ...storedTemplates,
              });
            }
          })().catch(() => {
            // ignore load errors and fall back to empty state
          });
          return () => {
            mounted = false;
          };
        }, [storage]);

        const templateEntries = Object.entries(templates);

        return (
          <FieldLabel label={name}>
            <AutoField
              value={value}
              onChange={onChange}
              field={{
                type: "select",
                options:
                  templateEntries.length > 0
                    ? templateEntries.map(([key, template]) => ({
                        value: key,
                        label: template?.label ?? key,
                      }))
                    : [{ label: "Blank", value: "blank" }],
              }}
            />
            <div style={{ marginLeft: "auto", marginTop: 16 }}>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!props?.children) {
                    return;
                  }

                  const templateId = generateId();

                  const { puckConfig: config } = await import("../../index");

                  const data = props.children.map((child) =>
                    walkTree(
                      {
                        type: child.type,
                        props: { ...child.props, id: generateId(child.type) },
                      },
                      config,
                      (content) =>
                        content.map((item) => ({
                          ...item,
                          props: { ...item.props, id: generateId(item.type) },
                        })),
                    ),
                  );

                  const templateData = {
                    ...templates,
                    [templateId]: {
                      label: new Date().toLocaleString(),
                      data,
                    },
                  };

                  await storage.save(templateData);

                  setTemplates(templateData);

                  onChange(templateId);
                }}
              >
                Save new template
              </Button>
            </div>
          </FieldLabel>
        );
      },
    },
    children: {
      type: "slot",
    },
  },
  defaultProps: {
    template: "blank",
    children: [],
  },
  resolveData: async (data, { changed, trigger }) => {
    if (!changed.template || trigger === "load") return data;

    const templateKey = `puck-demo-templates:${DEFAULT_STORAGE_SCOPE}`;
    const storage = getTemplateStorage(templateKey);

    const storedTemplates = await storage.load();

    const templates: TemplateData = {
      blank: {
        label: "Blank",
        data: [],
      },
      ...storedTemplates,
    };

    const selectedTemplate =
      typeof data.props.template === "string"
        ? data.props.template
        : "blank";

    const children =
      templates[selectedTemplate]?.data || templates["blank"]?.data || [];

    return {
      ...data,
      props: {
        ...data.props,
        children,
      },
    };
  },
  render: TemplateComponent,
};

export const Template = withLayout(TemplateInternal);
