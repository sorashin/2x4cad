export function getBoardGeometryKey(
  bg: { id: { graphNodeSet?: { nodeId?: string }; transform?: unknown } },
  index: number
): string {
  const nodeId = bg.id.graphNodeSet?.nodeId ?? 'n';
  return `${nodeId}-${index}`;
}
