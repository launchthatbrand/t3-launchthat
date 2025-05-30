'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { useRelatedCollections } from '../AddNewRelation/useRelatedCollections.js';
import { Drawer, DrawerToggler } from '../Drawer/index.js';
import { DocumentDrawerContent } from './DrawerContent.js';
import './index.scss';
export const documentDrawerBaseClass = 'doc-drawer';
const formatDocumentDrawerSlug = ({
  id,
  collectionSlug,
  depth,
  uuid
}) => `doc-drawer_${collectionSlug}_${depth}${id ? `_${id}` : ''}_${uuid}`;
export const DocumentDrawerToggler = t0 => {
  const $ = _c(21);
  let children;
  let className;
  let collectionSlug;
  let disabled;
  let drawerSlug;
  let id;
  let onClick;
  let rest;
  if ($[0] !== t0) {
    ({
      id,
      children,
      className,
      collectionSlug,
      disabled,
      drawerSlug,
      onClick,
      ...rest
    } = t0);
    $[0] = t0;
    $[1] = children;
    $[2] = className;
    $[3] = collectionSlug;
    $[4] = disabled;
    $[5] = drawerSlug;
    $[6] = id;
    $[7] = onClick;
    $[8] = rest;
  } else {
    children = $[1];
    className = $[2];
    collectionSlug = $[3];
    disabled = $[4];
    drawerSlug = $[5];
    id = $[6];
    onClick = $[7];
    rest = $[8];
  }
  const {
    t
  } = useTranslation();
  const [collectionConfig] = useRelatedCollections(collectionSlug);
  const t1 = !id ? "fields:addNewLabel" : "general:editLabel";
  const t2 = collectionConfig?.labels.singular;
  let t3;
  if ($[9] !== children || $[10] !== className || $[11] !== disabled || $[12] !== drawerSlug || $[13] !== onClick || $[14] !== rest || $[15] !== t || $[16] !== t1 || $[17] !== t2) {
    const t4 = t(t1, {
      label: t2
    });
    let t5;
    if ($[19] !== className) {
      t5 = [className, `${documentDrawerBaseClass}__toggler`].filter(Boolean);
      $[19] = className;
      $[20] = t5;
    } else {
      t5 = $[20];
    }
    t3 = _jsx(DrawerToggler, {
      "aria-label": t4,
      className: t5.join(" "),
      disabled,
      onClick,
      slug: drawerSlug,
      ...rest,
      children
    });
    $[9] = children;
    $[10] = className;
    $[11] = disabled;
    $[12] = drawerSlug;
    $[13] = onClick;
    $[14] = rest;
    $[15] = t;
    $[16] = t1;
    $[17] = t2;
    $[18] = t3;
  } else {
    t3 = $[18];
  }
  return t3;
};
export const DocumentDrawer = props => {
  const {
    drawerSlug
  } = props;
  return /*#__PURE__*/_jsx(Drawer, {
    className: documentDrawerBaseClass,
    gutter: false,
    Header: null,
    slug: drawerSlug,
    children: /*#__PURE__*/_jsx(DocumentDrawerContent, {
      ...props
    })
  });
};
export const useDocumentDrawer = t0 => {
  const $ = _c(38);
  const {
    id,
    collectionSlug,
    overrideEntityVisibility
  } = t0;
  const editDepth = useEditDepth();
  const uuid = useId();
  const {
    closeModal,
    modalState,
    openModal,
    toggleModal
  } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  let t1;
  if ($[0] !== collectionSlug || $[1] !== editDepth || $[2] !== id || $[3] !== uuid) {
    t1 = formatDocumentDrawerSlug({
      id,
      collectionSlug,
      depth: editDepth,
      uuid
    });
    $[0] = collectionSlug;
    $[1] = editDepth;
    $[2] = id;
    $[3] = uuid;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const drawerSlug = t1;
  let t2;
  let t3;
  if ($[5] !== drawerSlug || $[6] !== modalState) {
    t2 = () => {
      setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
    };
    t3 = [modalState, drawerSlug];
    $[5] = drawerSlug;
    $[6] = modalState;
    $[7] = t2;
    $[8] = t3;
  } else {
    t2 = $[7];
    t3 = $[8];
  }
  useEffect(t2, t3);
  let t4;
  if ($[9] !== drawerSlug || $[10] !== toggleModal) {
    t4 = () => {
      toggleModal(drawerSlug);
    };
    $[9] = drawerSlug;
    $[10] = toggleModal;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  const toggleDrawer = t4;
  let t5;
  if ($[12] !== closeModal || $[13] !== drawerSlug) {
    t5 = () => {
      closeModal(drawerSlug);
    };
    $[12] = closeModal;
    $[13] = drawerSlug;
    $[14] = t5;
  } else {
    t5 = $[14];
  }
  const closeDrawer = t5;
  let t6;
  if ($[15] !== drawerSlug || $[16] !== openModal) {
    t6 = () => {
      openModal(drawerSlug);
    };
    $[15] = drawerSlug;
    $[16] = openModal;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  const openDrawer = t6;
  let t7;
  let t8;
  if ($[18] !== collectionSlug || $[19] !== drawerSlug || $[20] !== id || $[21] !== overrideEntityVisibility) {
    t8 = props => _createElement(DocumentDrawer, {
      ...props,
      collectionSlug,
      drawerSlug,
      id,
      key: drawerSlug,
      overrideEntityVisibility
    });
    $[18] = collectionSlug;
    $[19] = drawerSlug;
    $[20] = id;
    $[21] = overrideEntityVisibility;
    $[22] = t8;
  } else {
    t8 = $[22];
  }
  t7 = t8;
  const MemoizedDrawer = t7;
  let t9;
  let t10;
  if ($[23] !== collectionSlug || $[24] !== drawerSlug || $[25] !== id) {
    t10 = props_0 => _jsx(DocumentDrawerToggler, {
      ...props_0,
      collectionSlug,
      drawerSlug,
      id
    });
    $[23] = collectionSlug;
    $[24] = drawerSlug;
    $[25] = id;
    $[26] = t10;
  } else {
    t10 = $[26];
  }
  t9 = t10;
  const MemoizedDrawerToggler = t9;
  let t11;
  let t12;
  if ($[27] !== closeDrawer || $[28] !== drawerSlug || $[29] !== editDepth || $[30] !== isOpen || $[31] !== openDrawer || $[32] !== toggleDrawer) {
    t12 = {
      closeDrawer,
      drawerDepth: editDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer
    };
    $[27] = closeDrawer;
    $[28] = drawerSlug;
    $[29] = editDepth;
    $[30] = isOpen;
    $[31] = openDrawer;
    $[32] = toggleDrawer;
    $[33] = t12;
  } else {
    t12 = $[33];
  }
  t11 = t12;
  const MemoizedDrawerState = t11;
  let t13;
  if ($[34] !== MemoizedDrawer || $[35] !== MemoizedDrawerState || $[36] !== MemoizedDrawerToggler) {
    t13 = [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState];
    $[34] = MemoizedDrawer;
    $[35] = MemoizedDrawerState;
    $[36] = MemoizedDrawerToggler;
    $[37] = t13;
  } else {
    t13 = $[37];
  }
  return t13;
};
//# sourceMappingURL=index.js.map