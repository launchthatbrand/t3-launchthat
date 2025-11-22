import React from "react";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

import {
  getAdvancedCssStyles,
  getBackgroundImageStyles,
  getOverlayElement,
  getWrapperClasses,
  type StylePropInput,
} from "./styleFields";

type DivProps = Omit<HTMLAttributes<HTMLDivElement>, "style" | "className" | "children" | "ref">;

export type StyleWrapperProps = DivProps & {
  styleProps?: StylePropInput;
  children: ReactNode;
  className?: string;
  dragRef?: Ref<HTMLDivElement> | null;
  style?: CSSProperties;
  widgetId?: string | null;
};

/**
 * StyleWrapper Component
 * Automatically handles wrapper classes, background images, overlay rendering, and advanced CSS injection
 * Use this instead of manually calling getWrapperClasses and getOverlayElement
 */
export const StyleWrapper: React.FC<StyleWrapperProps> = ({
  styleProps,
  children,
  className = "",
  dragRef = null,
  style = {},
  widgetId = null,
  ...restProps
}) => {
  const wrapperClasses = getWrapperClasses(styleProps);
  const overlayElement = getOverlayElement(styleProps);
  const backgroundImageStyles = getBackgroundImageStyles(styleProps);

  const uniqueWidgetId = widgetId ?? `puck-${Math.random().toString(36).slice(2, 11)}`;
  const advancedCss = getAdvancedCssStyles(styleProps, uniqueWidgetId);

  const combinedStyles: CSSProperties = {
    ...backgroundImageStyles,
    ...style,
  };

  return (
    <>
      {advancedCss && (
        <style>{`/* Puck Widget Custom CSS - ${uniqueWidgetId} */\n${advancedCss}`}</style>
      )}

      <div
        className={[wrapperClasses, className].filter(Boolean).join(" ")}
        style={combinedStyles}
        ref={dragRef}
        data-puck-widget={uniqueWidgetId}
        {...restProps}
      >
        {overlayElement}
        <div className={overlayElement ? "relative z-20" : undefined}>{children}</div>
      </div>
    </>
  );
};
