# Zustand Store Architecture

This directory contains the Zustand state management stores for the portal application. This README provides guidelines for using and extending the stores consistently.

## Store Structure

### File Organization

- Each store is in its own file with a consistent naming pattern: `use<StoreName>Store.ts`
- All stores are re-exported from `index.ts` for centralized imports
- Related types and interfaces are also exported from the store files

### Import Pattern

Always import stores and their types from the central export:

```typescript
// ✅ Good import pattern
import { useEditorStore, type TextFormatting } from "@/src/store";

// ❌ Avoid direct imports
import { useEditorStore } from "@/src/store/useEditorStore";
```

## Implementation Guidelines

Each store should follow these implementation patterns:

### 1. State and Action Type Definition

```typescript
interface StoreState {
  // State properties
  someValue: string;
  someArray: SomeType[];

  // Actions
  setValue: (value: string) => void;
  addItem: (item: SomeType) => void;
  removeItem: (id: string) => void;
}
```

### 2. Store Implementation

```typescript
export const useSomeStore = create<StoreState>((set, get) => ({
  // Initial state
  someValue: "",
  someArray: [],

  // Actions
  setValue: (value) => {
    // Skip if identical
    if (value === get().someValue) return;
    set({ someValue: value });
  },

  addItem: (item) => {
    set((state) => {
      // Skip if item already exists
      if (state.someArray.some((i) => i.id === item.id)) return state;
      return { someArray: [...state.someArray, item] };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const filtered = state.someArray.filter((item) => item.id !== id);
      // Skip if nothing changed
      if (filtered.length === state.someArray.length) return state;
      return { someArray: filtered };
    });
  },
}));
```

### 3. Performance Optimizations

Always include these optimizations:

1. **Skip Identical Updates**: Check if the new value is identical to the current value before updating
2. **Use Shallow Comparisons**: For arrays and objects, use `shallow` from Zustand
3. **Immutable Updates**: Always create new objects/arrays when updating state
4. **Return State When No Change**: When using set with a function, return the current state if no changes are needed

Example:

```typescript
import { shallow } from 'zustand/shallow';

// Using shallow comparison
setItems: (items) => {
  if (shallow(items, get().items)) return;
  set({ items });
},

// Returning state when no change
updateItem: (id, update) => {
  set((state) => {
    const itemIndex = state.items.findIndex(item => item.id === id);
    if (itemIndex === -1) return state; // No change

    const newItems = [...state.items];
    newItems[itemIndex] = { ...newItems[itemIndex], ...update };
    return { items: newItems };
  });
}
```

## Available Stores

| Store Name             | Purpose                           | Main Components                        |
| ---------------------- | --------------------------------- | -------------------------------------- |
| `useCarouselStore`     | Manages carousel components state | GroupHeaderCarousel, GroupHeaderEditor |
| `useCheckoutStore`     | Manages checkout flow state       | CheckoutFlow and checkout steps        |
| `useNotificationStore` | Manages notification state        | Notification components                |
| `useEditorStore`       | Manages rich text editor state    | Editor components                      |
| `useSocialStore`       | Manages social feed state         | Feed and social components             |

## Adding New Stores

When adding a new store:

1. Create a new file following the naming convention `use<Name>Store.ts`
2. Define the store following the patterns above
3. Add the export to `index.ts`
4. Document the store in this README

## Example Store Usage

```typescript
import { useEditorStore } from '@/src/store';

const MyComponent = () => {
  // Use individual state values from the store
  const {
    isBold,
    isItalic
  } = useEditorStore(
    (state) => ({
      isBold: state.textFormatting.isBold,
      isItalic: state.textFormatting.isItalic
    }),
    shallow // Prevents re-renders when unrelated state changes
  );

  // Get actions directly
  const { toggleFormat } = useEditorStore();

  return (
    <div>
      <button onClick={() => toggleFormat('isBold')}>
        Bold: {isBold ? 'On' : 'Off'}
      </button>
      <button onClick={() => toggleFormat('isItalic')}>
        Italic: {isItalic ? 'On' : 'Off'}
      </button>
    </div>
  );
};
```
