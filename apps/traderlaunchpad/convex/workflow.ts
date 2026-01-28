/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument
*/

import { WorkflowManager } from "@convex-dev/workflow";

import { components } from "./_generated/api";

// Until Convex codegen runs with the workflow component enabled, `components.workflow`
// won't be present in the generated typings.
const componentsAny = components as any;
export const workflow = new WorkflowManager(componentsAny.workflow);

