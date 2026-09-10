export interface BoundaryInfo {
  commonDepth: number;
  currentDepthFromSplit: number;
  targetDepthFromSplit: number;
  isSiblingFolder: boolean;
  isCurrentAtCommonAncestor: boolean;
}
