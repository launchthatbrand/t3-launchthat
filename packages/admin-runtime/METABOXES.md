---
description: Working with admin-runtime meta boxes using a WordPress-style workflow
---

# Admin Runtime Meta Boxes

The admin runtime mirrors the familiar WordPress pattern:

1. **Register a meta box** with `registerMetaBoxHook(location, hook)`.
2. **Render any UI** you need inside that box (plain HTML, React, repeaters, etc.).
3. **Collect values on save** and persist them to your storage layer.

This document shows how the new runtime utilities map to the classic `add_meta_box` + `save_post` workflow.

## Lifecycle Overview

| WordPress concept                    | Admin runtime equivalent                                         |
| ------------------------------------ | ---------------------------------------------------------------- |
| `add_meta_box`                       | `registerMetaBoxHook("main" \| "sidebar", hook)`                 |
| `$post` passed to callback           | `context.post`, `context.postType`, `context.organizationId`     |
| Raw HTML inside the callback         | Any React tree returned from the hook                            |
| `save_post` hook                     | `context.registerBeforeSave(handler)` for side effects           |
| `get_post_meta` / `update_post_meta` | `context.getMetaValue(key)` / `context.setMetaValue(key, value)` |
| Returning custom meta payload        | `context.registerMetaPayloadCollector(() => ({ key: value }))`   |
| Enqueuing scripts/styles             | `context.enqueueScript(node)` / `context.enqueueStyle(node)`     |

## Collecting Meta Values

```tsx
registerMetaBoxHook("main", (context) => ({
  id: "my-meta-box",
  title: "Checkout Details",
  location: "main",
  render: () => {
    const [coupon, setCoupon] = useState(
      (context.getMetaValue?.("order:coupon") as string) ?? "",
    );

    useEffect(() => {
      return context.registerMetaPayloadCollector?.(() => ({
        "order:coupon": coupon,
      }));
    }, [coupon]);

    return (
      <MetaBoxFieldset title="Coupon">
        <Input value={coupon} onChange={(event) => setCoupon(event.target.value)} />
      </MetaBoxFieldset>
    );
  },
}));
```

- `registerMetaPayloadCollector` feeds directly into the global meta payload that `AdminSinglePostView` saves.
- `setMetaValue` mutates the shared custom-field state so other boxes/fields can read the updated value immediately.

## Side Effects Before Save

Need to call a Convex mutation or sync an external system right before the host saves the post?

```tsx
useEffect(() => {
  return context.registerBeforeSave?.(async () => {
    await updateCommerceTotalsMutation();
  });
}, [updateCommerceTotalsMutation]);
```

Handlers run in order whenever the editor clicks the “Save” button in the Actions meta box.

## Layout Helpers

The runtime now provides lightweight components for the classic WP look:

- `MetaBoxTable` + `MetaBoxTableRow` – render fields with label/description cells.
- `MetaBoxColumns` – simple flex-based column layout.
- `MetaBoxFieldset` – bordered sections with title/description/action slots.

Because the meta box body is just React, you can still use your own design system or Tailwind utilities alongside these helpers.

## Custom Assets

If a meta box needs extra JS or CSS (for a color picker, repeaters, etc.), enqueue them once per page:

```tsx
useEffect(() => {
  if (!context.enqueueScript) return;
  return context.enqueueScript(<script src="/admin/widgets/repeater.js" />);
}, [context.enqueueScript]);
```

Scripts/styles render after the main layout, mirroring `admin_enqueue_scripts`.

## Summary

- Register boxes wherever you need them (`main` or `sidebar`).
- Render any UI and manage local state inside the returned React node.
- Use the helper hooks/functions to read/write meta keys, emit extra payload, or run side effects before the global save.
- Optional layout utilities and asset enqueuing bring the ergonomics close to the WordPress experience while staying in React.

