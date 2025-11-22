import React from "react";
import type { CSSProperties, ReactNode } from "react";

import { BackgroundImageField } from "./BackgroundImageField";
import { BorderRadiusField, type BorderRadiusValue, type BorderRadiusOption } from "./BorderRadiusField";

type FieldRenderArgs<TValue> = {
  value?: TValue;
  onChange: (value: TValue) => void;
};

type PaddingOption = "0" | "2" | "4" | "6" | "8";
type WidthOption = "auto" | "full" | "3/4" | "1/2" | "1/3";
type BackgroundColorOption = "transparent" | "white" | "gray-50" | "gray-100" | "primary" | "secondary" | "accent";
type DropShadowOption = "none" | "sm" | "md" | "lg" | "xl" | "2xl";
type BorderColorOption = "none" | "gray-200" | "gray-300" | "gray-400" | "primary" | "secondary" | "accent" | "border";
type OverlayColorOption = "black" | "white" | "primary" | "secondary" | "accent" | "gray-900";
type OverlayOpacityOption = "10" | "20" | "30" | "40" | "50" | "60" | "70" | "80" | "90";

export type BackgroundImageMedia = {
  url?: string;
  [key: string]: unknown;
};

export interface BackgroundImageSettings {
  enabled: boolean;
  media: BackgroundImageMedia[];
  url: string;
  size: string;
  position: string;
  repeat: string;
  attachment: string;
}

export interface StyleSettings {
  padding?: PaddingOption;
  marginBottom?: PaddingOption;
  width?: WidthOption;
  backgroundColor?: BackgroundColorOption;
  backgroundImage?: BackgroundImageSettings;
  dropShadow?: DropShadowOption;
  borderRadius?: BorderRadiusValue | BorderRadiusOption;
  borderColor?: BorderColorOption;
  overlay?: boolean;
  overlayColor?: OverlayColorOption;
  overlayOpacity?: OverlayOpacityOption;
  customCss?: string;
  advancedCss?: string;
}

export type StylePropInput = StyleSettings | { styles?: StyleSettings } | null | undefined;

const hasStylesProperty = (value: StylePropInput): value is { styles?: StyleSettings } =>
  Boolean(value) && typeof value === "object" && "styles" in value;

const resolveStyleProps = (props?: StylePropInput): StyleSettings => {
  if (hasStylesProperty(props)) {
    return props.styles ?? {};
  }
  return (props as StyleSettings) ?? {};
};

// Shared styling fields for all components - wrapped in a collapsible object
export const styleFields = {
  styles: {
    type: "object",
    label: "🎨 Style Settings",
    objectFields: {
      padding: {
        type: "select",
        label: "Padding",
        options: [
          { label: "None", value: "0" },
          { label: "Small", value: "2" },
          { label: "Medium", value: "4" },
          { label: "Large", value: "6" },
          { label: "XLarge", value: "8" },
        ],
      },
      marginBottom: {
        type: "select",
        label: "Bottom Spacing",
        options: [
          { label: "None", value: "0" },
          { label: "Small", value: "2" },
          { label: "Medium", value: "4" },
          { label: "Large", value: "6" },
          { label: "XLarge", value: "8" },
        ],
      },
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Inline (Auto)", value: "auto" },
          { label: "Full Width", value: "full" },
          { label: "Large (75%)", value: "3/4" },
          { label: "Half (50%)", value: "1/2" },
          { label: "Small (33%)", value: "1/3" },
        ],
      },
      backgroundColor: {
        type: "select",
        label: "Background Color",
        options: [
          { label: "None", value: "transparent" },
          { label: "White", value: "white" },
          { label: "Gray Light", value: "gray-50" },
          { label: "Gray", value: "gray-100" },
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Accent", value: "accent" },
        ],
      },
      backgroundImage: {
        type: "custom",
        label: "Background Image",
        render: ({ value, onChange }: FieldRenderArgs<BackgroundImageSettings>) => (
          <BackgroundImageField value={value} onChange={onChange} />
        ),
      },
      dropShadow: {
        type: "select",
        label: "Drop Shadow",
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "XLarge", value: "xl" },
          { label: "2XLarge", value: "2xl" },
        ],
      },
      borderRadius: {
        type: "custom",
        label: "Border Radius",
        render: ({ value, onChange }: FieldRenderArgs<BorderRadiusValue>) => (
          <BorderRadiusField value={value} onChange={onChange} />
        ),
      },
      borderColor: {
        type: "select",
        label: "Border Color",
        options: [
          { label: "None", value: "none" },
          { label: "Gray Light", value: "gray-200" },
          { label: "Gray", value: "gray-300" },
          { label: "Gray Dark", value: "gray-400" },
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Accent", value: "accent" },
          { label: "Border (Default)", value: "border" },
        ],
      },
      overlay: {
        type: "radio",
        label: "Overlay",
        options: [
          { label: "None", value: false },
          { label: "Enable", value: true },
        ],
      },
      overlayColor: {
        type: "select",
        label: "Overlay Color",
        options: [
          { label: "Black", value: "black" },
          { label: "White", value: "white" },
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Accent", value: "accent" },
          { label: "Gray", value: "gray-900" },
        ],
      },
      overlayOpacity: {
        type: "select",
        label: "Overlay Opacity",
        options: [
          { label: "10%", value: "10" },
          { label: "20%", value: "20" },
          { label: "30%", value: "30" },
          { label: "40%", value: "40" },
          { label: "50%", value: "50" },
          { label: "60%", value: "60" },
          { label: "70%", value: "70" },
          { label: "80%", value: "80" },
          { label: "90%", value: "90" },
        ],
      },
      customCss: {
        type: "textarea",
        label: "Additional CSS Classes",
        placeholder: "e.g., hover:scale-105 transition-all duration-300",
      },
      advancedCss: {
        type: "textarea",
        label: "Custom CSS (Advanced)",
        placeholder: "selector { color: red; }\nselector .card { border: none; }",
      },
    },
  },
};

// Default style props (nested under styles object)
export const defaultStyleProps: { styles: StyleSettings } = {
  styles: {
    padding: "4",
    marginBottom: "0",
    width: "full",
    backgroundColor: "transparent",
    backgroundImage: {
      enabled: false,
      media: [],
      url: "",
      size: "cover",
      position: "center",
      repeat: "no-repeat",
      attachment: "scroll",
    },
    dropShadow: "none",
    borderRadius: {
      mode: "all",
      all: "none",
      corners: { tl: "none", tr: "none", br: "none", bl: "none" },
    },
    borderColor: "none",
    overlay: false,
    overlayColor: "black",
    overlayOpacity: "50",
    customCss: "",
    advancedCss: "",
  },
};

// Helper to generate wrapper classes from style props
export const getWrapperClasses = (props?: StylePropInput): string => {
  const styleProps = resolveStyleProps(props);

  const padding = (styleProps.padding ?? defaultStyleProps.styles.padding) as PaddingOption;
  const marginBottom = (styleProps.marginBottom ?? defaultStyleProps.styles.marginBottom) as PaddingOption;
  const width = (styleProps.width ?? defaultStyleProps.styles.width) as WidthOption;
  const backgroundColor = (styleProps.backgroundColor ?? defaultStyleProps.styles.backgroundColor) as BackgroundColorOption;
  const dropShadow = (styleProps.dropShadow ?? defaultStyleProps.styles.dropShadow) as DropShadowOption;
  const borderRadius = styleProps.borderRadius ?? defaultStyleProps.styles.borderRadius;
  const borderColor = (styleProps.borderColor ?? defaultStyleProps.styles.borderColor) as BorderColorOption;
  const overlay = styleProps.overlay ?? defaultStyleProps.styles.overlay ?? false;

  const classes: string[] = [];

  const paddingClasses: Record<PaddingOption, string> = {
    "0": "",
    "2": "p-2",
    "4": "p-4",
    "6": "p-6",
    "8": "p-8",
  };
  const paddingClass = paddingClasses[padding];
  if (paddingClass) classes.push(paddingClass);

  const marginClasses: Record<PaddingOption, string> = {
    "0": "",
    "2": "mb-2",
    "4": "mb-4",
    "6": "mb-6",
    "8": "mb-8",
  };
  const marginClass = marginClasses[marginBottom];
  if (marginClass) classes.push(marginClass);

  const widthClasses: Record<WidthOption, string> = {
    auto: "w-auto",
    full: "w-full",
    "3/4": "w-3/4 mx-auto",
    "1/2": "w-1/2 mx-auto",
    "1/3": "w-1/3 mx-auto",
  };
  classes.push(widthClasses[width] || "w-full");

  const bgClasses: Record<BackgroundColorOption, string> = {
    transparent: "",
    white: "bg-white",
    "gray-50": "bg-gray-50",
    "gray-100": "bg-gray-100",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
  };
  const bgClass = bgClasses[backgroundColor];
  if (bgClass) classes.push(bgClass);

  const shadowClasses: Record<DropShadowOption, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };
  const shadowClass = shadowClasses[dropShadow];
  if (shadowClass) classes.push(shadowClass);

  const radiusValue =
    typeof borderRadius === "string"
      ? (borderRadius as BorderRadiusOption)
      : borderRadius?.mode === "all"
      ? borderRadius.all
      : null;

  if (radiusValue) {
    const radiusClasses: Record<BorderRadiusOption, string> = {
      none: "",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    };
    const radiusClass = radiusClasses[radiusValue];
    if (radiusClass) classes.push(radiusClass);
  } else if (typeof borderRadius === "object" && borderRadius?.mode === "individual") {
    const { tl, tr, br, bl } = borderRadius.corners;

    const tlClasses: Record<BorderRadiusOption, string> = {
      none: "",
      sm: "rounded-tl-sm",
      md: "rounded-tl-md",
      lg: "rounded-tl-lg",
      xl: "rounded-tl-xl",
      "2xl": "rounded-tl-2xl",
      full: "rounded-tl-full",
    };
    if (tlClasses[tl]) classes.push(tlClasses[tl]);

    const trClasses: Record<BorderRadiusOption, string> = {
      none: "",
      sm: "rounded-tr-sm",
      md: "rounded-tr-md",
      lg: "rounded-tr-lg",
      xl: "rounded-tr-xl",
      "2xl": "rounded-tr-2xl",
      full: "rounded-tr-full",
    };
    if (trClasses[tr]) classes.push(trClasses[tr]);

    const brClasses: Record<BorderRadiusOption, string> = {
      none: "",
      sm: "rounded-br-sm",
      md: "rounded-br-md",
      lg: "rounded-br-lg",
      xl: "rounded-br-xl",
      "2xl": "rounded-br-2xl",
      full: "rounded-br-full",
    };
    if (brClasses[br]) classes.push(brClasses[br]);

    const blClasses: Record<BorderRadiusOption, string> = {
      none: "",
      sm: "rounded-bl-sm",
      md: "rounded-bl-md",
      lg: "rounded-bl-lg",
      xl: "rounded-bl-xl",
      "2xl": "rounded-bl-2xl",
      full: "rounded-bl-full",
    };
    if (blClasses[bl]) classes.push(blClasses[bl]);
  }

  const borderColorClasses: Record<BorderColorOption, string> = {
    none: "",
    "gray-200": "border border-gray-200",
    "gray-300": "border border-gray-300",
    "gray-400": "border border-gray-400",
    primary: "border border-primary",
    secondary: "border border-secondary",
    accent: "border border-accent",
    border: "border",
  };
  const borderColorClass = borderColorClasses[borderColor];
  if (borderColorClass) classes.push(borderColorClass);

  if (overlay) {
    classes.push("relative");
  }

  const customCss = styleProps.customCss ?? "";
  if (customCss.trim()) {
    classes.push(customCss.trim());
  }

  return classes.filter(Boolean).join(" ");
};

// Helper to process and inject advanced CSS
export const getAdvancedCssStyles = (props?: StylePropInput, widgetId = ""): string | null => {
  const styleProps = resolveStyleProps(props);

  const customCss = styleProps.customCss ?? "";
  const advancedCss = styleProps.advancedCss ?? "";

  const finalCss = advancedCss || customCss;

  if (!finalCss.trim()) {
    return null;
  }

  const uniqueSelector = `[data-puck-widget="${widgetId}"]`;
  return finalCss.replace(/selector/g, uniqueSelector);
};

// Helper to generate background image inline styles
export const getBackgroundImageStyles = (props?: StylePropInput): CSSProperties => {
  const styleProps = resolveStyleProps(props);
  const backgroundImage = styleProps.backgroundImage ?? defaultStyleProps.styles.backgroundImage;

  const mediaUrl = backgroundImage.media?.[0]?.url ?? backgroundImage.url;
  if (!backgroundImage.enabled || !mediaUrl) {
    return {};
  }

  return {
    backgroundImage: `url('${mediaUrl}')`,
    backgroundSize: backgroundImage.size || "cover",
    backgroundPosition: backgroundImage.position || "center",
    backgroundRepeat: backgroundImage.repeat || "no-repeat",
    backgroundAttachment: backgroundImage.attachment || "scroll",
  };
};

// Helper to generate overlay element
export const getOverlayElement = (props?: StylePropInput): ReactNode => {
  const styleProps = resolveStyleProps(props);

  const overlay = styleProps.overlay ?? defaultStyleProps.styles.overlay ?? false;
  const overlayColor = (styleProps.overlayColor ?? defaultStyleProps.styles.overlayColor) as OverlayColorOption;
  const overlayOpacity =
    (styleProps.overlayOpacity ?? defaultStyleProps.styles.overlayOpacity) as OverlayOpacityOption;

  if (!overlay) return null;

  const opacity = Number(overlayOpacity) / 100;
  const themeColorOverlay = ["primary", "secondary", "accent"].includes(overlayColor);

  if (themeColorOverlay) {
    const colorVarMap: Record<OverlayColorOption, string> = {
      primary: "var(--primary)",
      secondary: "var(--secondary)",
      accent: "var(--accent)",
      black: "0 0% 0%",
      white: "0 0% 100%",
      "gray-900": "0 0% 13%",
    };

    return (
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ backgroundColor: `hsl(${colorVarMap[overlayColor]} / ${opacity})` }}
        aria-hidden="true"
      />
    );
  }

  const overlayColorClasses: Record<Extract<OverlayColorOption, "black" | "white" | "gray-900">, string> = {
    black: "bg-black",
    white: "bg-white",
    "gray-900": "bg-gray-900",
  };

  const overlayOpacityClasses: Record<OverlayOpacityOption, string> = {
    "10": "bg-opacity-10",
    "20": "bg-opacity-20",
    "30": "bg-opacity-30",
    "40": "bg-opacity-40",
    "50": "bg-opacity-50",
    "60": "bg-opacity-60",
    "70": "bg-opacity-70",
    "80": "bg-opacity-80",
    "90": "bg-opacity-90",
  };

  const colorClass =
    overlayColorClasses[overlayColor as Extract<OverlayColorOption, "black" | "white" | "gray-900">] ??
    overlayColorClasses.black;
  const opacityClass = overlayOpacityClasses[overlayOpacity] ?? overlayOpacityClasses["50"];

  return (
    <div
      className={`absolute inset-0 ${colorClass} ${opacityClass} pointer-events-none z-10`}
      aria-hidden="true"
    />
  );
};
