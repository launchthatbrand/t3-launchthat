"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from "lucide-react";
import type {
  CarouselItem,
  TextAlignmentOption,
  VerticalAlignmentOption,
} from "./GroupHeaderCarousel";
import { ToggleGroup, ToggleGroupItem } from "@acme/ui/toggle-group";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import React from "react";

interface SlideSettingsPanelProps {
  item: CarouselItem;
  onUpdate: (updates: Partial<CarouselItem>) => void;
}

export function SlideSettingsPanel({
  item,
  onUpdate,
}: SlideSettingsPanelProps) {
  // Current padding values with defaults
  const padding = {
    top: item.padding?.top ?? 0,
    right: item.padding?.right ?? 0,
    bottom: item.padding?.bottom ?? 0,
    left: item.padding?.left ?? 0,
  };

  // Handle text alignment change
  const handleTextAlignChange = (value: string) => {
    if (value) {
      onUpdate({ textAlign: value as TextAlignmentOption });
    }
  };

  // Handle vertical alignment change
  const handleVerticalAlignChange = (value: string) => {
    if (value) {
      onUpdate({ verticalAlign: value as VerticalAlignmentOption });
    }
  };

  // Handle padding change
  const handlePaddingChange = (
    direction: "top" | "right" | "bottom" | "left",
    valueStr: string,
  ) => {
    const value = parseInt(valueStr || "0", 10);
    if (isNaN(value)) return;

    const currentPadding = item.padding ?? {};
    onUpdate({
      padding: {
        ...currentPadding,
        [direction]: value,
      },
    });
  };

  // Reset all padding
  const handleResetPadding = () => {
    onUpdate({ padding: undefined });
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="alignment">
          <AccordionTrigger>Alignment Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Text Alignment Controls */}
              <div className="space-y-2">
                <Label htmlFor={`text-align-${item.id}`}>Text Alignment</Label>
                <ToggleGroup
                  id={`text-align-${item.id}`}
                  type="single"
                  value={item.textAlign ?? "left"}
                  onValueChange={handleTextAlignChange}
                  className="justify-start"
                >
                  <ToggleGroupItem value="left" aria-label="Align text left">
                    <AlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="center"
                    aria-label="Align text center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align text right">
                    <AlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Vertical Alignment Controls */}
              <div className="space-y-2">
                <Label htmlFor={`vertical-align-${item.id}`}>
                  Vertical Alignment
                </Label>
                <ToggleGroup
                  id={`vertical-align-${item.id}`}
                  type="single"
                  value={item.verticalAlign ?? "middle"}
                  onValueChange={handleVerticalAlignChange}
                  className="justify-start"
                >
                  <ToggleGroupItem value="top" aria-label="Align top">
                    <AlignVerticalJustifyStart className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="middle" aria-label="Align middle">
                    <AlignVerticalJustifyCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bottom" aria-label="Align bottom">
                    <AlignVerticalJustifyEnd className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="padding">
          <AccordionTrigger>Padding Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Padding</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPadding}
                  className="h-8 px-2"
                >
                  Reset
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Top Padding */}
                <div className="space-y-2">
                  <Label htmlFor={`padding-top-${item.id}`}>Top (px)</Label>
                  <Input
                    id={`padding-top-${item.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={padding.top}
                    onChange={(e) => handlePaddingChange("top", e.target.value)}
                  />
                </div>

                {/* Right Padding */}
                <div className="space-y-2">
                  <Label htmlFor={`padding-right-${item.id}`}>Right (px)</Label>
                  <Input
                    id={`padding-right-${item.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={padding.right}
                    onChange={(e) =>
                      handlePaddingChange("right", e.target.value)
                    }
                  />
                </div>

                {/* Bottom Padding */}
                <div className="space-y-2">
                  <Label htmlFor={`padding-bottom-${item.id}`}>
                    Bottom (px)
                  </Label>
                  <Input
                    id={`padding-bottom-${item.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={padding.bottom}
                    onChange={(e) =>
                      handlePaddingChange("bottom", e.target.value)
                    }
                  />
                </div>

                {/* Left Padding */}
                <div className="space-y-2">
                  <Label htmlFor={`padding-left-${item.id}`}>Left (px)</Label>
                  <Input
                    id={`padding-left-${item.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={padding.left}
                    onChange={(e) =>
                      handlePaddingChange("left", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
