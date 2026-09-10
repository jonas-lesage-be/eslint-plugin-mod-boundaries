# eslint-plugin-mod-boundaries

ESLint plugin that enforces strict **module encapsulation** through barrel files (`mod.ts`/`mod.js`).

It automatically rewrites messy parent imports (`../../`) into clean alias paths (`@/`) while preserving standard local imports (`./`).

## Import rules

This rule enforces a strict boundary logic based on your location in the folder tree:

- **Neighboring modules ➔ Use `@/`**: You are not allowed to use parent traversal (`../..`) to reach into another module. Crossing over to a different parent or sibling module _must_ go through the configured root alias.
- **Current module or subdirectories ➔ Use `./`**: When referencing boundaries within the current tree of the module or starting from the root ancestor, clean relative paths are enforced.

## Installation

```bash
# deno
deno add npm:eslint-plugin-mod-boundaries
# npm
npm install --save-dev eslint-plugin-mod-boundaries
```

## Configuration

The plugin automatically detects your alias settings from **`deno.json`** (looking for the `"@/"` import map). Alternatively, you can override this in your ESLint settings.

### Flat config (`eslint.config.js`)

Using the built-in `recommended` preset is the easiest way to get started:

```javascript
import modBoundaries from "eslint-plugin-mod-boundaries";

export default [
  ...modBoundaries.configs.recommended,
  {
    // Optional: Explicitly override settings if not using deno.json
    settings: {
      modBoundaries: {
        alias: "@/",
        aliasPath: "./src",
      },
    },
  },
];
```

## Rule details

### `mod-boundaries/enforce-mod-boundaries`

This rule analyzes the structural distance between the importing file and the target file and ensures it uses the correct barrel file (`mod.ts`/`mod.js`).

#### Incorrect

```typescript
// Inside: src/utils/mod.ts

// Error: cannot use parent traversal to cross into a neighboring module.
import type { DenoConfig } from "../models/deno-config.ts";

// Error: deep-importing bypasses the boundary of the neighboring module (must use barrel file).
import type { DenoConfig } from "@/models/deno-config.ts";
```

#### Correct

```typescript
// Inside: src/utils/mod.ts

// Correct: crosses to the neighboring module via its root barrel file.
import type { DenoConfig } from "@/models/mod.ts";

// Correct: internal module navigation uses clean relative paths.
import { resolveAlias } from "./resolve-alias.ts";
```

This rule is **auto-fixable** with `eslint --fix`.
