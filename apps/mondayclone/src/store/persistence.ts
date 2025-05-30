import type { Board, Folder, Group, Item } from "../types/board";

export interface PersistenceService {
  saveBoard: (board: Board) => void;
  getBoard: (id: string) => Board | undefined;
  getAllBoards: () => Board[];
  deleteBoard: (id: string) => void;
  saveFolder: (folder: Folder) => void;
  getFolder: (id: string) => Folder | undefined;
  getAllFolders: () => Folder[];
  deleteFolder: (id: string) => void;
  saveGroup: (group: Group) => void;
  getGroup: (id: string) => Group | undefined;
  getAllGroups: () => Group[];
  deleteGroup: (id: string) => void;
  saveItem: (item: Item) => void;
  getItem: (id: string) => Item | undefined;
  getAllItems: () => Item[];
  deleteItem: (id: string) => void;
}

const getKey = (type: string) => `monclone_${type}`;

function loadAll<T>(type: string): Record<string, T> {
  try {
    const data = localStorage.getItem(getKey(type));
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveAll<T>(type: string, data: Record<string, T>) {
  try {
    localStorage.setItem(getKey(type), JSON.stringify(data));
  } catch (e) {
    // Handle quota exceeded or serialization errors
    // Optionally, add error reporting here
  }
}

export const localPersistence: PersistenceService = {
  // Boards
  saveBoard: (board) => {
    const all = loadAll<Board>("boards");
    all[board.id] = board;
    saveAll("boards", all);
  },
  getBoard: (id) => loadAll<Board>("boards")[id],
  getAllBoards: () => Object.values(loadAll<Board>("boards")),
  deleteBoard: (id) => {
    const all = loadAll<Board>("boards");
    delete all[id];
    saveAll("boards", all);
  },
  // Folders
  saveFolder: (folder) => {
    const all = loadAll<Folder>("folders");
    all[folder.id] = folder;
    saveAll("folders", all);
  },
  getFolder: (id) => loadAll<Folder>("folders")[id],
  getAllFolders: () => Object.values(loadAll<Folder>("folders")),
  deleteFolder: (id) => {
    const all = loadAll<Folder>("folders");
    delete all[id];
    saveAll("folders", all);
  },
  // Groups
  saveGroup: (group) => {
    const all = loadAll<Group>("groups");
    all[group.id] = group;
    saveAll("groups", all);
  },
  getGroup: (id) => loadAll<Group>("groups")[id],
  getAllGroups: () => Object.values(loadAll<Group>("groups")),
  deleteGroup: (id) => {
    const all = loadAll<Group>("groups");
    delete all[id];
    saveAll("groups", all);
  },
  // Items
  saveItem: (item) => {
    const all = loadAll<Item>("items");
    all[item.id] = item;
    saveAll("items", all);
  },
  getItem: (id) => loadAll<Item>("items")[id],
  getAllItems: () => Object.values(loadAll<Item>("items")),
  deleteItem: (id) => {
    const all = loadAll<Item>("items");
    delete all[id];
    saveAll("items", all);
  },
};
