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

```js
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

```ts
// Inside: src/utils/mod.ts

// Error: cannot use parent traversal to cross into a neighboring module.
import type { DenoConfig } from "../models/deno-config.ts";

// Error: deep-importing bypasses the boundary of the neighboring module (must use barrel file).
import type { DenoConfig } from "@/models/deno-config.ts";
```

#### Correct

```ts
// Inside: src/utils/mod.ts

// Correct: crosses to the neighboring module via its root barrel file.
import type { DenoConfig } from "@/models/mod.ts";

// Correct: internal module navigation uses clean relative paths.
import { resolveAlias } from "./resolve-alias.ts";
```

This rule is **auto-fixable** with `eslint --fix`.

## Project layout

```text
├── doc.go                     # Documentation for main
├── main.go                    # Application entry point
└── internal/                  # Internal application code
    ├── cli/                   # Binds Cobra commands and maps Viper flag schemas.
    ├── config/                # Loads configuration.
    ├── httpx/                 # HTTP response helpers and constants.
    ├── middleware/            # HTTP middleware (auth, cors, static).
    ├── pathsafe/              # Safe file path resolution and validation.
    ├── router/                # HTTP routing definitions and mapping.
    ├── server/                # HTTP server setup and middleware chaining.
    ├── storage/               # File storage management.
    ├── token/                 # HMAC bearer token pool management.
    └── units/                 # Defines file size units.
```

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/name`).
3. Ensure all code passes `deno task lint:fix`.
4. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
