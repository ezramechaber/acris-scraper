export function formatJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
