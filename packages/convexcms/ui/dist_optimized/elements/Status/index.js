'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { useForm } from '../../forms/Form/context.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { requests } from '../../utilities/api.js';
import { Button } from '../Button/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import './index.scss';
const baseClass = 'status';
export const Status = () => {
  const $ = _c(37);
  const {
    id,
    collectionSlug,
    docPermissions,
    globalSlug,
    hasPublishedDoc,
    incrementVersionCount,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount
  } = useDocumentInfo();
  const {
    toggleModal
  } = useModal();
  const {
    config: t0
  } = useConfig();
  const {
    routes: t1,
    serverURL
  } = t0;
  const {
    api
  } = t1;
  const {
    reset: resetForm
  } = useForm();
  const {
    code: locale
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const unPublishModalSlug = `confirm-un-publish-${id}`;
  const revertModalSlug = `confirm-revert-${id}`;
  let statusToRender;
  if (unpublishedVersionCount > 0 && hasPublishedDoc) {
    statusToRender = "changed";
  } else {
    if (!hasPublishedDoc) {
      statusToRender = "draft";
    } else {
      if (hasPublishedDoc && unpublishedVersionCount <= 0) {
        statusToRender = "published";
      }
    }
  }
  let t2;
  if ($[0] !== api || $[1] !== collectionSlug || $[2] !== globalSlug || $[3] !== i18n.language || $[4] !== id || $[5] !== incrementVersionCount || $[6] !== locale || $[7] !== resetForm || $[8] !== serverURL || $[9] !== setHasPublishedDoc || $[10] !== setMostRecentVersionIsAutosaved || $[11] !== setUnpublishedVersionCount || $[12] !== t) {
    t2 = async action => {
      let url;
      let method;
      let body;
      if (action === "unpublish") {
        body = {
          _status: "draft"
        };
      }
      if (collectionSlug) {
        url = `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}&fallback-locale=null&depth=0`;
        method = "patch";
      }
      if (globalSlug) {
        url = `${serverURL}${api}/globals/${globalSlug}?locale=${locale}&fallback-locale=null&depth=0`;
        method = "post";
      }
      if (action === "revert") {
        const publishedDoc = await requests.get(url, {
          headers: {
            "Accept-Language": i18n.language,
            "Content-Type": "application/json"
          }
        }).then(_temp);
        body = publishedDoc;
      }
      const res_0 = await requests[method](url, {
        body: JSON.stringify(body),
        headers: {
          "Accept-Language": i18n.language,
          "Content-Type": "application/json"
        }
      });
      if (res_0.status === 200) {
        let data;
        const json = await res_0.json();
        if (globalSlug) {
          data = json.result;
        } else {
          if (collectionSlug) {
            data = json.doc;
          }
        }
        resetForm(data);
        toast.success(json.message);
        incrementVersionCount();
        setMostRecentVersionIsAutosaved(false);
        if (action === "unpublish") {
          setHasPublishedDoc(false);
        } else {
          if (action === "revert") {
            setUnpublishedVersionCount(0);
          }
        }
      } else {
        toast.error(t("error:unPublishingDocument"));
      }
    };
    $[0] = api;
    $[1] = collectionSlug;
    $[2] = globalSlug;
    $[3] = i18n.language;
    $[4] = id;
    $[5] = incrementVersionCount;
    $[6] = locale;
    $[7] = resetForm;
    $[8] = serverURL;
    $[9] = setHasPublishedDoc;
    $[10] = setMostRecentVersionIsAutosaved;
    $[11] = setUnpublishedVersionCount;
    $[12] = t;
    $[13] = t2;
  } else {
    t2 = $[13];
  }
  const performAction = t2;
  const canUpdate = docPermissions?.update;
  if (statusToRender) {
    const t3 = `${t("version:status")}: ${t(`version:${statusToRender}`)}`;
    let t4;
    if ($[14] !== canUpdate || $[15] !== performAction || $[16] !== revertModalSlug || $[17] !== statusToRender || $[18] !== t || $[19] !== t3 || $[20] !== toggleModal || $[21] !== unPublishModalSlug) {
      let t5;
      if ($[23] !== canUpdate || $[24] !== performAction || $[25] !== statusToRender || $[26] !== t || $[27] !== toggleModal || $[28] !== unPublishModalSlug) {
        t5 = canUpdate && statusToRender === "published" && _jsxs(React.Fragment, {
          children: ["\xA0\u2014\xA0", _jsx(Button, {
            buttonStyle: "none",
            className: `${baseClass}__action`,
            onClick: () => toggleModal(unPublishModalSlug),
            children: t("version:unpublish")
          }), _jsx(ConfirmationModal, {
            body: t("version:aboutToUnpublish"),
            confirmingLabel: t("version:unpublishing"),
            heading: t("version:confirmUnpublish"),
            modalSlug: unPublishModalSlug,
            onConfirm: () => performAction("unpublish")
          })]
        });
        $[23] = canUpdate;
        $[24] = performAction;
        $[25] = statusToRender;
        $[26] = t;
        $[27] = toggleModal;
        $[28] = unPublishModalSlug;
        $[29] = t5;
      } else {
        t5 = $[29];
      }
      let t6;
      if ($[30] !== canUpdate || $[31] !== performAction || $[32] !== revertModalSlug || $[33] !== statusToRender || $[34] !== t || $[35] !== toggleModal) {
        t6 = canUpdate && statusToRender === "changed" && _jsxs(React.Fragment, {
          children: ["\xA0\u2014\xA0", _jsx(Button, {
            buttonStyle: "none",
            className: `${baseClass}__action`,
            id: "action-revert-to-published",
            onClick: () => toggleModal(revertModalSlug),
            children: t("version:revertToPublished")
          }), _jsx(ConfirmationModal, {
            body: t("version:aboutToRevertToPublished"),
            confirmingLabel: t("version:reverting"),
            heading: t("version:confirmRevertToSaved"),
            modalSlug: revertModalSlug,
            onConfirm: () => performAction("revert")
          })]
        });
        $[30] = canUpdate;
        $[31] = performAction;
        $[32] = revertModalSlug;
        $[33] = statusToRender;
        $[34] = t;
        $[35] = toggleModal;
        $[36] = t6;
      } else {
        t6 = $[36];
      }
      t4 = _jsx("div", {
        className: baseClass,
        title: t3,
        children: _jsxs("div", {
          className: `${baseClass}__value-wrap`,
          children: [_jsxs("span", {
            className: `${baseClass}__label`,
            children: [t("version:status"), ":\xA0"]
          }), _jsx("span", {
            className: `${baseClass}__value`,
            children: t(`version:${statusToRender}`)
          }), t5, t6]
        })
      });
      $[14] = canUpdate;
      $[15] = performAction;
      $[16] = revertModalSlug;
      $[17] = statusToRender;
      $[18] = t;
      $[19] = t3;
      $[20] = toggleModal;
      $[21] = unPublishModalSlug;
      $[22] = t4;
    } else {
      t4 = $[22];
    }
    return t4;
  }
  return null;
};
function _temp(res) {
  return res.json();
}
//# sourceMappingURL=index.js.map