import {
  addDataAndFileToRequest as _addDataAndFileToRequest,
  addLocalesToRequestFromData as _addLocalesToRequestFromData,
  createPayloadRequest as _createPayloadRequest,
  headersWithCors as _headersWithCors,
  mergeHeaders as _mergeHeaders,
  sanitizeLocales as _sanitizeLocales,
} from "@convexcms/core";

// NOTICE: Server-only utilities, do not import anything client-side here.

export { getNextRequestI18n } from "../utilities/getNextRequestI18n.js";
export { getPayloadHMR } from "../utilities/getPayloadHMR.js";

/**
 * Use:
 * ```ts
 * import { mergeHeaders } from '@convexcms/core'
 * ```
 * @deprecated
 */
export const mergeHeaders = _mergeHeaders;

/**
 * @deprecated
 * Use:
 * ```ts
 * import { headersWithCors } from '@convexcms/core'
 * ```
 */
export const headersWithCors = _headersWithCors;

/**
 * @deprecated
 * Use:
 * ```ts
 * import { createPayloadRequest } from '@convexcms/core'
 * ```
 */
export const createPayloadRequest = _createPayloadRequest;

/**
 * @deprecated
 * Use:
 * ```ts
 * import { addDataAndFileToRequest } from '@convexcms/core'
 * ```
 */
export const addDataAndFileToRequest = _addDataAndFileToRequest;

/**
 * @deprecated
 * Use:
 * ```ts
 * import { sanitizeLocales } from '@convexcms/core'
 * ```
 */
export const sanitizeLocales = _sanitizeLocales;

/**
 * @deprecated
 * Use:
 * ```ts
 * import { addLocalesToRequestFromData } from '@convexcms/core'
 * ```
 */
export const addLocalesToRequestFromData = _addLocalesToRequestFromData;
