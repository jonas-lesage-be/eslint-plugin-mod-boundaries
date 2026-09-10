import { build, emptyDir } from "@deno/dnt";
import { logger } from "@/utils/logger.ts";

await emptyDir("./npm");

const version = Deno.args[0];
if (!version) {
  logger.error("Version argument is required. Usage: deno run -A scripts/build_npm.ts <version>");
  Deno.exit(1);
}

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  package: {
    name: "eslint-plugin-mod-boundaries",
    version,
    description: "An ESLint plugin to enforce module boundaries using module files.",
    license: "MIT",
  },
  postBuild() {
    Deno.copyFileSync("README.md", "npm/README.md");
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
  },
});
