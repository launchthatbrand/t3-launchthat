import type { TFunction } from "@convexcms/translations";
import { en } from "@convexcms/translations/languages/en";
import { status as httpStatus } from "http-status";

import { APIError } from "./APIError.js";

export class MissingFile extends APIError {
  constructor(t?: TFunction) {
    super(
      t ? t("error:noFilesUploaded") : en.translations.error.noFilesUploaded,
      httpStatus.BAD_REQUEST,
    );
  }
}
