"use client";

import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  DeleteIcon,
  EyeOff,
  MessageSquare,
  Plus,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type {
  Doc,
  Id,
} from "../../../../../../apps/portal/convex/_generated/dataModel";

// interface OrderNote {
//   id: string;
//   content: string;
//   authorId?: Id<"users">;
//   authorName?: string;
//   createdAt: number;
//   isPrivate?: boolean;
// }

interface OrderNotesProps {
  orderId: Id<"orders">;
}

export function OrderNotes({ orderId }: OrderNotesProps) {
  const { user } = useUser();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Queries and mutations
  const notes = useQuery(api.ecommerce.orders.notes.getOrderNotes, {
    orderId,
    includePrivate: true, // Show all notes for admin users
  });

  const addNote = useMutation(api.ecommerce.orders.notes.addOrderNote);
  const deleteNote = useMutation(api.ecommerce.orders.notes.deleteOrderNote);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      await addNote({
        orderId,
        content: newNoteContent,
        authorId: user?.id as Id<"users">,
        authorName: user?.fullName ?? user?.firstName ?? "Admin",
        isPrivate,
      });

      setNewNoteContent("");
      setIsPrivate(false);
      setIsAddingNote(false);
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote({
        orderId,
        noteId,
      });
      toast.success("Note deleted successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  if (!notes) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <p className="text-muted-foreground mt-2 text-sm">
              Loading notes...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* <CardHeader>
        <CardTitle>Order Notes</CardTitle>
      </CardHeader> */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            <CardTitle>Order Notes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0"
            >
              {isExpanded ? (
                <ChevronDown className="text-muted-foreground h-4 w-4" />
              ) : (
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {notes.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground mb-3 text-sm">No notes yet</p>
              <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Order Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="note-content">Note Content</Label>
                      <Textarea
                        id="note-content"
                        placeholder="Enter your note here..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="private-note"
                        checked={isPrivate}
                        onCheckedChange={(checked) =>
                          setIsPrivate(checked as boolean)
                        }
                      />
                      <Label htmlFor="private-note" className="text-sm">
                        Private note (only visible to admins)
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingNote(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddNote}>Add Note</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-3">
              {/* {notes.map((note: Doc<"">) => (
                <Card key={note.id} className="overflow-hidden p-0 shadow-none">
                  <CardContent className="bg-primary/10 rounded-lg rounded-b-none p-4 text-sm shadow">
                    {note.content}
                  </CardContent>
                  <CardFooter className="flex justify-between gap-4 px-4 py-2 text-xs">
                    <span className="border-gray-400">
                      {format(
                        new Date(note.createdAt),
                        "MMMM dd, yyyy 'at' h:mm a",
                      )}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DeleteIcon className="text-red-600 hover:border-red-600 hover:text-red-800" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Note</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this note? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteNote(note.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {note.isPrivate && (
                      <span className="flex items-center gap-1 text-purple-600">
                        <EyeOff className="h-3 w-3" />
                        Private
                      </span>
                    )}
                  </CardFooter>
                  {/* <div className="pr-8">
                    <p className="mb-3 text-sm leading-relaxed text-gray-700"></p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="border-b border-dotted border-gray-400">
                        {format(
                          new Date(note.createdAt),
                          "MMMM dd, yyyy 'at' h:mm a",
                        )}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="border-b border-dotted border-red-400 text-red-600 hover:border-red-600 hover:text-red-800">
                            Delete note
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Note</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this note? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteNote(note.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {note.isPrivate && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <EyeOff className="h-3 w-3" />
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))} */}

              {/* Add Note Button */}
              <div className="pt-2">
                <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Order Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="note-content">Note Content</Label>
                        <Textarea
                          id="note-content"
                          placeholder="Enter your note here..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="private-note"
                          checked={isPrivate}
                          onCheckedChange={(checked) =>
                            setIsPrivate(checked as boolean)
                          }
                        />
                        <Label htmlFor="private-note" className="text-sm">
                          Private note (only visible to admins)
                        </Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingNote(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddNote}>Add Note</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
