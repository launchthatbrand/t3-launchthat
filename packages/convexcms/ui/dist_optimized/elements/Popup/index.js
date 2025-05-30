'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export * as PopupList from './PopupButtonList/index.js';
import { useWindowInfo } from '@faceless-ui/window-info';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntersect } from '../../hooks/useIntersect.js';
import { PopupTrigger } from './PopupTrigger/index.js';
import './index.scss';
const baseClass = 'popup';
export const Popup = props => {
  const {
    id,
    boundingRef,
    button,
    buttonClassName,
    buttonSize,
    buttonType = 'default',
    caret = true,
    children,
    className,
    disabled,
    forceOpen,
    horizontalAlign: horizontalAlignFromProps = 'left',
    initActive = false,
    noBackground,
    onToggleOpen,
    render,
    showOnHover = false,
    showScrollbar = false,
    size = 'medium',
    verticalAlign: verticalAlignFromProps = 'top'
  } = props;
  const {
    height: windowHeight,
    width: windowWidth
  } = useWindowInfo();
  const [intersectionRef, intersectionEntry] = useIntersect({
    root: boundingRef?.current || null,
    rootMargin: '-100px 0px 0px 0px',
    threshold: 1
  });
  const contentRef = useRef(null);
  const [active, setActive] = useState(initActive);
  const [verticalAlign, setVerticalAlign] = useState(verticalAlignFromProps);
  const [horizontalAlign, setHorizontalAlign] = useState(horizontalAlignFromProps);
  const setPosition = useCallback(({
    horizontal = false,
    vertical = false
  }) => {
    if (contentRef.current) {
      const bounds = contentRef.current.getBoundingClientRect();
      const {
        bottom: contentBottomPos,
        left: contentLeftPos,
        right: contentRightPos,
        top: contentTopPos
      } = bounds;
      let boundingTopPos = 100;
      let boundingRightPos = document.documentElement.clientWidth;
      let boundingBottomPos = document.documentElement.clientHeight;
      let boundingLeftPos = 0;
      if (boundingRef?.current) {
        ;
        ({
          bottom: boundingBottomPos,
          left: boundingLeftPos,
          right: boundingRightPos,
          top: boundingTopPos
        } = boundingRef.current.getBoundingClientRect());
      }
      if (horizontal) {
        if (contentRightPos > boundingRightPos && contentLeftPos > boundingLeftPos) {
          setHorizontalAlign('right');
        } else if (contentLeftPos < boundingLeftPos && contentRightPos < boundingRightPos) {
          setHorizontalAlign('left');
        }
      }
      if (vertical) {
        if (contentTopPos < boundingTopPos && contentBottomPos < boundingBottomPos) {
          setVerticalAlign('bottom');
        } else if (contentBottomPos > boundingBottomPos && contentTopPos > boundingTopPos) {
          setVerticalAlign('top');
        }
      }
    }
  }, [boundingRef]);
  const handleClickOutside = useCallback(e => {
    if (contentRef.current.contains(e.target)) {
      return;
    }
    setActive(false);
  }, [contentRef]);
  useEffect(() => {
    setPosition({
      horizontal: true
    });
  }, [intersectionEntry, setPosition, windowWidth]);
  useEffect(() => {
    setPosition({
      vertical: true
    });
  }, [intersectionEntry, setPosition, windowHeight]);
  useEffect(() => {
    if (typeof onToggleOpen === 'function') {
      onToggleOpen(active);
    }
    if (active) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [active, handleClickOutside, onToggleOpen]);
  useEffect(() => {
    setActive(forceOpen);
  }, [forceOpen]);
  const classes = [baseClass, className, `${baseClass}--size-${size}`, buttonSize && `${baseClass}--button-size-${buttonSize}`, `${baseClass}--v-align-${verticalAlign}`, `${baseClass}--h-align-${horizontalAlign}`, active && `${baseClass}--active`, showScrollbar && `${baseClass}--show-scrollbar`].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsxs("div", {
    className: classes,
    id: id,
    children: [/*#__PURE__*/_jsx("div", {
      className: `${baseClass}__trigger-wrap`,
      children: showOnHover ? /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__on-hover-watch`,
        onMouseEnter: () => setActive(true),
        onMouseLeave: () => setActive(false),
        children: /*#__PURE__*/_jsx(PopupTrigger, {
          active,
          button,
          buttonType,
          className: buttonClassName,
          disabled,
          noBackground,
          setActive,
          size: buttonSize
        })
      }) : /*#__PURE__*/_jsx(PopupTrigger, {
        active,
        button,
        buttonType,
        className: buttonClassName,
        disabled,
        noBackground,
        setActive,
        size: buttonSize
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__content`,
      ref: contentRef,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__hide-scrollbar`,
        ref: intersectionRef,
        children: /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__scroll-container`,
          children: /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__scroll-content`,
            children: [render && render({
              close: () => setActive(false)
            }), children]
          })
        })
      }), caret && /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__caret`
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map