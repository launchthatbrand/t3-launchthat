# Standardized Drag and Drop Implementation

This document provides guidelines and patterns for implementing consistent drag and drop functionality across all transformation components.

## Overview

The transformation system uses `@dnd-kit` as its foundation for drag and drop operations. To ensure consistency, accessibility, and maintainability, we've established standardized components and utilities that should be used when implementing drag and drop interfaces.

## Core Components

### 1. Standardized Utilities (`dndUtils.ts`)

The core utilities file provides shared functions, types, and constants for all drag and drop operations:

- **Common data types** for drag operations
- **Accessibility attributes** for draggable and droppable elements
- **Standardized sensors** with consistent activation constraints
- **Type compatibility** functions
- **Visual feedback styles** with consistent appearance
- **Helper functions** for extracting data from drag events

### 2. Accessible Draggable Field (`AccessibleDraggableField.tsx`)

An enhanced version of `DraggableField` that includes:

- Keyboard navigation support
- Proper ARIA attributes
- Screen reader announcements
- Consistent visual feedback
- Type-based styling

### 3. Accessible Droppable Zone (`AccessibleDroppableZone.tsx`)

An enhanced version of `DroppableZone` that includes:

- Keyboard interaction for dropping
- Validation feedback
- Compatibility checking
- Screen reader announcements
- Accessible error and warning indicators

## Implementation Guidelines

### Data Structure

Always use the standard data structure for drag operations:

```typescript
{
  type: "field" | "transformation" | "mapping",
  field?: FieldItem,
  transformation?: TransformationItem,
  mapping?: MappingItem,
  // Additional properties as needed
}
```

### Sensor Configuration

Always use the standard sensor configuration:

```typescript
const sensors = useStandardSensors();

// In your DndContext
<DndContext sensors={sensors} modifiers={standardModifiers}>
  {/* Your content */}
</DndContext>
```

### Visual Feedback

Use the standard visual feedback styles:

```typescript
import { dragVisualStyles, dropVisualStyles } from "./dndUtils";

// For draggable elements
<div className={cn(
  "base-styles",
  isDragging && dragVisualStyles.dragging,
  isDisabled && dragVisualStyles.disabled
)}>
  {/* Content */}
</div>

// For droppable elements
<div className={cn(
  "base-styles",
  isValidDrop && dropVisualStyles.valid,
  isInvalidDrop && dropVisualStyles.invalid,
  isDisabled && dropVisualStyles.disabled
)}>
  {/* Content */}
</div>
```

### Accessibility Requirements

All drag and drop components must:

1. Be keyboard navigable (tab, enter, space, escape)
2. Include proper ARIA attributes
3. Provide screen reader feedback
4. Support focus management
5. Use sufficient color contrast for state indicators
6. Include text alternatives for icons and visual cues

## Testing

A dedicated test page is available at `/test/transformations/a11y-test` to demonstrate and verify accessible drag and drop functionality. This page showcases:

- Keyboard navigation
- Screen reader support
- ARIA attributes
- Visual feedback
- Focus management

## Component Integration

When integrating these components into a larger system:

1. **Always** use `AccessibleDraggableField` instead of `DraggableField`
2. **Always** use `AccessibleDroppableZone` instead of `DroppableZone`
3. **Always** use the standard data structures from `dndUtils.ts`
4. **Always** use `useStandardSensors()` for consistent sensor behavior
5. **Always** include proper accessibility attributes
6. **Always** test keyboard navigation and screen reader feedback

## Animation Timings

To ensure a consistent feel across the application, use the standard animation durations:

```typescript
import { animationDurations } from "./dndUtils";

// In your styles
const styles = {
  transition: `transform ${animationDurations.drag}ms, opacity ${animationDurations.drag}ms`,
};
```

## Performance Considerations

- Use the standard modifiers like `restrictToWindowEdges` to avoid layout shifts
- Don't add unnecessary event listeners to draggable elements
- Only render draggable components that are visible in the viewport
- Consider using virtualization for large lists of draggable items

## Extending the System

When adding new drag and drop capabilities:

1. First check if existing components can be adapted
2. If not, create new components that follow the same patterns
3. Add any new utility functions to `dndUtils.ts`
4. Document any changes or additions
5. Update tests to verify new functionality

## Troubleshooting

Common issues and solutions:

- **Keyboard navigation not working:** Ensure tabIndex and keyboard event handlers are properly set
- **Screen reader announcements missing:** Check aria-live regions and announcements
- **Visual feedback inconsistent:** Use the standard visual styles from dndUtils.ts
- **Drop zones not accepting items:** Verify type compatibility logic and acceptTypes configuration
- **Performance issues:** Check for unnecessary re-renders or excessive DOM operations
