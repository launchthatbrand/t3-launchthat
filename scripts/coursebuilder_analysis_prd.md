# CourseBuilder System Analysis & Improvement PRD

## Executive Summary

The CourseBuilder V3 system is experiencing critical issues with lesson persistence and state management that prevent effective course structure creation. Through comprehensive analysis of the codebase, I've identified fundamental architectural problems that need systematic resolution.

## Problem Analysis

### Root Cause: State Management Disconnect

The primary issue is a disconnection between the frontend state (Zustand store) and backend persistence (Convex database). When lessons are dragged into the builder:

1. **Frontend State Updates**: The Zustand store correctly adds lessons to `mainContentItems`
2. **Backend Attachment**: The `attachToCourse` mutation properly sets `courseId` and `order` on lessons
3. **State Synchronization Failure**: The frontend doesn't reflect backend changes, causing visual disappearance
4. **Save Logic Mismatch**: Save functionality reads from transformed data that doesn't match the store state

### Key Issues Identified

1. **Dual State Sources**:

   - Frontend: `useCourseBuilderStore` manages UI state
   - Backend: Course `courseStructure` array + lesson `courseId` fields
   - No proper synchronization between them

2. **Data Transformation Problems**:

   - `transformCourseData` only reads from `courseStructure` array
   - Ignores lessons attached via `courseId` but not in structure
   - Creates empty sections when structure is empty

3. **Inconsistent Save Logic**:

   - Save reads from transformed course data (backend state)
   - But user interactions modify store state (frontend state)
   - No bridge between the two

4. **Type System Conflicts**:

   - Store types (`Lesson`, `Topic`, `Quiz`) differ from Convex types
   - Transformation layer has type mismatches
   - Runtime errors from type incompatibilities

5. **DND Implementation Issues**:
   - `onAttachLesson` callback executes but doesn't update store
   - Store state remains stale after backend updates
   - No refresh mechanism post-attachment

## Success Criteria

- Lessons persist visually after drag and drop
- Save functionality preserves complete course structure
- Real-time state synchronization between frontend/backend
- Type-safe operations throughout the system
- Reliable state management with proper error handling

---

## Task Breakdown

### Task 1: Implement Unified State Management Architecture

**Priority**: High  
**Complexity**: 8/10  
**Dependencies**: None

**Description**:
Redesign the state management to eliminate the frontend/backend state disconnect. Implement a single source of truth with proper synchronization mechanisms.

**Implementation Details**:

- Replace dual state system with unified reactive state management
- Use Convex's real-time subscriptions to keep frontend in sync
- Implement optimistic updates with rollback on failure
- Add state synchronization hooks throughout the component lifecycle

**Acceptance Criteria**:

- Single state source for course structure
- Real-time updates reflected in UI immediately
- Optimistic updates with proper error handling
- No visual disappearance of dragged items

**Test Strategy**:

- Unit tests for state synchronization logic
- Integration tests for drag-and-drop with persistence
- End-to-end tests for complete course building workflow

---

### Task 2: Refactor Data Layer and Type System

**Priority**: High  
**Complexity**: 7/10  
**Dependencies**: Task 1

**Description**:
Unify the type system and data transformation layer to eliminate type conflicts and ensure consistent data flow between components.

**Implementation Details**:

- Create unified type definitions shared between store and Convex
- Refactor transformation functions to handle both attachment methods
- Implement proper type guards and validation
- Add comprehensive error handling for data operations

**Acceptance Criteria**:

- Single set of type definitions for course entities
- Type-safe transformations without runtime errors
- Proper handling of both `courseStructure` and `courseId` attachment methods
- Comprehensive error boundaries with user-friendly messages

**Test Strategy**:

- Type checking in CI/CD pipeline
- Unit tests for all transformation functions
- Property-based testing for type safety
- Error scenario testing with invalid data

---

### Task 3: Redesign Drag-and-Drop System with Immediate Persistence

**Priority**: Medium  
**Complexity**: 6/10  
**Dependencies**: Tasks 1, 2

**Description**:
Rebuild the drag-and-drop system to provide immediate visual feedback with reliable backend persistence and proper error handling.

**Implementation Details**:

- Implement optimistic updates for immediate visual feedback
- Add proper loading states during backend operations
- Implement rollback mechanisms for failed operations
- Add visual indicators for operation status (saving, saved, error)

**Acceptance Criteria**:

- Immediate visual feedback on drag-and-drop operations
- Clear loading states during persistence operations
- Automatic rollback on backend failures
- User-friendly error messages with retry options

**Test Strategy**:

- Visual regression testing for drag-and-drop interactions
- Network failure simulation for error handling
- Performance testing for large course structures
- Accessibility testing for keyboard navigation

---

### Task 4: Implement Real-time Collaborative Features

**Priority**: Medium  
**Complexity**: 7/10  
**Dependencies**: Tasks 1, 2, 3

**Description**:
Add real-time collaborative editing capabilities to allow multiple users to work on course structures simultaneously with conflict resolution.

**Implementation Details**:

- Implement operational transformation for concurrent edits
- Add real-time presence indicators for active editors
- Create conflict resolution UI for simultaneous modifications
- Implement change attribution and activity feeds

**Acceptance Criteria**:

- Multiple users can edit course structure simultaneously
- Real-time updates visible to all editors
- Conflict resolution for competing changes
- Activity log showing who made what changes

**Test Strategy**:

- Multi-user testing with concurrent operations
- Conflict scenario testing with edge cases
- Network partition testing for consistency
- Performance testing with multiple active users

---

### Task 5: Add Advanced Course Structure Management

**Priority**: Low  
**Complexity**: 5/10  
**Dependencies**: Tasks 1, 2, 3

**Description**:
Implement advanced features for course structure management including bulk operations, templates, versioning, and enhanced UX improvements.

**Implementation Details**:

- Add bulk selection and operations (move, delete, duplicate)
- Implement course structure templates and presets
- Add version history with restore capabilities
- Create enhanced search and filtering for large courses
- Implement keyboard shortcuts and accessibility improvements

**Acceptance Criteria**:

- Bulk operations for efficient course management
- Template system for rapid course creation
- Version history with point-in-time restore
- Comprehensive keyboard navigation support
- Advanced search and filtering capabilities

**Test Strategy**:

- Bulk operation testing with large datasets
- Template system validation with various structures
- Version control testing with complex histories
- Accessibility compliance testing (WCAG 2.1 AA)
- Performance testing with large course structures

---

## Technical Architecture

### State Management Flow

```
User Action → Store Update (Optimistic) → Backend Mutation → Convex Subscription → Store Sync
```

### Data Flow Architecture

```
CourseBuilder Component
├── Unified State Hook (useUnifiedCourseState)
├── Real-time Subscriptions (Convex)
├── Optimistic Update Layer
└── Error Boundary & Recovery
```

### Type System Hierarchy

```
Core Types (shared)
├── Course Entity Types
├── Lesson Entity Types
├── Topic Entity Types
├── Quiz Entity Types
└── Operation Result Types
```

## Implementation Timeline

- **Week 1-2**: Task 1 - Unified State Management
- **Week 3-4**: Task 2 - Data Layer & Types Refactor
- **Week 5**: Task 3 - Drag-and-Drop Redesign
- **Week 6-7**: Task 4 - Real-time Collaboration
- **Week 8**: Task 5 - Advanced Features

## Risk Mitigation

1. **Breaking Changes**: Implement feature flags for gradual rollout
2. **Data Migration**: Create migration scripts for existing course structures
3. **Performance**: Implement virtualization for large course structures
4. **Browser Compatibility**: Ensure drag-and-drop works across all target browsers

## Success Metrics

- **Reliability**: 99.9% success rate for drag-and-drop operations
- **Performance**: <100ms response time for state updates
- **User Experience**: <2 clicks for common operations
- **Collaboration**: Support for 10+ concurrent editors per course
