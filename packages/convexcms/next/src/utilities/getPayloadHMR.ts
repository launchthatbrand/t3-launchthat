import type { InitOptions, Payload } from "@convexcms/core";
import { getPayload } from "@convexcms/core";

/**
 *  getPayloadHMR is no longer preferred.
 *  You can now use in all contexts:
 *  ```ts
 *   import { getPayload } from '@convexcms/core'
 *  ```
 * @deprecated
 */
export const getPayloadHMR = async (
  options: Pick<InitOptions, "config" | "importMap">,
): Promise<Payload> => {
  const result = await getPayload(options);

  result.logger.warn(
    "Deprecation warning: getPayloadHMR is no longer preferred. You can now use `import { getPayload } from '@convexcms/core' in all contexts.",
  );

  return result;
};
