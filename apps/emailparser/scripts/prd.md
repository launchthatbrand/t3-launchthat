# Product Requirements Document (PRD)

## Project: Email to Blog Post Parser (`@emailparser`)

### Overview

Build a web application that allows users to parse the content of incoming emails and create structured blog posts. The initial focus is on the frontend UI and state management using Zustand. The app will enable users to select emails, highlight sections, assign them to structured fields, and generate a JSON template for blog post creation.

---

## Goals

- Provide a user-friendly interface for parsing emails and extracting structured data.
- Allow users to select, highlight, and assign sections of email content to custom fields.
- Enable configuration and preview of structured data (JSON) before saving or exporting.
- Persist all UI state using Zustand for a responsive, modern UX.

---

## Features & Requirements

### 1. Email Selection Sidebar (Left)

- **Display a list of incoming emails** (initially, use static data; later, connect to backend).
- **Sample email**: Use `apps/emailparser/docs/sample-email-content.html` as the first selectable email.
- **UI**: Vertical sidebar with email subjects/senders; clicking an email loads its content in the main view.
- **State**: Selected email ID is stored in Zustand.

### 2. Main Content Area (Center)

- **Render the selected email** in a scrollable, styled HTML view.
- **Text Selection & Highlighting**:
  - Users can use the cursor to highlight any section of the email.
  - Highlighted text is visually distinct (e.g., background color).
  - Only one selection at a time is active.
- **Assign to Field**:
  - When text is highlighted, the right sidebar enables the "Add new field" action.
  - On field assignment, the highlight is locked and associated with a field name.
- **Multiple highlights**: Support multiple, non-overlapping highlights per email.

### 3. Structured Data Sidebar (Right)

- **Fields List**:
  - Show all currently defined fields and their associated highlighted text.
  - Allow renaming or removing fields.
- **Add New Field**:
  - When text is highlighted, allow user to add a new field (prompt for field name).
  - Field is added to the list and associated with the highlighted text.
- **Generate Template**:
  - Button to generate and preview the structured JSON object representing all fields.
  - JSON preview is shown in a modal or below the fields list.
- **Design**: Follow the attached image for layout, field controls, and visual style.

### 4. State Management

- **Use Zustand** for all UI state:
  - Selected email
  - List of fields and their associated highlights
  - Current selection/highlight
  - JSON preview modal state
