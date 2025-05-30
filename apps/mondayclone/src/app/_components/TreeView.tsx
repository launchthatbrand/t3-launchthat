"use client";

import { useState } from "react";
import {
  Layout as BoardIcon,
  ChevronDown,
  ChevronRight,
  Edit,
  Folder as FolderIcon,
  FolderSymlink,
  GripVertical,
  MoreVertical,
  Trash,
} from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

import type { BoardStore } from "../../store/boardStore";
import { useBoardStore } from "../../store/boardStore";

interface TreeViewProps {
  onSelect: (type: "folder" | "board", id: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ onSelect }) => {
  const foldersObj = useBoardStore((s: BoardStore) => s.folders);
  const boardsObj = useBoardStore((s: BoardStore) => s.boards);
  const folders = Object.values(foldersObj);
  const boards = Object.values(boardsObj);
  const activeFolderId = useBoardStore((s: BoardStore) => s.activeFolderId);
  const activeBoardId = useBoardStore((s: BoardStore) => s.activeBoardId);
  const removeBoardStore = useBoardStore((s: BoardStore) => s.removeBoard);
  const updateBoardStore = useBoardStore((s: BoardStore) => s.updateBoard);
  const removeFolderStore = useBoardStore((s: BoardStore) => s.removeFolder);
  const updateFolderStore = useBoardStore((s: BoardStore) => s.updateFolder);

  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<
    "board" | "folder" | null
  >(null);
  const [moveBoardId, setMoveBoardId] = useState<string | null>(null);
  const [moveToFolder, setMoveToFolder] = useState<string | undefined>(
    undefined,
  );

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const topLevelBoards = boards.filter((b) => !b.folderId);

  const handleRenameBoard = (boardId: string, name: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    updateBoardStore({ ...board, name });
    setEditingBoardId(null);
    setRenameValue("");
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    updateFolderStore({ ...folder, name });
    setEditingFolderId(null);
    setRenameValue("");
  };

  const handleMoveBoard = (
    boardId: string,
    targetFolderId: string | undefined,
  ) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    updateBoardStore({ ...board, folderId: targetFolderId });
    setMoveBoardId(null);
  };

  const handleDeleteConfirm = () => {
    if (!showDeleteId || !itemTypeToDelete) return;
    if (itemTypeToDelete === "board") {
      removeBoardStore(showDeleteId);
    } else if (itemTypeToDelete === "folder") {
      removeFolderStore(showDeleteId);
    }
    setShowDeleteId(null);
    setItemTypeToDelete(null);
  };

  return (
    <nav className="space-y-1">
      {/* Folders */}
      {folders.map((folder) => (
        <div key={folder.id}>
          <div
            className={cn(
              "group flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:bg-accent",
              activeFolderId === folder.id &&
                "bg-accent font-semibold text-primary",
            )}
            onClick={() => onSelect("folder", folder.id)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to reorder folder"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFolder(folder.id);
              }}
              aria-label={
                expandedFolders[folder.id] ? "Collapse folder" : "Expand folder"
              }
            >
              {expandedFolders[folder.id] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <FolderIcon className="mr-1 h-4 w-4 flex-shrink-0" />
            {editingFolderId === folder.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameFolder(folder.id, renameValue);
                }}
                className="flex-1"
              >
                <input
                  className="w-full rounded border bg-background px-1 text-sm"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    handleRenameFolder(folder.id, renameValue);
                    setEditingFolderId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditingFolderId(null);
                      setRenameValue("");
                    }
                  }}
                />
              </form>
            ) : (
              <span className="flex-1 truncate" title={folder.name}>
                {folder.name}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenuId(folder.id === showMenuId ? null : folder.id);
              }}
              aria-label="More options for folder"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenuId === folder.id && (
              <div className="absolute right-0 z-10 mr-2 mt-1 w-40 rounded border bg-popover p-1 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(folder.id);
                    setRenameValue(folder.name);
                    setShowMenuId(null);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" /> Rename
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteId(folder.id);
                    setItemTypeToDelete("folder");
                    setShowMenuId(null);
                  }}
                >
                  <Trash className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
          {expandedFolders[folder.id] && (
            <div className="ml-4 space-y-1 border-l border-dashed border-muted-foreground/30 pl-5">
              {boards
                .filter((b) => b.folderId === folder.id)
                .map((board) => (
                  <div
                    key={board.id}
                    className={cn(
                      "group flex cursor-pointer items-center gap-1 rounded py-1 pl-1 pr-2 hover:bg-accent",
                      activeBoardId === board.id &&
                        "bg-accent font-semibold text-primary",
                    )}
                    onClick={() => onSelect("board", board.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Drag to reorder board"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <BoardIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                    {editingBoardId === board.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenameBoard(board.id, renameValue);
                        }}
                        className="flex-1"
                      >
                        <input
                          className="w-full rounded border bg-background px-1 text-sm"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                          onBlur={() => {
                            handleRenameBoard(board.id, renameValue);
                            setEditingBoardId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingBoardId(null);
                              setRenameValue("");
                            }
                          }}
                        />
                      </form>
                    ) : (
                      <span className="flex-1 truncate" title={board.name}>
                        {board.name}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuId(
                          board.id === showMenuId ? null : board.id,
                        );
                      }}
                      aria-label="More options for board"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {showMenuId === board.id && (
                      <div className="absolute right-0 z-10 mr-2 mt-1 w-40 rounded border bg-popover p-1 shadow-lg">
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBoardId(board.id);
                            setRenameValue(board.name);
                            setShowMenuId(null);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" /> Rename
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveBoardId(board.id);
                            setMoveToFolder(board.folderId);
                            setShowMenuId(null);
                          }}
                        >
                          <FolderSymlink className="h-3.5 w-3.5" /> Move to
                          Folder
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteId(board.id);
                            setItemTypeToDelete("board");
                            setShowMenuId(null);
                          }}
                        >
                          <Trash className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
      {/* Top-level Boards */}
      {topLevelBoards.length > 0 && (
        <div className="mt-2">
          {topLevelBoards.map((board) => (
            <div
              key={board.id}
              className={cn(
                "group flex cursor-pointer items-center gap-1 rounded py-1 pl-1 pr-2 hover:bg-accent",
                activeBoardId === board.id &&
                  "bg-accent font-semibold text-primary",
              )}
              onClick={() => onSelect("board", board.id)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label="Drag to reorder board"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
              <BoardIcon className="mr-1 h-4 w-4 flex-shrink-0" />
              {editingBoardId === board.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRenameBoard(board.id, renameValue);
                  }}
                  className="flex-1"
                >
                  <input
                    className="w-full rounded border bg-background px-1 text-sm"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                    onBlur={() => {
                      handleRenameBoard(board.id, renameValue);
                      setEditingBoardId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setEditingBoardId(null);
                        setRenameValue("");
                      }
                    }}
                  />
                </form>
              ) : (
                <span className="flex-1 truncate" title={board.name}>
                  {board.name}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenuId(board.id === showMenuId ? null : board.id);
                }}
                aria-label="More options for board"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMenuId === board.id && (
                <div className="absolute right-0 z-10 mr-2 mt-1 w-40 rounded border bg-popover p-1 shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBoardId(board.id);
                      setRenameValue(board.name);
                      setShowMenuId(null);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" /> Rename
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveBoardId(board.id);
                      setMoveToFolder(board.folderId);
                      setShowMenuId(null);
                    }}
                  >
                    <FolderSymlink className="h-3.5 w-3.5" /> Move to Folder
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteId(board.id);
                      setItemTypeToDelete("board");
                      setShowMenuId(null);
                    }}
                  >
                    <Trash className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded border bg-popover p-4 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Confirm Deletion</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {`Are you sure you want to delete this ${itemTypeToDelete}?`}
              {itemTypeToDelete === "folder" &&
                " Any boards inside will be moved to the top level."}
              {" This action cannot be undone."}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteId(null);
                  setItemTypeToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TreeView;
