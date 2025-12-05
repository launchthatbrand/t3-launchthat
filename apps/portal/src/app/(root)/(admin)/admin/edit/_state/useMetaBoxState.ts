import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MetaBoxState {
  metaBoxStates: Record<string, boolean>;
  setMetaBoxState: (key: string, isOpen: boolean) => void;
}

export const useMetaBoxState = create<MetaBoxState>()(
  persist(
    (set) => ({
      metaBoxStates: {},
      setMetaBoxState: (key, isOpen) =>
        set((state) => ({
          metaBoxStates: {
            ...state.metaBoxStates,
            [key]: isOpen,
          },
        })),
    }),
    {
      name: "admin-meta-box-state",
      version: 1,
    },
  ),
);
