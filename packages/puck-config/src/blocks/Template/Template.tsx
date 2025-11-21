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
  return (
    <Section>
      <Children className={getClassName()} />
    </Section>
  );
};

export default Template;
