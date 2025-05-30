import type {
  PayloadRequest,
  SanitizedCollectionPermission,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from "@convexcms/core";
import {
  docAccessOperationGlobal,
  isolateObjectProperty,
} from "@convexcms/core";

import type { Context } from "../types.js";

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest;
  },
) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>;

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context: Context) {
    return docAccessOperationGlobal({
      globalConfig: global,
      req: isolateObjectProperty(context.req, "transactionID"),
    });
  }

  return resolver;
}
