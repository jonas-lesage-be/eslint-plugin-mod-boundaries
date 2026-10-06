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
├── .github/
│   └── workflows/                    # GitHub Actions for automated CI/CD deployment pipelines.
├── .vscode/                          # VSCode workspace config.
├── scripts/
│   └── build_npm.ts                  # Compilation script to publish the npm package.
├── src/
│   ├── models/                       # Directory containing TypeScript interfaces and types.
│   ├── rules/                        # Directory containing the core ESLint rules.
│   │   ├── enforce-mod-boundaries.ts # The primary logic for enforcing module boundaries.
│   └── mod.ts                        # Barrel file that re-exports all modules in the `src` directory for simplified imports.
├── .gitignore                        # Specifies intentionally untracked files that Git should ignore.
├── LICENSE                           # The license file.
├── README.md                         # Project documentation, installation guides, and rules usage.
├── deno.json                         # Deno config file specifying imports, tasks, and other settings.
├── deno.lock                         # Deno lock file ensuring consistent dependency versions across environments.
├── eslint.config.js                  # ESLint config file.
├── prettier.config.ts                # Prettier config file for automated code formatting styles.
└── tsconfig.eslint.json              # TypeScript config for ESLint.
```

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/name`).
3. Ensure all code passes `deno task lint:fix`.
4. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
