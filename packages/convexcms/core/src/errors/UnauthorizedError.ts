import type { TFunction } from "@convexcms/translations";
import { en } from "@convexcms/translations/languages/en";
import { status as httpStatus } from "http-status";

import { APIError } from "./APIError.js";

export class UnauthorizedError extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t("error:unauthorized") : en.translations.error.unauthorized,
      httpStatus.UNAUTHORIZED,
    );
  }
}
