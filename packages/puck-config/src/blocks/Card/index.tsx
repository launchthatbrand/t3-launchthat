import { WithLayout, withLayout } from "../../components/Layout";

import { ComponentConfig } from "@measured/puck";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { getClassNameFactory } from "../../core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Card", styles);

type IconImporter = () => Promise<{
  default: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}>;

const iconOptions = Object.keys(dynamicIconImports).map((iconName) => ({
  label: iconName,
  value: iconName,
}));

const lazyIcons = Object.entries(dynamicIconImports).reduce<
  Record<string, React.LazyExoticComponent<React.ComponentType>>
>((acc, [name, importer]) => {
  acc[name] = React.lazy(importer as IconImporter);
  return acc;
}, {});

export type CardProps = WithLayout<{
  title: string;
  description: string;
  icon?: string;
  mode: "flat" | "card";
}>;


const CardInner: ComponentConfig<CardProps> = {
  fields: {
    title: {
      type: "text",
      contentEditable: true,
    },
    description: {
      type: "textarea",
      contentEditable: true,
    },
    icon: {
      type: "select",
      options: iconOptions,
    },
    mode: {
      type: "radio",
      options: [
        { label: "card", value: "card" },
        { label: "flat", value: "flat" },
      ],
    },
  },
  defaultProps: {
    title: "Title",
    description: "Description",
    icon: "Feather",
    mode: "flat",
  },
  render: ({ title, icon, description, mode }) => {
    const Icon = icon ? lazyIcons[icon] : undefined;

    return (
      <div className={getClassName({ [mode]: mode })}>
        <div className={getClassName("inner")}>
          <div className={getClassName("icon")}>
            {Icon ? (
              <React.Suspense fallback={null}>
                <Icon />
              </React.Suspense>
            ) : null}
          </div>

          <div className={getClassName("title")}>{title}</div>
          <div className={getClassName("description")}>{description}</div>
        </div>
      </div>
    );
  },
};

export const Card = withLayout(CardInner);
