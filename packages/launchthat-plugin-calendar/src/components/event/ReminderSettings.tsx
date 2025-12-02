"use client";

import React, { useEffect, useState } from "react";
import { Id } from "@convex-config/_generated/dataModel";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

interface ReminderSettingsProps {
  eventId: Id<"posts">;
  userId: Id<"users">;
  className?: string;
}

type ReminderSetting = {
  type: "notification" | "email" | "sms";
  minutesBefore: number;
};

// Predefined reminder intervals
const REMINDER_INTERVALS = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "1440", label: "1 day before" },
  { value: "2880", label: "2 days before" },
  { value: "10080", label: "1 week before" },
];

export function ReminderSettings({
  eventId,
  userId,
  className,
}: ReminderSettingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  void eventId;
  void userId;

  // Update local state when we get settings from the server
  useEffect(() => {
    setReminders([{ type: "notification", minutesBefore: 30 }]);
  }, []);

  const handleAddReminder = () => {
    setReminders((prev) => [
      ...prev,
      { type: "notification", minutesBefore: 10 },
    ]);
  };

  const handleRemoveReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReminderTypeChange = (index: number, type: string) => {
    setReminders((prev) => {
      const next = [...prev];
      if (!next[index]) {
        return prev;
      }
      next[index] = {
        ...next[index],
        type: type as ReminderSetting["type"],
      };
      return next;
    });
  };

  const handleReminderTimeChange = (index: number, minutesBefore: string) => {
    const parsed = parseInt(minutesBefore, 10);
    setReminders((prev) => {
      const next = [...prev];
      if (!next[index]) {
        return prev;
      }
      next[index] = {
        ...next[index],
        minutesBefore: Number.isNaN(parsed)
          ? next[index].minutesBefore
          : parsed,
      };
      return next;
    });
  };

  const handleSaveReminders = async () => {
    try {
      setIsSubmitting(true);
      setIsDialogOpen(false);
      toast.success("Reminder settings saved (coming soon)");
    } catch (error) {
      console.error("Error saving reminders:", error);
      toast.error("Failed to save reminder settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format reminders for display
  const formatReminderText = () => {
    if (!reminders || reminders.length === 0) {
      return "No reminders set";
    }

    if (reminders.length === 1) {
      const { minutesBefore } = reminders[0] ?? { minutesBefore: 30 };
      return formatTimeText(minutesBefore);
    }

    return `${reminders.length} reminders set`;
  };

  const formatTimeText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes before`;
    } else if (minutes === 60) {
      return "1 hour before";
    } else if (minutes < 1440 && minutes % 60 === 0) {
      return `${minutes / 60} hours before`;
    } else if (minutes === 1440) {
      return "1 day before";
    } else if (minutes > 1440 && minutes % 1440 === 0) {
      return `${minutes / 1440} days before`;
    } else {
      return `${minutes} minutes before`;
    }
  };

  return (
    <>
      <Card
        className={cn(
          "flex cursor-pointer flex-row items-center p-3",
          className,
        )}
        onClick={() => setIsDialogOpen(true)}
      >
        <Bell className="text-muted-foreground mr-3 h-5 w-5" />
        <div>
          <h3 className="text-sm font-medium">Reminders</h3>
          <p className="text-muted-foreground text-xs">
            {formatReminderText()}
          </p>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reminder Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {reminders.map((reminder, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={reminder?.type ?? "notification"}
                    onValueChange={(value) =>
                      handleReminderTypeChange(index, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification">
                        In-app notification
                      </SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={(reminder?.minutesBefore ?? 30).toString()}
                    onValueChange={(value) =>
                      handleReminderTimeChange(index, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Time before" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_INTERVALS.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveReminder(index)}
                    disabled={reminders.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleAddReminder}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Another Reminder
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminders} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
