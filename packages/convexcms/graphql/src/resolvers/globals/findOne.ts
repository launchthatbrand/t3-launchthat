import type { Document, SanitizedGlobalConfig } from "@convexcms/core";
import { findOneOperation, isolateObjectProperty } from "@convexcms/core";

import type { Context } from "../types.js";

export function findOne(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale;
    }
    if (args.fallbackLocale) {
      context.req.fallbackLocale = args.fallbackLocale;
    }

    const { slug } = globalConfig;

    const options = {
      slug,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty(context.req, "transactionID"),
    };

    const result = await findOneOperation(options);
    return result;
  };
}
