import { create } from "zustand";
import { shallow } from "zustand/shallow";

export type EditorMode = "edit" | "view" | "preview";

export interface TextFormatting {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isCode: boolean;
  isLink: boolean;
}

export interface ColorSettings {
  fontColor: string;
  backgroundColor: string;
}

export interface FontSettings {
  fontFamily: string;
  fontSize: string;
}

// This is a placeholder type for the editor instance
// Should be replaced with the actual editor type when available
export interface EditorInstance {
  isEditable: () => boolean;
  // Add more editor methods as needed
}

interface EditorState {
  // General editor state
  mode: EditorMode;
  isEditable: boolean;
  activeEditor: EditorInstance | null; // The currently active editor instance

  // Text formatting
  textFormatting: TextFormatting;
  colorSettings: ColorSettings;
  fontSettings: FontSettings;

  // Modals and UI state
  isImageModalOpen: boolean;
  isLinkModalOpen: boolean;
  isTableModalOpen: boolean;
  isEmojiPickerOpen: boolean;
  isEquationModalOpen: boolean;
  isExcalidrawModalOpen: boolean;

  // Image/media related state
  currentImageSrc: string;
  currentImageAlt: string;
  showImageCaption: boolean;

  // Link related state
  currentLinkUrl: string;
  editedLinkUrl: string;

  // Table related state
  tableRows: string;
  tableColumns: string;

  // Actions - General
  setMode: (mode: EditorMode) => void;
  setIsEditable: (isEditable: boolean) => void;
  setActiveEditor: (editor: EditorInstance) => void;

  // Actions - Text formatting
  setTextFormatting: (formatting: Partial<TextFormatting>) => void;
  toggleFormat: (format: keyof TextFormatting) => void;

  // Actions - Colors and fonts
  setFontColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: string) => void;

  // Actions - Modals
  openModal: (
    modal: "image" | "link" | "table" | "emoji" | "equation" | "excalidraw",
  ) => void;
  closeModal: (
    modal: "image" | "link" | "table" | "emoji" | "equation" | "excalidraw",
  ) => void;
  closeAllModals: () => void;

  // Actions - Image
  setImageData: (src: string, alt: string, showCaption?: boolean) => void;

  // Actions - Link
  setLinkData: (url: string, editedUrl?: string) => void;

  // Actions - Table
  setTableDimensions: (rows: string, columns: string) => void;

  // Reset states
  resetFormatting: () => void;
  resetStore: () => void;

  isEditorMode: boolean;
  setEditorMode: (isEditor: boolean) => void;
}

const DEFAULT_TEXT_FORMATTING: TextFormatting = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isCode: false,
  isLink: false,
};

const DEFAULT_COLOR_SETTINGS: ColorSettings = {
  fontColor: "#000000",
  backgroundColor: "transparent",
};

const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontFamily: "Arial",
  fontSize: "16px",
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state - General
  mode: "edit",
  isEditable: true,
  activeEditor: null,

  // Initial state - Text formatting
  textFormatting: { ...DEFAULT_TEXT_FORMATTING },
  colorSettings: { ...DEFAULT_COLOR_SETTINGS },
  fontSettings: { ...DEFAULT_FONT_SETTINGS },

  // Initial state - Modals
  isImageModalOpen: false,
  isLinkModalOpen: false,
  isTableModalOpen: false,
  isEmojiPickerOpen: false,
  isEquationModalOpen: false,
  isExcalidrawModalOpen: false,

  // Initial state - Image
  currentImageSrc: "",
  currentImageAlt: "",
  showImageCaption: false,

  // Initial state - Link
  currentLinkUrl: "",
  editedLinkUrl: "https://",

  // Initial state - Table
  tableRows: "3",
  tableColumns: "3",

  // Actions - General
  setMode: (mode) => {
    const currentMode = get().mode;
    if (mode === currentMode) return;
    set({ mode });
  },

  setIsEditable: (isEditable) => {
    const currentIsEditable = get().isEditable;
    if (isEditable === currentIsEditable) return;
    set({ isEditable });
  },

  setActiveEditor: (editor) => {
    const currentEditor = get().activeEditor;
    if (editor === currentEditor) return;
    set({ activeEditor: editor });
  },

  // Actions - Text formatting
  setTextFormatting: (formatting) => {
    const currentFormatting = get().textFormatting;
    const newFormatting = { ...currentFormatting, ...formatting };

    if (shallow(newFormatting, currentFormatting)) return;

    set({ textFormatting: newFormatting });
  },

  toggleFormat: (format) => {
    const currentFormatting = get().textFormatting;
    set({
      textFormatting: {
        ...currentFormatting,
        [format]: !currentFormatting[format],
      },
    });
  },

  // Actions - Colors and fonts
  setFontColor: (fontColor) => {
    const currentSettings = get().colorSettings;
    if (fontColor === currentSettings.fontColor) return;

    set({
      colorSettings: {
        ...currentSettings,
        fontColor,
      },
    });
  },

  setBackgroundColor: (backgroundColor) => {
    const currentSettings = get().colorSettings;
    if (backgroundColor === currentSettings.backgroundColor) return;

    set({
      colorSettings: {
        ...currentSettings,
        backgroundColor,
      },
    });
  },

  setFontFamily: (fontFamily) => {
    const currentSettings = get().fontSettings;
    if (fontFamily === currentSettings.fontFamily) return;

    set({
      fontSettings: {
        ...currentSettings,
        fontFamily,
      },
    });
  },

  setFontSize: (fontSize) => {
    const currentSettings = get().fontSettings;
    if (fontSize === currentSettings.fontSize) return;

    set({
      fontSettings: {
        ...currentSettings,
        fontSize,
      },
    });
  },

  // Actions - Modals
  openModal: (modal) => {
    // Close all other modals first
    get().closeAllModals();

    switch (modal) {
      case "image":
        set({ isImageModalOpen: true });
        break;
      case "link":
        set({ isLinkModalOpen: true });
        break;
      case "table":
        set({ isTableModalOpen: true });
        break;
      case "emoji":
        set({ isEmojiPickerOpen: true });
        break;
      case "equation":
        set({ isEquationModalOpen: true });
        break;
      case "excalidraw":
        set({ isExcalidrawModalOpen: true });
        break;
    }
  },

  closeModal: (modal) => {
    switch (modal) {
      case "image":
        set({ isImageModalOpen: false });
        break;
      case "link":
        set({ isLinkModalOpen: false });
        break;
      case "table":
        set({ isTableModalOpen: false });
        break;
      case "emoji":
        set({ isEmojiPickerOpen: false });
        break;
      case "equation":
        set({ isEquationModalOpen: false });
        break;
      case "excalidraw":
        set({ isExcalidrawModalOpen: false });
        break;
    }
  },

  closeAllModals: () => {
    set({
      isImageModalOpen: false,
      isLinkModalOpen: false,
      isTableModalOpen: false,
      isEmojiPickerOpen: false,
      isEquationModalOpen: false,
      isExcalidrawModalOpen: false,
    });
  },

  // Actions - Image
  setImageData: (src, alt, showCaption = false) => {
    set({
      currentImageSrc: src,
      currentImageAlt: alt,
      showImageCaption: showCaption,
    });
  },

  // Actions - Link
  setLinkData: (url, editedUrl) => {
    set({
      currentLinkUrl: url,
      ...(editedUrl !== undefined ? { editedLinkUrl: editedUrl } : {}),
    });
  },

  // Actions - Table
  setTableDimensions: (rows, columns) => {
    set({
      tableRows: rows,
      tableColumns: columns,
    });
  },

  // Reset states
  resetFormatting: () => {
    set({
      textFormatting: { ...DEFAULT_TEXT_FORMATTING },
      colorSettings: { ...DEFAULT_COLOR_SETTINGS },
      fontSettings: { ...DEFAULT_FONT_SETTINGS },
    });
  },

  resetStore: () => {
    set({
      mode: "edit",
      isEditable: true,
      textFormatting: { ...DEFAULT_TEXT_FORMATTING },
      colorSettings: { ...DEFAULT_COLOR_SETTINGS },
      fontSettings: { ...DEFAULT_FONT_SETTINGS },
      isImageModalOpen: false,
      isLinkModalOpen: false,
      isTableModalOpen: false,
      isEmojiPickerOpen: false,
      isEquationModalOpen: false,
      isExcalidrawModalOpen: false,
      currentImageSrc: "",
      currentImageAlt: "",
      showImageCaption: false,
      currentLinkUrl: "",
      editedLinkUrl: "https://",
      tableRows: "3",
      tableColumns: "3",
    });
  },

  isEditorMode: false,
  setEditorMode: (isEditor) => set({ isEditorMode: isEditor }),
}));

export default useEditorStore;
