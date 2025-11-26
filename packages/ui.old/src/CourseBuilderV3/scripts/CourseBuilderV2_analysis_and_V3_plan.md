# CourseBuilderV2 Analysis & CourseBuilderV3 Planning

## 1. CourseBuilderV2: Architecture & Patterns

### High-Level Structure

- **Component Location:** `packages/ui/src/CourseBuilderV2/`
- **Entry Point:** `index.tsx` exports `CourseBuilderV2` React component
- **Core Responsibilities:**
  - Drag-and-drop course structure editing (lessons, topics, quizzes)
  - Sidebar for available items (lessons, topics, quizzes)
  - Main area for course content tree
  - Final quizzes section
- **State Management:**
  - Local state via hooks (`useCourseData`, `useCourseBuilderDnd`)
  - Context (`CourseDataContext`) for shared state
  - All mutations (add/remove/reorder/rename) are callback-driven, passed as props
- **Type System:**
  - Strongly typed with TypeScript
  - Centralized types in `types/index.ts` (e.g., `LessonWithTopics`, `Quiz`, `CourseBuilderV2Props`)
  - Uses Convex `Doc`/`Id` types for data model alignment
- **UI Patterns:**
  - Shadcn UI and custom components
  - Tailwind CSS for styling
  - DnD Kit for drag-and-drop
  - Accordion for sidebar organization
  - Accessibility: ARIA attributes, keyboard support

### Data Flow & Extensibility

- **Prop-Driven:**
  - All data and mutation logic is passed in via props (no direct data fetching)
  - Enables integration with any backend or state management solution
- **Available Items:**
  - Sidebar receives lists of available lessons, topics, quizzes
  - Drag-and-drop to add to course structure
- **Callbacks:**
  - All mutations (add, remove, reorder, attach, title change) are async callbacks
  - Allows parent app to control data source, persistence, and side effects
- **UI Extensibility:**
  - Components are modular (SortableLesson, SidebarLessonItem, etc.)
  - DropZone and DnD logic are generic and reusable
  - Item rendering (LessonItem, QuizItem) is customizable

### Limitations & Opportunities

- **Tight Coupling to Convex Types:**
  - Uses Convex `Doc`/`Id` types throughout; may limit portability
- **No Direct Data Fetching:**
  - All data must be provided by parent; no built-in API integration
- **UI/UX:**
  - Some placeholder/unfinished components (e.g., EditableTitle)
  - No built-in validation or error boundaries
- **Testing & Storybook:**
  - No evidence of isolated stories or visual regression tests

---

## 2. CourseBuilderV3: Design Goals & Plan

### Core Principles

- **Pure UI/Frontend Focus:**
  - No data fetching or backend logic
  - All data and actions are passed via props
- **Data Source Agnostic:**
  - Accepts any data structure as long as it matches the required shape
  - Parent app is responsible for translating backend data to props
- **Composable & Extensible:**
  - All UI elements are modular and override-friendly
  - Support for custom renderers (e.g., lesson, topic, quiz)
- **TypeScript-First:**
  - Strong, generic types for all props and data models
  - No hard dependency on Convex types (use generics/interfaces)
- **Monorepo-Optimized:**
  - No cross-package data/model imports; only types/interfaces
  - All UI logic and types live in the package
- **Idiomatic React Patterns:**
  - Hooks for local state (e.g., drag state, UI toggles)
  - Context for shared state if needed (but keep minimal)
  - Early returns, accessibility, Tailwind for styling

### Proposed API (V3)

```typescript
<CourseBuilder
  courseStructure={...} // Full tree: lessons, topics, quizzes
  availableLessons={...}
  availableTopics={...}
  availableQuizzes={...}
  onAddLesson={...}
  onAddTopic={...}
  onAddQuiz={...}
  onRemoveLesson={...}
  onRemoveTopic={...}
  onRemoveQuiz={...}
  onReorderItems={...}
  onAttachLesson={...}
  onAttachTopic={...}
  onAttachQuizToTopic={...}
  onAttachQuizToFinal={...}
  renderLessonItem?={...} // Optional custom renderers
  renderTopicItem?={...}
  renderQuizItem?={...}
  ...other UI/UX props
/>
```

### Data Model (V3)

- **Use generic interfaces:**
  - `Lesson`, `Topic`, `Quiz` interfaces (no Convex dependency)
  - Allow parent to extend with custom fields
- **Example:**

```typescript
interface Lesson {
  id: string;
  title: string;
  topics?: Topic[];
  [key: string]: any;
}
interface Topic {
  id: string;
  title: string;
  quizzes?: Quiz[];
  [key: string]: any;
}
interface Quiz {
  id: string;
  title: string;
  [key: string]: any;
}
```

### UI/UX Enhancements

- **Editable fields with validation and accessibility**
- **Improved drag-and-drop feedback**
- **Storybook stories for all components**
- **Dark/light mode support**
- **Error boundaries and loading states**

### Extensibility

- **Custom renderers for all item types**
- **Support for additional item types (e.g., assignments, resources) via generic slots**
- **Theming via Tailwind and CSS variables**

### Monorepo Integration

- **No direct backend or DB imports**
- **All types/interfaces exported for app-level translation**
- **Clear separation between UI and data logic**

---

## 3. Migration & Implementation Plan

1. **Define generic types/interfaces for lessons, topics, quizzes**
2. **Refactor all components to use generic types, not Convex Doc/Id**
3. **Expose all UI as prop-driven, with callbacks for all mutations**
4. **Implement custom renderer slots for lessons, topics, quizzes**
5. **Add Storybook stories for all components**
6. **Document the API and usage patterns**
7. **Test with multiple data sources (Convex, REST, mock data)**

---

## 4. Summary Table: V2 vs V3

| Aspect               | V2                                    | V3 (Planned)                        |
| -------------------- | ------------------------------------- | ----------------------------------- |
| Data Model           | Convex Doc/Id types                   | Generic interfaces, no backend tie  |
| Data Source          | Parent-provided, Convex-centric       | Parent-provided, any source         |
| UI Extensibility     | Modular, but limited custom renderers | Fully composable, custom renderers  |
| DnD                  | DnD Kit, prop-driven                  | DnD Kit, prop-driven                |
| State Management     | Local state/hooks, context            | Local state/hooks, minimal context  |
| Storybook/Testing    | Not present                           | Required for all components         |
| Theming              | Tailwind, some custom classes         | Tailwind, CSS vars, dark/light mode |
| Accessibility        | Good, but can improve                 | First-class, with validation        |
| Monorepo Integration | Imports Convex types from apps        | No cross-app imports, UI-only       |

---

## 5. Next Steps

- Finalize generic type definitions
- Draft initial CourseBuilderV3 component API
- Scaffold Storybook and test harnesses
- Begin incremental refactor/implementation
