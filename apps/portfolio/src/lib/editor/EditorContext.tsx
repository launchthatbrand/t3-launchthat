"use client";

import type { Config, Data } from "@measured/puck";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EditorContextType {
  isEditing: boolean;
  currentPageData: Data | null;
  currentConfig: Config | null;
  setCurrentPageData: (data: Data) => void;
  setCurrentConfig: (config: Config) => void;
  savePageData: (
    data: Data,
    saveCallback?: (data: Data) => Promise<void>,
  ) => Promise<void>;
  exitEditor: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

interface EditorProviderProps {
  children: ReactNode;
  initialIsEditing?: boolean;
}

export function EditorProvider({
  children,
  initialIsEditing = false,
}: EditorProviderProps) {
  const router = useRouter();
  const [isEditing] = useState(initialIsEditing);
  const [currentPageData, setCurrentPageData] = useState<Data | null>(null);
  const [currentConfig, setCurrentConfig] = useState<Config | null>(null);

  const exitEditor = useCallback(() => {
    // Remove editor=true from URL and navigate to the same page
    const url = new URL(window.location.href);
    url.searchParams.delete("editor");
    router.push(url.pathname + url.search);
  }, [router]);

  const savePageData = useCallback(
    async (data: Data, saveCallback?: (data: Data) => Promise<void>) => {
      try {
        if (saveCallback) {
          await saveCallback(data);
        } else {
          // Default save behavior if no callback provided
          console.log("No save handler provided for this page type", data);
        }
        toast.success("Page saved successfully");
      } catch (error) {
        console.error("Error saving page data:", error);
        toast.error("Failed to save page");
      }
    },
    [],
  );

  return (
    <EditorContext.Provider
      value={{
        isEditing,
        currentPageData,
        currentConfig,
        setCurrentPageData,
        setCurrentConfig,
        savePageData,
        exitEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
