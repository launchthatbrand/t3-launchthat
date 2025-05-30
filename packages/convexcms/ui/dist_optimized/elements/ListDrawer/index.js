'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
export * from './types.js';
import { useConfig } from '../../providers/Config/index.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { Drawer, DrawerToggler } from '../Drawer/index.js';
import { ListDrawerContent } from './DrawerContent.js';
export const baseClass = 'list-drawer';
export const formatListDrawerSlug = ({
  depth,
  uuid
}) => `list-drawer_${depth}_${uuid}`;
export const ListDrawerToggler = ({
  children,
  className,
  disabled,
  drawerSlug,
  onClick,
  ...rest
}) => {
  return /*#__PURE__*/_jsx(DrawerToggler, {
    className: [className, `${baseClass}__toggler`].filter(Boolean).join(' '),
    disabled: disabled,
    onClick: onClick,
    slug: drawerSlug,
    ...rest,
    children: children
  });
};
export const ListDrawer = props => {
  const {
    drawerSlug
  } = props;
  return /*#__PURE__*/_jsx(Drawer, {
    className: baseClass,
    gutter: false,
    Header: null,
    slug: drawerSlug,
    children: /*#__PURE__*/_jsx(ListDrawerContent, {
      ...props
    })
  });
};
export const useListDrawer = t0 => {
  const $ = _c(42);
  const {
    collectionSlugs: collectionSlugsFromProps,
    filterOptions,
    selectedCollection,
    uploads
  } = t0;
  const {
    config: t1
  } = useConfig();
  const {
    collections
  } = t1;
  const drawerDepth = useEditDepth();
  const uuid = useId();
  const {
    closeModal,
    modalState,
    openModal,
    toggleModal
  } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [collectionSlugs, setCollectionSlugs] = useState(collectionSlugsFromProps);
  let t2;
  if ($[0] !== drawerDepth || $[1] !== uuid) {
    t2 = formatListDrawerSlug({
      depth: drawerDepth,
      uuid
    });
    $[0] = drawerDepth;
    $[1] = uuid;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const drawerSlug = t2;
  let t3;
  let t4;
  if ($[3] !== drawerSlug || $[4] !== modalState) {
    t3 = () => {
      setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
    };
    t4 = [modalState, drawerSlug];
    $[3] = drawerSlug;
    $[4] = modalState;
    $[5] = t3;
    $[6] = t4;
  } else {
    t3 = $[5];
    t4 = $[6];
  }
  useEffect(t3, t4);
  let t5;
  let t6;
  if ($[7] !== collectionSlugs || $[8] !== collections || $[9] !== uploads) {
    t5 = () => {
      if (!collectionSlugs || collectionSlugs.length === 0) {
        const filteredCollectionSlugs = collections.filter(t7 => {
          const {
            upload
          } = t7;
          if (uploads) {
            return Boolean(upload) === true;
          }
          return true;
        });
        setCollectionSlugs(filteredCollectionSlugs.map(_temp));
      }
    };
    t6 = [collectionSlugs, uploads, collections];
    $[7] = collectionSlugs;
    $[8] = collections;
    $[9] = uploads;
    $[10] = t5;
    $[11] = t6;
  } else {
    t5 = $[10];
    t6 = $[11];
  }
  useEffect(t5, t6);
  let t7;
  if ($[12] !== drawerSlug || $[13] !== toggleModal) {
    t7 = () => {
      toggleModal(drawerSlug);
    };
    $[12] = drawerSlug;
    $[13] = toggleModal;
    $[14] = t7;
  } else {
    t7 = $[14];
  }
  const toggleDrawer = t7;
  let t8;
  if ($[15] !== closeModal || $[16] !== drawerSlug) {
    t8 = () => {
      closeModal(drawerSlug);
    };
    $[15] = closeModal;
    $[16] = drawerSlug;
    $[17] = t8;
  } else {
    t8 = $[17];
  }
  const closeDrawer = t8;
  let t9;
  if ($[18] !== drawerSlug || $[19] !== openModal) {
    t9 = () => {
      openModal(drawerSlug);
    };
    $[18] = drawerSlug;
    $[19] = openModal;
    $[20] = t9;
  } else {
    t9 = $[20];
  }
  const openDrawer = t9;
  let t10;
  let t11;
  if ($[21] !== closeDrawer || $[22] !== collectionSlugs || $[23] !== drawerSlug || $[24] !== filterOptions || $[25] !== selectedCollection || $[26] !== uploads) {
    t11 = props => _createElement(ListDrawer, {
      ...props,
      closeDrawer,
      collectionSlugs,
      drawerSlug,
      filterOptions,
      key: drawerSlug,
      selectedCollection,
      uploads
    });
    $[21] = closeDrawer;
    $[22] = collectionSlugs;
    $[23] = drawerSlug;
    $[24] = filterOptions;
    $[25] = selectedCollection;
    $[26] = uploads;
    $[27] = t11;
  } else {
    t11 = $[27];
  }
  t10 = t11;
  const MemoizedDrawer = t10;
  let t12;
  let t13;
  if ($[28] !== drawerSlug) {
    t13 = props_0 => _jsx(ListDrawerToggler, {
      ...props_0,
      drawerSlug
    });
    $[28] = drawerSlug;
    $[29] = t13;
  } else {
    t13 = $[29];
  }
  t12 = t13;
  const MemoizedDrawerToggler = t12;
  let t14;
  let t15;
  if ($[30] !== closeDrawer || $[31] !== collectionSlugs || $[32] !== drawerDepth || $[33] !== drawerSlug || $[34] !== isOpen || $[35] !== openDrawer || $[36] !== toggleDrawer) {
    t15 = {
      closeDrawer,
      collectionSlugs,
      drawerDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      setCollectionSlugs,
      toggleDrawer
    };
    $[30] = closeDrawer;
    $[31] = collectionSlugs;
    $[32] = drawerDepth;
    $[33] = drawerSlug;
    $[34] = isOpen;
    $[35] = openDrawer;
    $[36] = toggleDrawer;
    $[37] = t15;
  } else {
    t15 = $[37];
  }
  t14 = t15;
  const MemoizedDrawerState = t14;
  let t16;
  if ($[38] !== MemoizedDrawer || $[39] !== MemoizedDrawerState || $[40] !== MemoizedDrawerToggler) {
    t16 = [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState];
    $[38] = MemoizedDrawer;
    $[39] = MemoizedDrawerState;
    $[40] = MemoizedDrawerToggler;
    $[41] = t16;
  } else {
    t16 = $[41];
  }
  return t16;
};
function _temp(t0) {
  const {
    slug
  } = t0;
  return slug;
}
//# sourceMappingURL=index.js.map