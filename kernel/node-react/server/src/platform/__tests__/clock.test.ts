import { describe, expect, it } from 'vitest';
import { requireZone, systemClock } from '../clock.ts';

describe('TIME-1: the platform facts this edition is built on, measured rather than assumed', () => {
  // The seeded hypothesis carried into this build was "JavaScript ships one Date and it is the unsafe one".
  // These two assertions are why that is false and why the finding it produced is not the one anybody expected:
  // a JS Date has the property TIME-1's harm paragraph is about, and lacks the property TIME-1's statement
  // requires, and those are not the same property.
  it('a Date is unambiguous: the same instant in two offsets is one value', () => {
    const brisbane = new Date('2026-07-26T10:00:00+10:00');
    const utc = new Date('2026-07-26T00:00:00Z');

    expect(brisbane.getTime()).toBe(utc.getTime());
  });

  it('a Date is not offset-aware: the originating offset is discarded and cannot be recovered', () => {
    const recorded = new Date('2026-07-26T10:00:00+10:00');

    expect(recorded.toISOString()).toBe('2026-07-26T00:00:00.000Z');
    // There is no accessor for the offset it was written in, and no field holding it. What the value knows is
    // the instant; the local rendering it was captured in is gone.
    expect(Object.keys(recorded)).toEqual([]);
  });

  // Recorded as an assertion rather than as a comment so that the day this runtime gains Temporal, this test
  // goes red and the register's TIME-1 entry is revisited rather than silently left wrong. The Phase 2 audit's
  // lesson about pinning a fact that is really a state applies here: this is a fact about a version.
  it('Temporal is absent from this runtime, so the zone-carrying type TIME-1 wants is not native', () => {
    expect(typeof (globalThis as { Temporal?: unknown }).Temporal).toBe('undefined');
  });
});

describe('TIME-1: durations are measured, never computed from wall clocks', () => {
  it('measures elapsed time from the monotonic source and returns the work with it', () => {
    const measured = systemClock.elapsed(() => {
      let total = 0;
      for (let index = 0; index < 100_000; index += 1) {
        total += index;
      }
      return total;
    });

    expect(measured.value).toBe(4_999_950_000);
    expect(measured.milliseconds).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(measured.milliseconds)).toBe(true);
  });

  // The monotonic source cannot go backwards, which is the property the wall clock does not have and the whole
  // reason the claim asks for one seam. This is the cheap version of the assertion: a wall clock stepped by NTP
  // between two readings can produce a negative difference, and this one cannot.
  it('the monotonic source never goes backwards across readings', () => {
    const readings = Array.from({ length: 50 }, () => systemClock.elapsed(() => undefined).milliseconds);

    expect(readings.every((value) => value >= 0)).toBe(true);
  });
});

describe('TIME-1: the offset the platform does not carry is obtainable and is carried beside the instant', () => {
  it.each([
    ['Australia/Brisbane', '2026-07-26T00:00:00Z', 600],
    ['UTC', '2026-07-26T00:00:00Z', 0],
    // A DST boundary, because a fixed offset is exactly what TIME-1's weakening note says is insufficient for a
    // zone: the same zone answers differently in January and July, which is the whole point.
    ['Europe/Berlin', '2026-01-15T12:00:00Z', 60],
    ['Europe/Berlin', '2026-07-15T12:00:00Z', 120],
  ])('resolves the offset for %s at %s', (zone, instant, expected) => {
    expect(systemClock.offsetMinutesAt(new Date(instant), zone)).toBe(expected);
  });
});

describe('DATA-5: an operation refuses missing context rather than guessing it', () => {
  it('returns the zone when one is recorded', () => {
    expect(requireZone('Australia/Brisbane', 'rendering the audit trail')).toBe('Australia/Brisbane');
  });

  it.each([null, undefined, '', '   '])('refuses by name when the zone is %p', (zone) => {
    expect(() => requireZone(zone, 'rendering the audit trail')).toThrow(
      /rendering the audit trail requires the principal's timezone/,
    );
  });
});
