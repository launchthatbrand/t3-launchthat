"use client";

import type { UseFormReturn } from "react-hook-form";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { EventFormValues } from "../../app/(root)/(admin)/admin/calendar/_components/EventForm";

interface RecurrenceSelectorProps {
  form: UseFormReturn<EventFormValues>;
}

const DAYS_OF_WEEK = [
  { value: "MO", label: "Monday" },
  { value: "TU", label: "Tuesday" },
  { value: "WE", label: "Wednesday" },
  { value: "TH", label: "Thursday" },
  { value: "FR", label: "Friday" },
  { value: "SA", label: "Saturday" },
  { value: "SU", label: "Sunday" },
];

export function RecurrenceSelector({ form }: RecurrenceSelectorProps) {
  const isRecurringEvent = form.watch("recurrence.enabled");

  return (
    <FormField
      control={form.control}
      name="recurrence.enabled"
      render={({ field }) => (
        <FormItem className="space-y-3 rounded-md border p-4">
          <div className="flex items-center space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="recurrence"
              />
            </FormControl>
            <Label
              htmlFor="recurrence"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Recurring Event
            </Label>
          </div>
          <FormDescription>
            Configure if this event repeats on a schedule
          </FormDescription>

          {isRecurringEvent && (
            <div className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="recurrence.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence.interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat every</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 1)
                          }
                          className="w-16"
                        />
                      </FormControl>
                      <span>
                        {form.watch("recurrence.frequency") === "daily" &&
                          "days"}
                        {form.watch("recurrence.frequency") === "weekly" &&
                          "weeks"}
                        {form.watch("recurrence.frequency") === "monthly" &&
                          "months"}
                        {form.watch("recurrence.frequency") === "yearly" &&
                          "years"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("recurrence.frequency") === "weekly" && (
                <FormField
                  control={form.control}
                  name="recurrence.byDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat on</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <FormItem
                            key={day.value}
                            className="flex items-center space-x-1"
                          >
                            <FormControl>
                              <Checkbox
                                checked={
                                  field.value?.includes(
                                    day.value as
                                      | "MO"
                                      | "TU"
                                      | "WE"
                                      | "TH"
                                      | "FR"
                                      | "SA"
                                      | "SU",
                                  ) ?? false
                                }
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value ?? [];
                                  const newValue = checked
                                    ? [
                                        ...currentValue,
                                        day.value as
                                          | "MO"
                                          | "TU"
                                          | "WE"
                                          | "TH"
                                          | "FR"
                                          | "SA"
                                          | "SU",
                                      ]
                                    : currentValue.filter(
                                        (value) => value !== day.value,
                                      );
                                  field.onChange(newValue);
                                }}
                              />
                            </FormControl>
                            <Label className="text-xs">{day.label[0]}</Label>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="recurrence.endType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Ends</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="never" />
                          </FormControl>
                          <FormLabel className="font-normal">Never</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="after" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            After{" "}
                            <Input
                              type="number"
                              min={1}
                              value={form.watch("recurrence.count")}
                              onChange={(e) =>
                                form.setValue(
                                  "recurrence.count",
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              onClick={() =>
                                form.setValue("recurrence.endType", "after")
                              }
                              className="ml-2 inline-block w-16"
                            />{" "}
                            occurrences
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="on" />
                          </FormControl>
                          <FormLabel className="flex items-center font-normal">
                            On{" "}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="ml-2 w-[120px] pl-3 text-left font-normal"
                                  onClick={() =>
                                    form.setValue("recurrence.endType", "on")
                                  }
                                >
                                  {form.watch("recurrence.until") ? (
                                    format(
                                      form.watch("recurrence.until") as Date,
                                      "PPP",
                                    )
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    form.watch("recurrence.until") as
                                      | Date
                                      | undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      form.setValue("recurrence.until", date);
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </FormItem>
      )}
    />
  );
}
