import { describe, expect, it } from 'vitest';
import { redact } from '../redact.ts';

describe('redact (SEC-6)', () => {
  it('scrubs a JWT-shaped token', () => {
    const jwt = 'eyAAAAAAAA.bBBBBBBBBB.cCCCCCCCCC';
    const out = redact(`{"note":"see token=${jwt}"}`);
    expect(out).not.toContain(jwt);
    expect(out).toContain('[REDACTED-JWT]');
  });

  it('scrubs a JSON Authorization value', () => {
    const out = redact('{"authorization":"Bearer secret-token-value"}');
    expect(out).not.toContain('secret-token-value');
    expect(out).toContain('[REDACTED]');
  });

  it('scrubs an Authorization header line', () => {
    const out = redact('Authorization: Bearer abcdefghijklmnop');
    expect(out).not.toContain('abcdefghijklmnop');
    expect(out).toContain('[REDACTED]');
  });

  it('leaves ordinary text untouched', () => {
    expect(redact('the quick brown fox')).toBe('the quick brown fox');
  });

  it('keeps the surrounding JSON parseable when a header form is embedded', () => {
    const out = redact(JSON.stringify({ detail: 'authorization: Bearer abc123xyz789', ok: false }));
    expect(out).not.toContain('abc123xyz789');
    // The trailing structure must survive: the redactor must not eat the closing quote/brace.
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out).ok).toBe(false);
  });
});
