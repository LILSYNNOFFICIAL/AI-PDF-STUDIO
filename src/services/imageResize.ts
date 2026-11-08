export type ImageResizeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Convert horizontal pointer movement into a bounded image width percentage. */
export const calculateImageResizeWidth = (
  startWidth: number,
  deltaX: number,
  containerWidth: number,
  corner: ImageResizeCorner
): number => {
  const safeContainerWidth = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 1;
  const safeStartWidth = Number.isFinite(startWidth) ? startWidth : 80;
  const safeDeltaX = Number.isFinite(deltaX) ? deltaX : 0;
  const direction = corner.endsWith('right') ? 1 : -1;
  return Math.max(10, Math.min(100, safeStartWidth + (safeDeltaX / safeContainerWidth) * 100 * direction));
};
