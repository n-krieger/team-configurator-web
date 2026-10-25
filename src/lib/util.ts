/** crypto.randomUUID only exists in secure contexts; fall back for plain-http LAN testing. */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function now(): string {
  return new Date().toISOString();
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Names that occur more than once (case-insensitive, trimmed). */
export function duplicates(values: string[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (seen.has(key)) dup.add(key);
    seen.add(key);
  }
  return dup;
}
