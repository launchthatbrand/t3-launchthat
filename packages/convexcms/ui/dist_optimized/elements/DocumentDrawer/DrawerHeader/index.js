'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Gutter } from '../../../elements/Gutter/index.js';
import { useModal } from '../../../elements/Modal/index.js';
import { RenderTitle } from '../../../elements/RenderTitle/index.js';
import { XIcon } from '../../../icons/X/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { IDLabel } from '../../IDLabel/index.js';
import { documentDrawerBaseClass } from '../index.js';
import './index.scss';
export const DocumentDrawerHeader = t0 => {
  const $ = _c(7);
  const {
    drawerSlug
  } = t0;
  const {
    closeModal
  } = useModal();
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== closeModal || $[1] !== drawerSlug || $[2] !== t) {
    let t2;
    if ($[4] !== closeModal || $[5] !== drawerSlug) {
      t2 = () => closeModal(drawerSlug);
      $[4] = closeModal;
      $[5] = drawerSlug;
      $[6] = t2;
    } else {
      t2 = $[6];
    }
    t1 = _jsxs(Gutter, {
      className: `${documentDrawerBaseClass}__header`,
      children: [_jsxs("div", {
        className: `${documentDrawerBaseClass}__header-content`,
        children: [_jsx("h2", {
          className: `${documentDrawerBaseClass}__header-text`,
          children: _jsx(RenderTitle, {
            element: "span"
          })
        }), _jsx("button", {
          "aria-label": t("general:close"),
          className: `${documentDrawerBaseClass}__header-close`,
          onClick: t2,
          type: "button",
          children: _jsx(XIcon, {})
        })]
      }), _jsx(DocumentTitle, {})]
    });
    $[0] = closeModal;
    $[1] = drawerSlug;
    $[2] = t;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
};
const DocumentTitle = () => {
  const $ = _c(3);
  const {
    id,
    title
  } = useDocumentInfo();
  let t0;
  if ($[0] !== id || $[1] !== title) {
    t0 = id && id !== title ? _jsx(IDLabel, {
      id: id.toString()
    }) : null;
    $[0] = id;
    $[1] = title;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
};
//# sourceMappingURL=index.js.map