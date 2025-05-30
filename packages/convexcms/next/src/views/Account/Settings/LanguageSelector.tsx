"use client";

import type { LanguageOptions } from "@convexcms/core";
import type { AcceptedLanguages } from "@convexcms/translations";
import type { ReactSelectOption } from "@convexcms/ui";
import React from "react";
import { ReactSelect, useTranslation } from "@convexcms/ui";

export const LanguageSelector: React.FC<{
  languageOptions: LanguageOptions;
}> = (props) => {
  const { languageOptions } = props;

  const { i18n, switchLanguage } = useTranslation();

  return (
    <ReactSelect
      inputId="language-select"
      isClearable={false}
      onChange={async (option: ReactSelectOption<AcceptedLanguages>) => {
        await switchLanguage(option.value);
      }}
      options={languageOptions}
      value={languageOptions.find(
        (language) => language.value === i18n.language,
      )}
    />
  );
};
