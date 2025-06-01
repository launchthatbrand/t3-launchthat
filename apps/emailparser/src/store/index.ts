import { create } from "zustand";

// Commented out but kept for future implementation
// import { Id } from "../../convex/_generated/dataModel";

export interface Highlight {
  id: string;
  emailId: string;
  text: string;
  start: number;
  end: number;
  fieldId?: string;
  className?: string;
}

export interface Field {
  id: string;
  name: string;
  highlightId: string;
}

export type MobileTab = "emails" | "content" | "fields";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  type: ToastType;
  message: string;
}

export interface ConfirmDialog {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface EmailParserState {
  selectedEmailId: string | null;
  highlights: Highlight[];
  fields: Field[];
  isJsonPreviewOpen: boolean;
  templateVersion: number;
  mobileActiveTab: MobileTab;
  toast: Toast | null;
  isLoading: boolean;
  confirmDialog: ConfirmDialog | null;
  setSelectedEmailId: (id: string) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
  addField: (field: Field) => void;
  removeField: (id: string) => void;
  setJsonPreviewOpen: (open: boolean) => void;
  updateHighlight: (id: string, update: Partial<Highlight>) => void;
  generateJsonTemplate: () => Record<string, string>;
  getEmailHighlights: (emailId: string) => Highlight[];
  isOverlapping: (highlight: Omit<Highlight, "id">) => boolean;
  updateHighlightClassName: (id: string, className: string) => void;
  setMobileActiveTab: (tab: MobileTab) => void;
  showToast: (type: ToastType, message: string) => void;
  clearToast: () => void;
  setLoading: (isLoading: boolean) => void;
  showConfirmDialog: (dialog: ConfirmDialog) => void;
  clearConfirmDialog: () => void;
}

export const useEmailParserStore = create<EmailParserState>((set, get) => ({
  selectedEmailId: null,
  highlights: [],
  fields: [],
  isJsonPreviewOpen: false,
  templateVersion: 0,
  mobileActiveTab: "content",
  toast: null,
  isLoading: false,
  confirmDialog: null,
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  addHighlight: (highlight) => {
    const state = get();
    if (state.isOverlapping(highlight)) {
      get().showToast(
        "error",
        "Highlights cannot overlap with existing highlights",
      );
      return;
    }
    set((state) => ({
      highlights: [...state.highlights, highlight],
      templateVersion: state.templateVersion + 1,
    }));
    get().showToast("success", "Highlight added");
  },
  removeHighlight: (id) => {
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
      fields: state.fields.filter((f) => f.highlightId !== id),
      templateVersion: state.templateVersion + 1,
    }));
    get().showToast("info", "Highlight removed");
  },
  addField: (field) => {
    // Check if field name already exists
    const existingField = get().fields.find((f) => f.name === field.name);
    if (existingField) {
      get().showToast("error", `Field name "${field.name}" already exists`);
      return;
    }

    set((state) => {
      const updatedHighlights = state.highlights.map((h) =>
        h.id === field.highlightId
          ? { ...h, fieldId: field.id, className: "highlight-saved" }
          : h,
      );

      return {
        fields: [...state.fields, field],
        highlights: updatedHighlights,
        templateVersion: state.templateVersion + 1,
      };
    });
    get().showToast("success", `Field "${field.name}" added successfully`);
  },
  removeField: (id) => {
    const fieldToRemove = get().fields.find((f) => f.id === id);
    const fieldName = fieldToRemove?.name ?? "Field";

    set((state) => {
      if (fieldToRemove) {
        const updatedHighlights = state.highlights.map((h) =>
          h.id === fieldToRemove.highlightId
            ? { ...h, fieldId: undefined, className: "highlight-current" }
            : h,
        );

        return {
          fields: state.fields.filter((f) => f.id !== id),
          highlights: updatedHighlights,
          templateVersion: state.templateVersion + 1,
        };
      }

      return {
        fields: state.fields.filter((f) => f.id !== id),
        templateVersion: state.templateVersion + 1,
      };
    });
    get().showToast("info", `Field "${fieldName}" removed`);
  },
  updateHighlight: (id, update) =>
    set((state) => ({
      highlights: state.highlights.map((h) =>
        h.id === id ? { ...h, ...update } : h,
      ),
      templateVersion: state.templateVersion + 1,
    })),
  updateHighlightClassName: (id, className) =>
    set((state) => ({
      highlights: state.highlights.map((h) =>
        h.id === id ? { ...h, className } : h,
      ),
      templateVersion: state.templateVersion + 1,
    })),
  getEmailHighlights: (emailId) => {
    return get().highlights.filter((h) => h.emailId === emailId);
  },
  isOverlapping: (highlight) => {
    const { highlights } = get();
    return highlights.some(
      (h) =>
        h.emailId === highlight.emailId &&
        ((highlight.start < h.end && highlight.end > h.start) ||
          (highlight.start === h.start && highlight.end === h.end)),
    );
  },
  setJsonPreviewOpen: (open) => set({ isJsonPreviewOpen: open }),
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
  generateJsonTemplate: () => {
    const { fields, highlights } = get();
    if (fields.length === 0) {
      get().showToast(
        "error",
        "No fields defined. Add fields before generating template.",
      );
      return {};
    }

    const template: Record<string, string> = {};

    fields.forEach((field) => {
      const highlight = highlights.find((h) => h.id === field.highlightId);
      if (highlight) {
        template[field.name] = highlight.text;
      }
    });

    get().showToast("success", "JSON template generated successfully");
    return template;
  },
  showToast: (type, message) => set({ toast: { type, message } }),
  clearToast: () => set({ toast: null }),
  setLoading: (isLoading) => set({ isLoading }),
  showConfirmDialog: (dialog) => set({ confirmDialog: dialog }),
  clearConfirmDialog: () => set({ confirmDialog: null }),
}));
