"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useCallback } from "react";
import { useRouter } from "next/navigation.js";
import { getTranslation } from "@convexcms/translations";
import { useModal } from "@faceless-ui/modal";
import { toast } from "sonner";
import { CheckboxField } from "../../fields/Checkbox/index.js";
import { SelectInput } from "../../fields/Select/index.js";
import { useFormModified } from "../../forms/Form/context.js";
import { useConfig } from "../../providers/Config/index.js";
import { useDocumentInfo } from "../../providers/DocumentInfo/index.js";
import { useLocale } from "../../providers/Locale/index.js";
import { useRouteTransition } from "../../providers/RouteTransition/index.js";
import { useServerFunctions } from "../../providers/ServerFunctions/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { DrawerHeader } from "../BulkUpload/Header/index.js";
import { Button } from "../Button/index.js";
import { Drawer } from "../Drawer/index.js";
import { PopupList } from "../Popup/index.js";
const baseClass = "copy-locale-data";
const drawerSlug = "copy-locale";
export const CopyLocaleData = () => {
  const {
    config: {
      localization,
      routes: {
        admin
      },
      serverURL
    }
  } = useConfig();
  const {
    code
  } = useLocale();
  const {
    id,
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const {
    i18n,
    t
  } = useTranslation();
  const modified = useFormModified();
  const {
    toggleModal
  } = useModal();
  const {
    copyDataFromLocale
  } = useServerFunctions();
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const localeOptions = localization && localization.locales.map(locale => ({
    label: locale.label,
    value: locale.code
  })) || [];
  const localeOptionsWithoutCurrent = localeOptions.filter(locale => locale.value !== code);
  const getLocaleLabel = code => {
    const locale = localization && localization.locales.find(l => l.code === code);
    return locale && locale.label ? getTranslation(locale.label, i18n) : code;
  };
  const [copying, setCopying] = React.useState(false);
  const [toLocale, setToLocale] = React.useState(null);
  const [fromLocale, setFromLocale] = React.useState(code);
  const [overwriteExisting, setOverwriteExisting] = React.useState(false);
  React.useEffect(() => {
    if (fromLocale !== code) {
      setFromLocale(code);
    }
  }, [code, fromLocale]);
  const copyLocaleData = useCallback(async ({
    from,
    to
  }) => {
    setCopying(true);
    try {
      await copyDataFromLocale({
        collectionSlug,
        docID: id,
        fromLocale: from,
        globalSlug,
        overrideData: overwriteExisting,
        toLocale: to
      });
      setCopying(false);
      startRouteTransition(() => router.push(`${serverURL}${admin}/${collectionSlug ? `collections/${collectionSlug}/${id}` : `globals/${globalSlug}`}?locale=${to}`));
      toggleModal(drawerSlug);
    } catch (error) {
      toast.error(error.message);
    }
  }, [copyDataFromLocale, collectionSlug, id, globalSlug, overwriteExisting, toggleModal, router, serverURL, admin, startRouteTransition]);
  if (!id && !globalSlug) {
    return null;
  }
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx(PopupList.Button, {
      id: `${baseClass}__button`,
      onClick: () => {
        if (modified) {
          toast.info(t("general:unsavedChanges"));
        } else {
          toggleModal(drawerSlug);
        }
      },
      children: t("localization:copyToLocale")
    }), /*#__PURE__*/_jsxs(Drawer, {
      className: baseClass,
      gutter: false,
      Header: /*#__PURE__*/_jsx(DrawerHeader, {
        onClose: () => {
          toggleModal(drawerSlug);
        },
        title: t("localization:copyToLocale")
      }),
      slug: drawerSlug,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__sub-header`,
        children: [/*#__PURE__*/_jsx("span", {
          children: fromLocale && toLocale ? /*#__PURE__*/_jsx("div", {
            children: t("localization:copyFromTo", {
              from: getLocaleLabel(fromLocale),
              to: getLocaleLabel(toLocale)
            })
          }) : t("localization:selectLocaleToCopy")
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "primary",
          disabled: !fromLocale || !toLocale,
          iconPosition: "left",
          onClick: async () => {
            if (fromLocale === toLocale) {
              toast.error(t("localization:cannotCopySameLocale"));
              return;
            }
            if (!copying) {
              await copyLocaleData({
                from: fromLocale,
                to: toLocale
              });
            }
          },
          size: "medium",
          children: copying ? t("general:copying") + "..." : t("general:copy")
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__content`,
        children: [/*#__PURE__*/_jsx(SelectInput, {
          label: t("localization:copyFrom"),
          name: "fromLocale",
          onChange: selectedOption => {
            if (selectedOption?.value) {
              setFromLocale(selectedOption.value);
            }
          },
          options: localeOptions,
          path: "fromLocale",
          readOnly: true,
          value: fromLocale
        }), /*#__PURE__*/_jsx(SelectInput, {
          label: t("localization:copyTo"),
          name: "toLocale",
          onChange: selectedOption => {
            if (selectedOption?.value) {
              setToLocale(selectedOption.value);
            }
          },
          options: localeOptionsWithoutCurrent,
          path: "toLocale",
          value: toLocale
        }), /*#__PURE__*/_jsx(CheckboxField, {
          checked: overwriteExisting,
          field: {
            name: "overwriteExisting",
            label: t("general:overwriteExistingData")
          },
          onChange: () => setOverwriteExisting(!overwriteExisting),
          path: "overwriteExisting"
        })]
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map