# Hybrid Navigation Architecture

This document explains the new hybrid navigation system that supports both server-side and client-side navigation patterns with plugin extensibility.

## 🎯 **Core Philosophy**

The system recognizes that different types of admin interfaces require different navigation patterns:

- **Section-Level Navigation** (Store, Users, Content): Best served by server-side routing with full page reloads
- **Entity-Level Navigation** (Order Details, Product Edit): Best served by client-side tabs for fast, stateful interactions

## 🏗️ **Architecture Overview**

### **1. Navigation Context Detection**

The system automatically detects the appropriate navigation context:

```typescript
// URL: /admin/store/orders → SECTION_LEVEL (server navigation)
// URL: /admin/store/orders/ABC123 → ENTITY_LEVEL (client navigation)
```

### **2. Dual Tab Configuration**

Tabs are configured differently based on context:

```typescript
// Section-level tabs (server navigation)
const STORE_TABS: TabConfig[] = [
  { value: "orders", label: "Orders", href: "/admin/store/orders" },
  // ... more tabs
];

// Entity-level tabs (client navigation)
const ORDER_TABS: TabConfig[] = [
  { value: "details", label: "Order Details", onClick: "#details" },
  // ... more tabs
];
```

### **3. Component Architecture**

```
AdminLayout (Context Provider)
├── AdminLayoutHeader (Unified Tab Renderer)
├── AdminLayoutContent (Content Wrapper)
└── Client Content (Entity-Level Only)
    ├── AllSectionsRenderer (Tab Content Switcher)
    └── Individual Sections (Order Details, Media, etc.)
```

## 📂 **File Structure**

```
src/components/admin/
├── NavigationContext.tsx       # Context system & plugin registry
├── AdminLayout.tsx             # Unified layout components
├── ClientContentRenderer.tsx   # Client-side content switching
├── AdminSinglePostLayout.tsx   # Existing entity editing components
└── plugins/
    └── ExamplePlugin.tsx       # Plugin registration examples
```

## 🚀 **Usage Examples**

### **Section-Level Layout (Server Navigation)**

```typescript
// apps/portal/src/app/(root)/(admin)/admin/store/layout.tsx
export default function StoreLayout({ children }) {
  return (
    <AdminLayout
      title="Store Management"
      tabs={STORE_TABS} // Server navigation tabs
      pathname={pathname}
    >
      <AdminLayoutHeader />
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminLayout>
  );
}
```

### **Entity-Level Page (Client Navigation)**

```typescript
// apps/portal/src/app/(root)/(admin)/admin/store/orders/[orderId]/page.tsx
export default function OrderPage() {
  return (
    <AllSectionsRenderer defaultSection="details">
      <div data-section="details">
        <OrderForm />
      </div>
      <div data-section="media">
        <MediaUpload />
      </div>
      {/* More sections... */}
    </AllSectionsRenderer>
  );
}
```

## 🔌 **Plugin System**

### **Plugin Registration**

```typescript
// Register entity-level plugin
PluginRegistry.register({
  id: "order-settings",
  entity: "order", // Appears on order detail pages
  tab: {
    value: "settings",
    label: "Settings",
    onClick: "#settings",
    navigationContext: NavigationContext.ENTITY_LEVEL,
  },
  component: OrderSettingsComponent,
  priority: 5,
});

// Register section-level plugin
PluginRegistry.register({
  id: "store-analytics",
  section: "store", // Appears in store navigation
  tab: {
    value: "analytics",
    label: "Analytics",
    href: "/admin/store/analytics",
    navigationContext: NavigationContext.SECTION_LEVEL,
  },
  component: StoreAnalyticsComponent,
  priority: 10,
});
```

### **Plugin Component Structure**

```typescript
const MyPlugin: React.ComponentType<unknown> = () => {
  return (
    <div>
      <h3>My Plugin Content</h3>
      <p>This content appears when the plugin tab is active.</p>
    </div>
  );
};
```

## ⚡ **Navigation Modes**

### **Server Navigation (Section-Level)**

- **When**: Navigating between different admin sections
- **How**: Uses Next.js `<Link>` components with `href`
- **Benefits**: SEO-friendly, browser back/forward, fresh data
- **Example**: Store → Users → Content

### **Client Navigation (Entity-Level)**

- **When**: Working within a specific entity (order, product, user)
- **How**: Uses hash-based navigation with JavaScript
- **Benefits**: Fast switching, maintains form state, no network requests
- **Example**: Order Details → Media → Payment → History

## 🎛️ **Tab Configuration Options**

```typescript
interface TabConfig {
  value: string; // Unique tab identifier
  label: string; // Display text
  href?: string; // Server navigation URL
  onClick?: string | (() => void); // Client navigation handler
  icon?: React.ComponentType; // Optional icon component
  disabled?: boolean; // Tab state
  navigationContext?: NavigationContext; // Plugin context hint
}
```

## 🔄 **Data Flow**

### **Section-Level Flow**

1. User clicks tab → Next.js navigation → Full page reload → New data fetch

### **Entity-Level Flow**

1. User clicks tab → Hash change → Content section switches → State preserved

### **Plugin Integration Flow**

1. Plugin registers → Context detection → Tab appears → Content renders on activation

## 🎨 **Styling & Layout**

The system maintains consistent styling across navigation modes:

- **Unified Header**: Same design for both navigation types
- **Responsive Tabs**: Automatically adapts to content
- **Plugin Integration**: Seamless visual integration
- **State Indicators**: Active tab highlighting works across modes

## 🎨 **Sidebar Layout Support**

The AdminLayout now supports sidebar layouts similar to AdminSinglePostLayout:

### **Basic Usage**

```typescript
import {
  AdminLayout,
  AdminLayoutHeader,
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";

export default function MyAdminPage() {
  return (
    <AdminLayout
      title="My Page"
      description="Page with sidebar"
      showTabs={true}
      tabs={MY_TABS}
    >
      <AdminLayoutHeader />
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain>
          {/* Main content goes here */}
          <h1>Main Content</h1>
          <p>This is the main content area</p>
        </AdminLayoutMain>

        <AdminLayoutSidebar>
          {/* Sidebar content goes here */}
          <Card>
            <CardHeader>
              <CardTitle>Sidebar</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Sidebar content</p>
            </CardContent>
          </Card>
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
```

### **Layout Structure**

- **AdminLayoutContent** with `withSidebar={true}`: Creates 4-column grid
- **AdminLayoutMain**: Takes 3 columns (`md:col-span-3`) with Card wrapper
- **AdminLayoutSidebar**: Takes 1 column (`md:col-span-1`)

### **Without Sidebar (Default)**

```typescript
<AdminLayoutContent>
  {/* Full-width content */}
  <div>Single column content</div>
</AdminLayoutContent>
```

### **Responsive Behavior**

- **Desktop**: Main content (75%) + Sidebar (25%)
- **Mobile**: Stacked vertically (sidebar below main content)

## 🔧 **Implementation Benefits**

### **For Developers**

- **Consistent API**: Same components work for both navigation types
- **Automatic Detection**: System chooses appropriate navigation automatically
- **Plugin Ready**: Easy to extend with new functionality
- **Type Safe**: Full TypeScript support throughout

### **For Users**

- **Intuitive Navigation**: Familiar patterns that feel natural
- **Fast Entity Editing**: No delays when switching between order sections
- **Reliable Section Navigation**: Proper URLs for bookmarking and sharing
- **Extensible**: Plugins can add new functionality seamlessly

## 🔍 **Debug Features**

In development mode, the system shows navigation context information:

```typescript
// Shows current navigation context in AdminLayoutHeader
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-muted-foreground">
    Navigation: {navigationContext}
  </div>
)}
```

## 🚦 **Migration Guide**

### **From Pure Server Navigation**

1. Keep existing `layout.tsx` files
2. Update to use `AdminLayout` components
3. Add `pathname` prop for auto-detection

### **From Pure Client Navigation**

1. Extract section-level tabs to use `href`
2. Keep entity-level tabs with `onClick`
3. Wrap content with `AllSectionsRenderer`

### **Adding Plugins**

1. Create plugin component
2. Register with `PluginRegistry`
3. Specify appropriate navigation context
4. Plugin appears automatically in correct locations

## 🎯 **Best Practices**

### **When to Use Server Navigation**

- Different admin sections (Store, Users, Content)
- SEO-important pages
- When fresh data is always needed
- Cross-cutting navigation

### **When to Use Client Navigation**

- Entity detail pages (Order, Product, User details)
- Form-heavy interfaces where state matters
- When switching should be instant
- Related content sections

### **Plugin Development**

- Always specify `navigationContext` for clarity
- Use meaningful `priority` values for ordering
- Create self-contained components
- Handle loading and error states

## 🔮 **Future Enhancements**

- **Smart Preloading**: Preload adjacent tab content
- **State Persistence**: Remember tab preferences per user
- **Advanced Plugins**: Plugin-to-plugin communication
- **Analytics Integration**: Track navigation patterns
- **Performance Monitoring**: Measure navigation performance

This hybrid architecture provides the foundation for a scalable, extensible admin interface that adapts to different use cases while maintaining consistency and performance.
