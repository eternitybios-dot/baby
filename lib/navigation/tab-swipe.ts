/** スワイプドラッグ量に端の抵抗をかけたオフセットを返す */
export function resistTabSwipeOffset(
  dx: number,
  canPrev: boolean,
  canNext: boolean,
  edgeFactor = 0.28,
): number {
  if (dx > 0 && !canPrev) return dx * edgeFactor;
  if (dx < 0 && !canNext) return dx * edgeFactor;
  return dx;
}

export function shouldCommitTabSwipe(options: {
  dx: number;
  dy: number;
  width: number;
  minDistancePx?: number;
  horizontalRatio?: number;
  commitRatio?: number;
}): boolean {
  const {
    dx,
    dy,
    width,
    minDistancePx = 56,
    horizontalRatio = 1.25,
    commitRatio = 0.22,
  } = options;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < absY * horizontalRatio) return false;
  if (absX < minDistancePx && absX < width * commitRatio) return false;
  return absX >= minDistancePx || absX >= width * commitRatio;
}
