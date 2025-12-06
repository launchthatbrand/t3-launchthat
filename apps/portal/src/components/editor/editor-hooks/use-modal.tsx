import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { useCallback, useMemo, useState } from "react";

import type { JSX } from "react";

type ModalOptions =
  | boolean
  | {
      closeOnClickOutside?: boolean;
      contentClassName?: string;
      showCloseButton?: boolean;
    };

interface ModalState {
  closeOnClickOutside: boolean;
  content: JSX.Element;
  contentClassName?: string;
  showCloseButton?: boolean;
  title: string;
}

export function useEditorModal(): [
  JSX.Element | null,
  (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
    options?: ModalOptions,
  ) => void,
] {
  const [modalContent, setModalContent] = useState<ModalState | null>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) {
      return null;
    }
    const { title, content, contentClassName, showCloseButton } = modalContent;
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className={contentClassName}
          showCloseButton={showCloseButton}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (
      title: string,
      getContent: (onClose: () => void) => JSX.Element,
      options?: ModalOptions,
    ) => {
      const normalizedOptions =
        typeof options === "boolean"
          ? { closeOnClickOutside: options }
          : (options ?? {});

      setModalContent({
        closeOnClickOutside: normalizedOptions.closeOnClickOutside ?? false,
        content: getContent(onClose),
        contentClassName: normalizedOptions.contentClassName,
        showCloseButton: normalizedOptions.showCloseButton ?? true,
        title,
      });
    },
    [onClose],
  );

  return [modal, showModal];
}
