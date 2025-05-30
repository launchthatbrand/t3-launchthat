'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal, useModal } from '@faceless-ui/modal';
import React, { createContext, use, useCallback, useEffect, useState } from 'react';
import { XIcon } from '../../icons/X/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Gutter } from '../Gutter/index.js';
import './index.scss';
const baseClass = 'drawer';
export const drawerZBase = 100;
export const formatDrawerSlug = ({
  slug,
  depth
}) => `drawer_${depth}_${slug}`;
export { useDrawerSlug } from './useDrawerSlug.js';
export const DrawerToggler = t0 => {
  const $ = _c(17);
  let children;
  let className;
  let disabled;
  let onClick;
  let rest;
  let slug;
  if ($[0] !== t0) {
    ({
      slug,
      children,
      className,
      disabled,
      onClick,
      ...rest
    } = t0);
    $[0] = t0;
    $[1] = children;
    $[2] = className;
    $[3] = disabled;
    $[4] = onClick;
    $[5] = rest;
    $[6] = slug;
  } else {
    children = $[1];
    className = $[2];
    disabled = $[3];
    onClick = $[4];
    rest = $[5];
    slug = $[6];
  }
  const {
    openModal
  } = useModal();
  let t1;
  if ($[7] !== onClick || $[8] !== openModal || $[9] !== slug) {
    t1 = e => {
      openModal(slug);
      if (typeof onClick === "function") {
        onClick(e);
      }
    };
    $[7] = onClick;
    $[8] = openModal;
    $[9] = slug;
    $[10] = t1;
  } else {
    t1 = $[10];
  }
  const handleClick = t1;
  let t2;
  if ($[11] !== children || $[12] !== className || $[13] !== disabled || $[14] !== handleClick || $[15] !== rest) {
    t2 = _jsx("button", {
      className,
      disabled,
      onClick: handleClick,
      type: "button",
      ...rest,
      children
    });
    $[11] = children;
    $[12] = className;
    $[13] = disabled;
    $[14] = handleClick;
    $[15] = rest;
    $[16] = t2;
  } else {
    t2 = $[16];
  }
  return t2;
};
export const Drawer = t0 => {
  const $ = _c(26);
  const {
    slug,
    children,
    className,
    gutter: t1,
    Header,
    hoverTitle,
    title
  } = t0;
  const gutter = t1 === undefined ? true : t1;
  const {
    t
  } = useTranslation();
  const {
    closeModal,
    modalState
  } = useModal();
  const drawerDepth = useDrawerDepth();
  const [isOpen, setIsOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  let t2;
  let t3;
  if ($[0] !== modalState || $[1] !== slug) {
    t2 = () => {
      setIsOpen(modalState[slug]?.isOpen);
    };
    t3 = [slug, modalState];
    $[0] = modalState;
    $[1] = slug;
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  useEffect(t2, t3);
  let t4;
  let t5;
  if ($[4] !== isOpen) {
    t4 = () => {
      setAnimateIn(isOpen);
    };
    t5 = [isOpen];
    $[4] = isOpen;
    $[5] = t4;
    $[6] = t5;
  } else {
    t4 = $[5];
    t5 = $[6];
  }
  useEffect(t4, t5);
  if (isOpen) {
    const t6 = animateIn && `${baseClass}--is-open`;
    const t7 = drawerDepth > 1 && `${baseClass}--nested`;
    let t8;
    if ($[7] !== className || $[8] !== t6 || $[9] !== t7) {
      t8 = [className, baseClass, t6, t7].filter(Boolean);
      $[7] = className;
      $[8] = t6;
      $[9] = t7;
      $[10] = t8;
    } else {
      t8 = $[10];
    }
    const t9 = t8.join(" ");
    const t10 = drawerZBase + drawerDepth;
    let t11;
    if ($[11] !== Header || $[12] !== children || $[13] !== closeModal || $[14] !== drawerDepth || $[15] !== gutter || $[16] !== hoverTitle || $[17] !== slug || $[18] !== t || $[19] !== t10 || $[20] !== t9 || $[21] !== title) {
      let t12;
      if ($[23] !== closeModal || $[24] !== slug) {
        t12 = () => closeModal(slug);
        $[23] = closeModal;
        $[24] = slug;
        $[25] = t12;
      } else {
        t12 = $[25];
      }
      t11 = _jsx(DrawerDepthProvider, {
        children: _jsxs(Modal, {
          className: t9,
          slug,
          style: {
            zIndex: t10
          },
          children: [(!drawerDepth || drawerDepth === 1) && _jsx("div", {
            className: `${baseClass}__blur-bg`
          }), _jsx("button", {
            "aria-label": t("general:close"),
            className: `${baseClass}__close`,
            id: `close-drawer__${slug}`,
            onClick: t12,
            type: "button"
          }), _jsxs("div", {
            className: `${baseClass}__content`,
            style: {
              width: `calc(100% - (${drawerDepth} * var(--gutter-h)))`
            },
            children: [_jsx("div", {
              className: `${baseClass}__blur-bg-content`
            }), _jsxs(Gutter, {
              className: `${baseClass}__content-children`,
              left: gutter,
              right: gutter,
              children: [Header, Header === undefined && _jsxs("div", {
                className: `${baseClass}__header`,
                children: [_jsx("h2", {
                  className: `${baseClass}__header__title`,
                  title: hoverTitle ? title : null,
                  children: title
                }), _jsx("button", {
                  "aria-label": t("general:close"),
                  className: `${baseClass}__header__close`,
                  id: `close-drawer__${slug}`,
                  onClick: () => closeModal(slug),
                  type: "button",
                  children: _jsx(XIcon, {})
                })]
              }), children]
            })]
          })]
        })
      });
      $[11] = Header;
      $[12] = children;
      $[13] = closeModal;
      $[14] = drawerDepth;
      $[15] = gutter;
      $[16] = hoverTitle;
      $[17] = slug;
      $[18] = t;
      $[19] = t10;
      $[20] = t9;
      $[21] = title;
      $[22] = t11;
    } else {
      t11 = $[22];
    }
    return t11;
  }
  return null;
};
export const DrawerDepthContext = /*#__PURE__*/createContext(1);
export const DrawerDepthProvider = t0 => {
  const $ = _c(3);
  const {
    children
  } = t0;
  const parentDepth = useDrawerDepth();
  const depth = parentDepth + 1;
  let t1;
  if ($[0] !== children || $[1] !== depth) {
    t1 = _jsx(DrawerDepthContext, {
      value: depth,
      children
    });
    $[0] = children;
    $[1] = depth;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
export const useDrawerDepth = () => use(DrawerDepthContext);
//# sourceMappingURL=index.js.map