import { create } from "zustand";

export type Highlight = {
  id: string;
  emailId: string;
  text: string;
  start: number;
  end: number;
  fieldId?: string;
};

export type Field = {
  id: string;
  name: string;
  highlightId: string;
};

interface EmailParserState {
  selectedEmailId: string | null;
  highlights: Highlight[];
  fields: Field[];
  isJsonPreviewOpen: boolean;
  setSelectedEmailId: (id: string) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;
  addField: (field: Field) => void;
  removeField: (id: string) => void;
  setJsonPreviewOpen: (open: boolean) => void;
}

export const useEmailParserStore = create<EmailParserState>((set) => ({
  selectedEmailId: null,
  highlights: [],
  fields: [],
  isJsonPreviewOpen: false,
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  addHighlight: (highlight) =>
    set((state) => ({ highlights: [...state.highlights, highlight] })),
  removeHighlight: (id) =>
    set((state) => ({
      highlights: state.highlights.filter((h) => h.id !== id),
    })),
  addField: (field) => set((state) => ({ fields: [...state.fields, field] })),
  removeField: (id) =>
    set((state) => ({ fields: state.fields.filter((f) => f.id !== id) })),
  setJsonPreviewOpen: (open) => set({ isJsonPreviewOpen: open }),
}));
