"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@acme/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@acme/ui/dialog";
import { ScrollArea } from "@acme/ui/scroll-area";
import { cn } from "@acme/ui";
import { format } from "date-fns";
import { SimpleEditor } from "@acme/ui";

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
    const [mounted, setMounted] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draftHtml, setDraftHtml] = useState<string>("");
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [editorKey, setEditorKey] = useState(0);

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

    const isHtmlLike = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);
    const htmlToPlain = (value: string) =>
        value
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const openCreateDialog = () => {
        setActiveNoteId(null);
        setDraftHtml("");
        setEditorKey((k) => k + 1);
        setDialogOpen(true);
    };

    const openEditDialog = (noteId: string) => {
        const note = notes.find((n) => n.id === noteId);
        if (!note) return;
        if (note.entityId !== entityId) return; // only edit own notes for now
        setActiveNoteId(noteId);
        setDraftHtml(note.content ?? "");
        setEditorKey((k) => k + 1);
        setDialogOpen(true);
    };

    const persistNotesForEntity = (next: Note[]) => {
        const slim = next.map(({ id, content, timestamp }) => ({ id, content, timestamp }));
        localStorage.setItem(`notes-${entityId}`, JSON.stringify(slim));
    };

    const handleSave = () => {
        const plain = htmlToPlain(draftHtml);
        if (!plain) return;

        const now = Date.now();

        if (!activeNoteId) {
            const note: Note = {
                id: crypto.randomUUID(),
                content: draftHtml,
                timestamp: now,
                entityId,
                entityLabel,
            };

            const next = [
                // new note first
                note,
                // keep existing notes but dedupe
                ...notes.filter((n) => n.id !== note.id),
            ].sort((a, b) => b.timestamp - a.timestamp);

            // Persist only own notes
            persistNotesForEntity(next.filter((n) => n.entityId === entityId));
            setNotes(next);
        } else {
            const next = notes
                .map((n) =>
                    n.id === activeNoteId && n.entityId === entityId
                        ? { ...n, content: draftHtml, timestamp: now }
                        : n,
                )
                .sort((a, b) => b.timestamp - a.timestamp);

            persistNotesForEntity(next.filter((n) => n.entityId === entityId));
            setNotes(next);
        }

        setDialogOpen(false);
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
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <StickyNote className="h-4 w-4" />
                        Notes & Activity
                    </CardTitle>
                    <Button size="sm" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Add Note
                    </Button>
                </div>
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
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-white"
                                                    onClick={() => openEditDialog(note.id)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => deleteNote(note.id, note.entityId)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {isHtmlLike(note.content) ? (
                                        <div
                                            className="prose prose-invert max-w-none text-foreground/90"
                                            // Notes are authored by the current user in-app (localStorage).
                                            // We also strip scripts/styles in edit validation for safety.
                                            dangerouslySetInnerHTML={{ __html: note.content }}
                                        />
                                    ) : (
                                        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                                            {note.content}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-[900px] border-white/10 bg-black/80 text-white backdrop-blur">
                        <DialogHeader>
                            <DialogTitle>
                                {activeNoteId ? "Edit note" : "Add note"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="rounded-lg border border-white/10 bg-black/30">
                            <SimpleEditor
                                key={editorKey}
                                variant="note"
                                initialContent={draftHtml || "<p></p>"}
                                onChange={(html) => setDraftHtml(html)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={!htmlToPlain(draftHtml)}>
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
