"use client";

import type { UseEmblaCarouselType } from "embla-carousel-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCarouselStore } from "@/store";

import { Card, CardContent } from "@acme/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@acme/ui/carousel";

export type CarouselItemTemplate = "inline" | "stacked" | "overlay";
export type TextAlignmentOption = "left" | "center" | "right";
export type VerticalAlignmentOption = "top" | "middle" | "bottom";

export interface CarouselItem {
  id: string;
  title?: string;
  excerpt?: string;
  imageUrl: string;
  template: CarouselItemTemplate;
  textAlign?: TextAlignmentOption;
  verticalAlign?: VerticalAlignmentOption;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  blogPostId?: string; // If linked to a blog post
}

// Use the correct API type from embla-carousel
type CarouselApi = UseEmblaCarouselType[1];

interface GroupHeaderCarouselProps {
  items: CarouselItem[];
  className?: string;
}

export function GroupHeaderCarousel({
  items,
  className = "",
}: GroupHeaderCarouselProps) {
  const [mounted, setMounted] = useState(false);
  const [_api, setApi] = useState<CarouselApi | null>(null);
  const { currentSlide, isEditorOpen, setItems, syncSlideWithAccordion } =
    useCarouselStore();

  // Use a ref to track if items have been initialized
  const itemsInitialized = useRef(false);

  // Track the rendered items to detect changes
  const [renderedItems, setRenderedItems] = useState<CarouselItem[]>([]);

  // Handle client-side rendering for the carousel
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update store when items change, but only once to prevent loops
  useEffect(() => {
    // Skip if no items or already initialized
    if (items.length === 0 || itemsInitialized.current) return;

    // Ensure all items have textAlign and verticalAlign properties
    const itemsWithDefaults = items.map((item) => ({
      ...item,
      textAlign: item.textAlign ?? "left",
      verticalAlign: item.verticalAlign ?? "middle",
    }));

    setItems(itemsWithDefaults);
    setRenderedItems(itemsWithDefaults);
    itemsInitialized.current = true;
  }, [items, setItems]);

  // Add a proper subscription to the store
  useEffect(() => {
    // Subscribe to store changes - this will ensure we always have the latest data
    const unsubscribe = useCarouselStore.subscribe((state) => {
      const storeItems = state.items;
      if (
        storeItems.length !== renderedItems.length ||
        JSON.stringify(storeItems) !== JSON.stringify(renderedItems)
      ) {
        setRenderedItems(storeItems);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [renderedItems]);

  // Handle slide changes - update the store when carousel changes
  useEffect(() => {
    if (!_api) return;

    const onSelect = () => {
      const selectedIndex = _api.selectedScrollSnap();
      if (typeof selectedIndex === "number") {
        syncSlideWithAccordion(selectedIndex);
      }
    };

    _api.on("select", onSelect);
    return () => {
      _api.off("select", onSelect);
    };
  }, [_api, syncSlideWithAccordion]);

  // Sync carousel with store when currentSlide changes in the store
  useEffect(() => {
    if (
      _api &&
      typeof currentSlide === "number" &&
      _api.selectedScrollSnap() !== currentSlide
    ) {
      _api.scrollTo(currentSlide);
    }
  }, [_api, currentSlide, isEditorOpen]);

  // If no items, show a placeholder
  if (renderedItems.length === 0) {
    return (
      <div
        className={`relative h-96 w-full overflow-hidden rounded-t-lg ${className}`}
      >
        <div className="h-full w-full bg-gradient-to-r from-primary/20 to-secondary/20" />
      </div>
    );
  }

  // If only one item, don't use carousel
  if (renderedItems.length === 1) {
    return (
      <div
        className={`relative h-96 w-full overflow-hidden rounded-t-lg md:h-64 ${className}`}
      >
        {renderedItems[0] && <CarouselItemContent item={renderedItems[0]} />}
      </div>
    );
  }

  // Use carousel for multiple items
  return mounted ? (
    <Carousel className="w-full" setApi={setApi}>
      <CarouselContent>
        {renderedItems.map((item) => (
          <CarouselItem key={item.id} className="basis-full">
            <Card className="overflow-hidden rounded-xl rounded-t-none p-0">
              <CardContent className="flex h-96 items-center justify-center p-0">
                <CarouselItemContent item={item} />
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2" />
      <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2" />
    </Carousel>
  ) : (
    // Placeholder during SSR
    <div
      className={`relative h-48 w-full overflow-hidden rounded-t-lg md:h-64 ${className}`}
    >
      <div className="h-full w-full bg-gradient-to-r from-primary/20 to-secondary/20" />
    </div>
  );
}

// Helper component to render carousel item content
function CarouselItemContent({ item }: { item: CarouselItem }) {
  // Get text alignment class based on the textAlign property
  const getTextAlignClass = () => {
    switch (item.textAlign) {
      case "left":
        return "text-left";
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left"; // Default to left if not specified
    }
  };

  // Get vertical alignment class based on the verticalAlign property
  const getVerticalAlignClass = () => {
    switch (item.verticalAlign) {
      case "top":
        return "justify-start";
      case "middle":
        return "justify-center";
      case "bottom":
        return "justify-end";
      default:
        return "justify-center"; // Default to middle if not specified
    }
  };

  const textAlignClass = getTextAlignClass();
  const verticalAlignClass = getVerticalAlignClass();

  // Add a function to generate padding style
  const getPaddingStyle = (padding?: CarouselItem["padding"]) => {
    if (!padding) return {};

    return {
      paddingTop: padding.top ? `${padding.top}px` : undefined,
      paddingRight: padding.right ? `${padding.right}px` : undefined,
      paddingBottom: padding.bottom ? `${padding.bottom}px` : undefined,
      paddingLeft: padding.left ? `${padding.left}px` : undefined,
    };
  };

  // Handle different templates
  switch (item.template) {
    case "inline":
      return (
        <div className="grid h-full w-full grid-cols-2">
          <div
            className={`flex flex-col space-y-2 p-6 ${textAlignClass} ${verticalAlignClass}`}
            style={getPaddingStyle(item.padding)}
          >
            {item.title && <h2 className="text-2xl font-bold">{item.title}</h2>}
            {item.excerpt && (
              <p className="line-clamp-3 text-muted-foreground">
                {item.excerpt}
              </p>
            )}
          </div>
          <div className="relative h-full w-full">
            <Image
              src={item.imageUrl}
              alt={item.title ?? "Carousel image"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      );

    case "stacked":
      return (
        <div className="flex h-full w-full flex-col">
          <div className="relative h-2/3 w-full">
            <Image
              src={item.imageUrl}
              alt={item.title ?? "Carousel image"}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div
            className={`flex h-1/3 flex-col space-y-1 p-4 ${textAlignClass} ${verticalAlignClass}`}
            style={getPaddingStyle(item.padding)}
          >
            {item.title && <h2 className="text-lg font-bold">{item.title}</h2>}
            {item.excerpt && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.excerpt}
              </p>
            )}
          </div>
        </div>
      );

    case "overlay":
    default:
      return (
        <div className="relative h-full w-full">
          <Image
            src={item.imageUrl}
            alt={item.title ?? "Carousel image"}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 flex flex-col bg-gradient-to-t from-background/80 to-transparent">
            <div
              className={`absolute inset-x-0 p-6 ${textAlignClass} ${
                item.verticalAlign === "top"
                  ? "top-0"
                  : item.verticalAlign === "bottom"
                    ? "bottom-0"
                    : "top-1/2 -translate-y-1/2"
              }`}
              style={getPaddingStyle(item.padding)}
            >
              {item.title && (
                <h2 className="text-2xl font-bold text-white drop-shadow-md">
                  {item.title}
                </h2>
              )}
              {item.excerpt && (
                <p className="line-clamp-2 text-white/90">{item.excerpt}</p>
              )}
            </div>
          </div>
        </div>
      );
  }
}
