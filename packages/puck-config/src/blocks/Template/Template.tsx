import { PuckComponent, Slot } from "@measured/puck";

import React from "react";
import { Section } from "../../components/Section";
import { getClassNameFactory } from "../../core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Template", styles);

export type TemplateProps = {
  template: string;
  children: Slot;
};

export const Template: PuckComponent<TemplateProps> = ({
  children: Children,
}) => {
  const canRenderSlot = typeof Children === "function";

  return (
    <Section>
      {canRenderSlot ? (
        <Children className={getClassName()} />
      ) : (
        <div className={getClassName("empty")}>
          Select a template to see content.
        </div>
      )}
  </Section>
  );
};

export default Template;
