import TemplateComponent, { TemplateProps } from "./Template";

import { ComponentConfig } from "@measured/puck";
import { withLayout } from "../../components/Layout";

export const TemplateInternal: ComponentConfig<TemplateProps> = {
  render: TemplateComponent,
};

export const Template = withLayout(TemplateInternal);
