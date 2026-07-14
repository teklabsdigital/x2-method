// SEC-6: harness output carries no secrets. Scrubs Authorization values (JSON and header forms) and any
// JWT-shaped token that survives. Unit-tested in __tests__/redact.test.ts.
export function redact(value: string): string {
  return value
    .replace(/("authorization"\s*:\s*")[^"]*(")/gi, '$1[REDACTED]$2')
    // Match only token characters, not a greedy \S+ that would swallow a following '"}' and corrupt the NDJSON.
    .replace(/(authorization\s*:\s*)(bearer\s+)?[A-Za-z0-9._~+/=-]+/gi, '$1$2[REDACTED]')
    .replace(/[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[REDACTED-JWT]');
}
