import React, { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Control, Controller, useFormContext } from "react-hook-form";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import type { LessonFormValues } from "~/app/(root)/(admin)/admin/lessons/_components/LessonForm";
import { MediaItem, MediaLibrary } from "~/app/(root)/(admin)/admin/media/page";

interface MediaPickerProps {
  control: Control<LessonFormValues>;
  name: "featuredMedia";
  placeholder?: string;
  postType: string;
  postId?: string;
  _value?: string;
}

function MediaPicker({
  control,
  name,
  placeholder = "Choose media",
  postType,
  postId,
  _value,
}: MediaPickerProps) {
  const { setValue } = useFormContext();
  const [open, setOpen] = useState(false);
  const handleSelect = (media: MediaItem) => {
    if (media.url) {
      console.log("media", media);
      setValue(name, media.url);
    }
    setOpen(false);
  };
  const handleClear = () => {
    setValue(name, "");
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value: fieldValue, ..._field } }) => (
        <div className="flex items-center space-x-2">
          {fieldValue ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-md">
              {fieldValue && (
                <img
                  src={fieldValue}
                  alt="Featured"
                  className="h-full w-full object-cover"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed text-sm">
              No media
            </div>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                {placeholder}
              </Button>
            </DialogTrigger>
            <DialogContent className="flex h-[90%] max-w-screen-lg flex-col overflow-y-auto">
              <DialogTitle>Media Library</DialogTitle>
              <MediaLibrary mode="select" onSelect={handleSelect} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    />
  );
}

export default MediaPicker;
