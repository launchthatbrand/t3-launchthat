import type { Slot } from "@measured/puck";

export type TemplateData = Record<string, { label: string; data: Slot }>;

export interface TemplateStorage {
  load(): Promise<TemplateData>;
  save(record: TemplateData): Promise<void>;
}

type TemplateStorageFactory = (key: string) => TemplateStorage;

let storageFactory: TemplateStorageFactory | null = null;

const createLocalStorageAdapter = (key: string): TemplateStorage => ({
  async load() {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as TemplateData) : {};
    } catch {
      return {};
    }
  },
  async save(record) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(record));
  },
});

/**
 * Allow consuming applications to override where templates are persisted.
 */
export const setTemplateStorage = (factory: TemplateStorageFactory) => {
  storageFactory = factory;
};

export const getTemplateStorage = (key: string): TemplateStorage => {
  if (storageFactory) {
    return storageFactory(key);
  }

  return createLocalStorageAdapter(key);
};

export const createLocalTemplateStorage = createLocalStorageAdapter;

