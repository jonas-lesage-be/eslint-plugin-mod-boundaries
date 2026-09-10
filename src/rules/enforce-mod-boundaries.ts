import { existsSync } from "node:fs";
import path from "node:path";

import type { Rule } from "eslint";
import type { ImportDeclaration } from "estree";

import type { BoundaryInfo } from "@/models/mod.ts";
import { resolveAlias } from "@/utils/mod.ts";

const MOD_FILE_CANDIDATES = ["mod.ts", "mod.js"];

/**
 * Picks whichever barrel file actually exists in a directory ("mod.ts" or "mod.js"),
 * falling back to a normalized default (.ts or .js) based on the environment.
 * @param dirAbsolute - Absolute path to the directory being inspected.
 * @param fileExt - The file extension of the current file.
 * @returns The resolved mod filename.
 */
function resolveModFileName(dirAbsolute: string, fileExt = ".ts"): string {
  for (const candidate of MOD_FILE_CANDIDATES) {
    if (existsSync(path.join(dirAbsolute, candidate))) {
      return candidate;
    }
  }
  const fallbackExt = fileExt.includes("js") ? ".js" : ".ts";
  return `mod${fallbackExt}`;
}

/**
 * Checks if a given file path points to a valid mod file.
 * @param filePath - Path to the file being checked.
 * @returns True if the path ends with a valid candidate name.
 */
function isModFile(filePath: string): boolean {
  return MOD_FILE_CANDIDATES.some((name) => filePath.endsWith(name));
}

/**
 * Resolves an import specifier to an absolute path, whether relative or aliased.
 * @param importSource - The literal import path string from the source code.
 * @param currentDirAbsolute - Absolute directory path of the importing file.
 * @param rootDir - Root directory of the project.
 * @param alias - The path alias prefix configuration or null.
 * @param aliasTarget - The real target path of the alias or null.
 * @returns The fully resolved absolute target path.
 */
function resolveImportTarget(
  importSource: string,
  currentDirAbsolute: string,
  rootDir: string,
  alias: string | null,
  aliasTarget: string | null,
): string {
  if (alias && aliasTarget && importSource.startsWith(alias)) {
    const relativeFromAlias = importSource.slice(alias.length);
    return path.resolve(rootDir, aliasTarget, relativeFromAlias);
  }
  return path.resolve(currentDirAbsolute, importSource);
}

/**
 * Describes how the current file directory and the target directory relate.
 * @param currentDirAbsolute - Absolute path of the importing directory.
 * @param targetDirAbsolute - Absolute path of the target directory.
 * @returns - Metrics describing the structural relationship.
 */
function getBoundaryInfo(currentDirAbsolute: string, targetDirAbsolute: string): BoundaryInfo {
  const currentSegments = getPathSegments(currentDirAbsolute);
  const targetSegments = getPathSegments(targetDirAbsolute);

  let commonDepth = 0;
  while (
    commonDepth < currentSegments.length &&
    commonDepth < targetSegments.length &&
    currentSegments[commonDepth] === targetSegments[commonDepth]
  ) {
    commonDepth++;
  }

  const currentDepthFromSplit = currentSegments.length - commonDepth;
  const targetDepthFromSplit = targetSegments.length - commonDepth;

  return {
    commonDepth,
    currentDepthFromSplit,
    targetDepthFromSplit,
    isSiblingFolder: currentDepthFromSplit === 1 && targetDepthFromSplit === 1,
    isCurrentAtCommonAncestor: currentDepthFromSplit === 0,
  };
}

/**
 * Splits a normalized absolute path into segments.
 * @param p - The absolute path to split.
 * @returns An array of path segments, with the root as the first element.
 */
function getPathSegments(p: string): string[] {
  const normalized = path.normalize(p);
  const { root } = path.parse(normalized);

  const relativePart = normalized.slice(root.length);
  const segments = relativePart.split(path.sep).filter(Boolean);

  segments.unshift(root);
  return segments;
}

/**
 * Figures out which directory mod file an import should go through.
 *
 * - If the importing file sits at the common ancestor itself
 * (e.g., a root-level file like app.tsx), it always goes through that ancestor's
 * own mod file, never a nested module's boundary.
 * - If current and target are direct sibling folders,
 * cross via the target sibling mod file.
 * - Otherwise, bottleneck through the first-level boundary
 * below the common ancestor on the target's side.
 * @param boundary - Structural boundary metrics.
 * @param currentDirAbs - Absolute path of the current directory.
 * @param targetDirAbs - Absolute path of the target directory.
 * @returns - The absolute directory path where the mod file should be located.
 */
function determineExpectedDir(
  boundary: BoundaryInfo,
  currentDirAbs: string,
  targetDirAbs: string,
): string {
  if (boundary.isCurrentAtCommonAncestor) return currentDirAbs;
  if (boundary.isSiblingFolder) return targetDirAbs;

  const targetSegments = getPathSegments(targetDirAbs);
  const slicedSegments = targetSegments.slice(0, boundary.commonDepth + 1);
  return path.join(...slicedSegments);
}

/**
 * Builds the corrected import specifier (aliased or relative) for the fix.
 * @param expectedTargetAbsolute - The absolute path of the correct target mod file.
 * @param currentDirAbsolute - Absolute path of the current directory.
 * @param rootDir - Root directory of the project.
 * @param alias - The path alias prefix configuration or null.
 * @param aliasTarget - The real target path of the alias or null.
 * @returns - The formatted fixed import specifier ready for code insertion.
 */
function buildFixedImportString(
  expectedTargetAbsolute: string,
  currentDirAbsolute: string,
  rootDir: string,
  alias: string | null,
  aliasTarget: string | null,
): string {
  if (alias && aliasTarget) {
    const absoluteAliasRoot = path.resolve(rootDir, aliasTarget);
    const relativeFromAliasRoot = path.relative(absoluteAliasRoot, expectedTargetAbsolute);
    return `${alias}${relativeFromAliasRoot}`.replaceAll("\\", "/");
  }

  const relativeFix = path
    .relative(currentDirAbsolute, expectedTargetAbsolute)
    .replaceAll("\\", "/");
  return relativeFix.startsWith(".") ? relativeFix : `./${relativeFix}`;
}

export const enforceModBoundariesRule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce strictly bounded mod.ts/mod.js imports across layered architectures.",
    },
    fixable: "code",
    schema: [],
    messages: {
      violatesBoundary:
        'Layered boundaries must be imported via {{ modFileName }}. Expected: "{{ fixed }}"',
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const { alias, aliasTarget } = resolveAlias(context);
    const rootDir = context.cwd;
    const currentDirAbs = path.dirname(path.resolve(rootDir, context.filename));
    const fileExt = path.extname(context.filename);

    return {
      ImportDeclaration(node: ImportDeclaration): void {
        const importSource = node.source.value;
        if (typeof importSource !== "string") return;

        const isUsedAlias = alias ? importSource.startsWith(alias) : false;
        const isRelative = importSource.startsWith(".");
        if (!isRelative && !isUsedAlias) return;

        const targetAbs = resolveImportTarget(
          importSource,
          currentDirAbs,
          rootDir,
          alias,
          aliasTarget,
        );
        const targetDirAbs = path.dirname(targetAbs);
        if (currentDirAbs === targetDirAbs) return;

        const boundary = getBoundaryInfo(currentDirAbs, targetDirAbs);
        const expectedDir = determineExpectedDir(boundary, currentDirAbs, targetDirAbs);
        const modFileName = resolveModFileName(expectedDir, fileExt);
        const expectedTargetAbs = path.join(expectedDir, modFileName);

        if (isUsedAlias && targetAbs === expectedTargetAbs && isModFile(targetAbs)) {
          return;
        }

        const fixed = buildFixedImportString(
          expectedTargetAbs,
          currentDirAbs,
          rootDir,
          alias,
          aliasTarget,
        );
        const sourceCode = context.sourceCode.getText(node.source).trim();
        const quoteToken = ["`", "'", '"'].includes(sourceCode[0]) ? sourceCode[0] : '"';

        context.report({
          node,
          messageId: "violatesBoundary",
          data: { modFileName, fixed },
          fix: (fixer) => fixer.replaceText(node.source, `${quoteToken}${fixed}${quoteToken}`),
        });
      },
    };
  },
};
