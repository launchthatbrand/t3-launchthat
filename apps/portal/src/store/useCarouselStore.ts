import { create } from "zustand";
import { shallow } from "zustand/shallow";

import type { CarouselItem } from "~/components/groups.old/GroupHeaderCarousel";

interface CarouselState {
  // State
  items: CarouselItem[];
  currentSlide: number;
  isEditorOpen: boolean;
  expandedAccordionItem: string | null;

  // Actions
  setItems: (items: CarouselItem[]) => void;
  addItem: (item: CarouselItem) => void;
  updateItem: (id: string, updates: Partial<CarouselItem>) => void;
  removeItem: (id: string) => void;
  reorderItems: (sourceIndex: number, destinationIndex: number) => void;

  setCurrentSlide: (index: number) => void;
  setEditorOpen: (isOpen: boolean) => void;
  setExpandedAccordionItem: (id: string | null) => void;
  syncSlideWithAccordion: (slideIndex: number) => void;

  resetStore: () => void;
}

const useCarouselStore = create<CarouselState>((set, get) => ({
  // Initial state
  items: [],
  currentSlide: 0,
  isEditorOpen: false,
  expandedAccordionItem: null,

  // Actions
  setItems: (items) => {
    // Skip if identical by reference
    if (items === get().items) return;

    // Skip if arrays are equal by shallow comparison
    if (shallow(items, get().items)) return;

    set({ items });
  },

  addItem: (item) => {
    set((state) => {
      // Check if item with this ID already exists
      if (state.items.some((i) => i.id === item.id)) {
        return state;
      }
      return { items: [...state.items, item] };
    });
  },

  updateItem: (id, updates) => {
    set((state) => {
      const index = state.items.findIndex((item) => item.id === id);
      if (index === -1) return state;

      const updatedItems = [...state.items];
      updatedItems[index] = { ...updatedItems[index], ...updates };
      return { items: updatedItems };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const filteredItems = state.items.filter((item) => item.id !== id);
      // Skip if nothing changed
      if (filteredItems.length === state.items.length) return state;
      return { items: filteredItems };
    });
  },

  reorderItems: (sourceIndex, destinationIndex) => {
    set((state) => {
      if (
        sourceIndex < 0 ||
        sourceIndex >= state.items.length ||
        destinationIndex < 0 ||
        destinationIndex >= state.items.length ||
        sourceIndex === destinationIndex
      ) {
        return state;
      }

      const newItems = [...state.items];
      const [removed] = newItems.splice(sourceIndex, 1);
      newItems.splice(destinationIndex, 0, removed);

      return { items: newItems };
    });
  },

  setCurrentSlide: (index) => {
    if (index === get().currentSlide) return;
    set({ currentSlide: index });
  },

  setEditorOpen: (isOpen) => {
    if (isOpen === get().isEditorOpen) return;
    set({ isEditorOpen: isOpen });
  },

  setExpandedAccordionItem: (id) => {
    if (id === get().expandedAccordionItem) return;
    set({ expandedAccordionItem: id });

    // If a valid ID, also update the current slide
    if (id) {
      const index = get().items.findIndex((item) => item.id === id);
      if (index !== -1) {
        get().setCurrentSlide(index);
      }
    }
  },

  syncSlideWithAccordion: (slideIndex) => {
    const { items, expandedAccordionItem } = get();

    // Skip if out of bounds
    if (slideIndex < 0 || slideIndex >= items.length) return;

    // Get the item ID for the slide
    const slideItem = items[slideIndex];
    if (!slideItem) return;

    // Only update if different
    if (slideItem.id !== expandedAccordionItem) {
      set({
        currentSlide: slideIndex,
        expandedAccordionItem: slideItem.id,
      });
    } else if (slideIndex !== get().currentSlide) {
      set({ currentSlide: slideIndex });
    }
  },

  resetStore: () => {
    set({
      items: [],
      currentSlide: 0,
      isEditorOpen: false,
      expandedAccordionItem: null,
    });
  },
}));

export default useCarouselStore;
