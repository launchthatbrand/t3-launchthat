import { CSSProperties, ReactNode, forwardRef } from "react";

import { getClassNameFactory } from "../../core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Section", styles);

export type SectionProps = {
  className?: string;
  children: ReactNode;
  maxWidth?: string;
  style?: CSSProperties;
};

export const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({ children, className, maxWidth = "1280px", style = {} }, ref) => {
    return (
      <div
        className={`${getClassName()}${className ? ` ${className}` : ""}`}
        style={{
          ...style,
        }}
        ref={ref}
      >
        <div className={getClassName("inner")} style={{ maxWidth }}>
          {children}
        </div>
      </div>
    );
  },
);
