"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@acme/ui/button";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Textarea } from "@acme/ui/textarea";
import { cn } from "@acme/ui";
import { format } from "date-fns";

export interface Note {
    id: string;
    content: string;
    timestamp: number;
    entityId: string;
    entityLabel?: string; // e.g. "Order #123"
}

interface NotesSectionProps {
    entityId: string;
    entityLabel?: string; // Label for the current entity (e.g. "Trade Idea")
    relatedEntities?: { id: string; label: string }[]; // e.g. [{id: "ord-1", label: "Order #1"}]
    initialNotes?: Note[];
    className?: string;
}

export function NotesSection({
    entityId,
    entityLabel = "Current Item",
    relatedEntities = [],
    initialNotes = [],
    className,
}: NotesSectionProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState("");
    const [mounted, setMounted] = useState(false);

    // Stabilize relatedEntities dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableRelatedEntities = useMemo(() => relatedEntities, [
        JSON.stringify(relatedEntities),
    ]);

    // Load notes from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const loadNotes = () => {
            const allNotesMap = new Map<string, Note>();

            // 0. Add initial notes
            initialNotes.forEach(note => allNotesMap.set(note.id, note));

            // 1. Load notes for this entity
            const local = localStorage.getItem(`notes-${entityId}`);
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    parsed.forEach((n: any) => {
                        const note = { ...n, entityId, entityLabel };
                        allNotesMap.set(note.id, note);
                    });
                } catch (e) {
                    console.error("Failed to parse notes", e);
                }
            }

            // 2. Load notes for related entities
            stableRelatedEntities.forEach((rel) => {
                const relLocal = localStorage.getItem(`notes-${rel.id}`);
                if (relLocal) {
                    try {
                        const parsed = JSON.parse(relLocal);
                        parsed.forEach((n: any) => {
                            const note = {
                                ...n,
                                entityId: rel.id,
                                entityLabel: rel.label,
                            };
                            allNotesMap.set(note.id, note);
                        });
                    } catch (e) {
                        console.error(`Failed to parse notes for ${rel.id}`, e);
                    }
                }
            });

            // Convert map to array and sort by timestamp desc
            setNotes(Array.from(allNotesMap.values()).sort((a, b) => b.timestamp - a.timestamp));
        };

        loadNotes();

        // Listen for storage events to sync across tabs (optional polish)
        window.addEventListener("storage", loadNotes);
        return () => window.removeEventListener("storage", loadNotes);
    }, [entityId, stableRelatedEntities, entityLabel]);

    const addNote = () => {
        if (!newNote.trim()) return;

        const note: Note = {
            id: crypto.randomUUID(),
            content: newNote,
            timestamp: Date.now(),
            entityId,
        };

        // Update local storage for THIS entity only
        const currentStorage = localStorage.getItem(`notes-${entityId}`);
        const currentNotes = currentStorage ? JSON.parse(currentStorage) : [];
        const updatedNotes = [...currentNotes, note];
        localStorage.setItem(`notes-${entityId}`, JSON.stringify(updatedNotes));

        // Update state (re-merge with related to keep sort)
        setNewNote("");

        // Trigger a reload of all notes to include the new one properly sorted
        // (Or just optimistically add it, but re-running the load logic is safer for consistency)
        const relNotes = notes.filter(n => n.entityId !== entityId);
        const myNotes = updatedNotes.map((n: any) => ({ ...n, entityId, entityLabel }));
        setNotes([...myNotes, ...relNotes].sort((a, b) => b.timestamp - a.timestamp));
    };

    const deleteNote = (noteId: string, noteEntityId: string) => {
        if (noteEntityId !== entityId) return; // Can only delete own notes for now

        const currentStorage = localStorage.getItem(`notes-${entityId}`);
        if (currentStorage) {
            const currentNotes = JSON.parse(currentStorage);
            const updatedNotes = currentNotes.filter((n: any) => n.id !== noteId);
            localStorage.setItem(`notes-${entityId}`, JSON.stringify(updatedNotes));

            // Update UI
            setNotes(notes.filter(n => n.id !== noteId));
        }
    };

    if (!mounted) return null;

    return (
        <Card className={cn("flex flex-col h-[500px]", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <StickyNote className="h-4 w-4" />
                    Notes & Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-[300px]">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4">
                        {notes.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                                No notes yet. Add one below.
                            </div>
                        ) : (
                            notes.map((note) => (
                                <div
                                    key={note.id}
                                    className={`relative rounded-lg border p-3 text-sm ${note.entityId !== entityId
                                        ? "bg-muted/30 border-dashed"
                                        : "bg-background"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                            {format(note.timestamp, "MMM d, h:mm a")}
                                            {note.entityId !== entityId && (
                                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                                                    from {note.entityLabel}
                                                </span>
                                            )}
                                        </span>
                                        {note.entityId === entityId && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 -mr-1 text-muted-foreground hover:text-destructive"
                                                onClick={() => deleteNote(note.id, note.entityId)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                                        {note.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="pt-2 gap-2 flex flex-col">
                    <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-20 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                addNote();
                            }
                        }}
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            Add Note
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
