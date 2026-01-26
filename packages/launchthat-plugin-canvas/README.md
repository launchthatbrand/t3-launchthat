# launchthat-plugin-canvas

Node-only utilities for generating PNGs with optional anti-aliased text via `@napi-rs/canvas`.

## Intended usage

- Use from **Convex Node actions** (files that start with `"use node";`).
- This package is **not** designed for browser/client use.

## Convex setup (required per app)

Because `@napi-rs/canvas` is a native dependency, each Convex app that uses it must list it as an external package so Convex does not try to bundle the native binary.

Example `apps/<your-app>/convex.json`:

```json
{
  "functions": "convex",
  "node": {
    "externalPackages": ["@napi-rs/canvas"]
  }
}
```

## Fonts

- Prefers the bundled `assets/fonts/Roboto-Regular.ttf` (no network).
- Falls back to downloading a TTF at runtime if needed.

