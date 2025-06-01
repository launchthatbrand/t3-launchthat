import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Highlight {
  id: string;
  emailId: string;
  text: string;
  start: number;
  end: number;
  className?: string;
  fieldId?: string;
}

export interface Field {
  id: string;
  name: string;
  highlightId?: string;
}

export interface Template {
  id: string;
  name: string;
  fields: Field[];
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface EmailParserState {
  // Email selection state
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string | null) => void;

  // Highlights state
  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
  updateHighlightClassName: (id: string, className: string) => void;
  updateHighlightFieldId: (id: string, fieldId: string | undefined) => void;
  getEmailHighlights: (emailId: string) => Highlight[];

  // Fields state
  fields: Field[];
  addField: (field: Field) => void;
  removeField: (id: string) => void;
  updateFieldName: (id: string, name: string) => void;
  updateFieldHighlightId: (id: string, highlightId: string | undefined) => void;

  // Templates state
  templates: Template[];
  addTemplate: (template: Template) => void;
  removeTemplate: (id: string) => void;
  updateTemplateName: (id: string, name: string) => void;

  // Toast notifications
  toasts: Toast[];
  showToast: (type: "success" | "error" | "info", message: string) => void;
  removeToast: (id: string) => void;

  // Confirmation dialog
  confirmDialog: ConfirmDialog | null;
  showConfirmDialog: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      onCancel?: () => void;
    },
  ) => void;
  closeConfirmDialog: () => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // Gmail tokens
  gmailTokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiryDate: number | null;
  };
  setGmailTokens: (tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiryDate: number | null;
  }) => void;
  clearGmailTokens: () => void;
}

export const useEmailParserStore = create<EmailParserState>()(
  persist(
    (set, get) => ({
      // Email selection state
      selectedEmailId: null,
      setSelectedEmailId: (id) => set({ selectedEmailId: id }),

      // Highlights state
      highlights: [],
      addHighlight: (highlight) =>
        set((state) => ({ highlights: [...state.highlights, highlight] })),
      removeHighlight: (id) =>
        set((state) => ({
          highlights: state.highlights.filter((h) => h.id !== id),
        })),
      updateHighlightClassName: (id, className) =>
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, className } : h,
          ),
        })),
      updateHighlightFieldId: (id, fieldId) =>
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, fieldId } : h,
          ),
        })),
      getEmailHighlights: (emailId) => {
        return get().highlights.filter((h) => h.emailId === emailId);
      },

      // Fields state
      fields: [],
      addField: (field) =>
        set((state) => ({ fields: [...state.fields, field] })),
      removeField: (id) =>
        set((state) => ({
          fields: state.fields.filter((f) => f.id !== id),
          highlights: state.highlights.map((h) =>
            h.fieldId === id ? { ...h, fieldId: undefined } : h,
          ),
        })),
      updateFieldName: (id, name) =>
        set((state) => ({
          fields: state.fields.map((f) => (f.id === id ? { ...f, name } : f)),
        })),
      updateFieldHighlightId: (id, highlightId) =>
        set((state) => {
          // First, detach the field from any existing highlight
          const highlights = state.highlights.map((h) =>
            h.fieldId === id ? { ...h, fieldId: undefined } : h,
          );

          // Then, attach the field to the new highlight if one is provided
          if (highlightId) {
            return {
              fields: state.fields.map((f) =>
                f.id === id ? { ...f, highlightId } : f,
              ),
              highlights: highlights.map((h) =>
                h.id === highlightId ? { ...h, fieldId: id } : h,
              ),
            };
          }

          return {
            fields: state.fields.map((f) =>
              f.id === id ? { ...f, highlightId } : f,
            ),
            highlights,
          };
        }),

      // Templates state
      templates: [],
      addTemplate: (template) =>
        set((state) => ({ templates: [...state.templates, template] })),
      removeTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
      updateTemplateName: (id, name) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, name } : t,
          ),
        })),

      // Toast notifications
      toasts: [],
      showToast: (type, message) => {
        const id = Date.now().toString();
        set((state) => ({
          toasts: [...state.toasts, { id, type, message }],
        }));
        // Auto-remove toast after 3 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 3000);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Confirmation dialog
      confirmDialog: null,
      showConfirmDialog: (title, message, onConfirm, options = {}) =>
        set({
          confirmDialog: {
            isOpen: true,
            title,
            message,
            confirmText: options.confirmText || "Confirm",
            cancelText: options.cancelText || "Cancel",
            onConfirm,
            onCancel: options.onCancel || (() => get().closeConfirmDialog()),
          },
        }),
      closeConfirmDialog: () => set({ confirmDialog: null }),

      // Loading state
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // Gmail tokens
      gmailTokens: {
        accessToken: null,
        refreshToken: null,
        expiryDate: null,
      },
      setGmailTokens: (tokens) => set({ gmailTokens: tokens }),
      clearGmailTokens: () =>
        set({
          gmailTokens: {
            accessToken: null,
            refreshToken: null,
            expiryDate: null,
          },
        }),
    }),
    {
      name: "email-parser-storage",
      partialize: (state) => ({
        highlights: state.highlights,
        fields: state.fields,
        templates: state.templates,
        gmailTokens: state.gmailTokens,
      }),
    },
  ),
);
