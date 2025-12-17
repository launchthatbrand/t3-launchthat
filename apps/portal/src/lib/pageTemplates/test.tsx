import type { PageTemplateContext } from "./registry";
import { registerPageTemplate } from "~/lib/pageTemplates/registry";
import { TestHeroTemplate } from "./test.client";

registerPageTemplate({
  slug: "test-hero",
  label: "Test Hero",
  description: "Simple hero layout for testing",
  render: (ctx: PageTemplateContext) => <TestHeroTemplate {...ctx} />,
});
