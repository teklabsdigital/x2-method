// TIME-1's clock seam: the one module permitted to read a clock, wall or monotonic.
//
// **The measured fact this file is built on, and it refutes the hypothesis the build carried into it.** The
// seeded hypothesis was "the ban is on a type, and JavaScript ships one `Date` and it is the unsafe one". A JS
// `Date` holds milliseconds since the Unix epoch. It is an INSTANT: `new Date('2026-07-26T10:00:00+10:00')`
// and the same moment written in any other offset produce the identical value, and `toISOString()` renders UTC.
// So it is not ambiguous, and ambiguity is the entire subject of TIME-1's harm paragraph. It is also not
// offset-aware, because the originating offset is discarded at parse and cannot be recovered.
//
// TIME-1 requires "UTC-anchored offset-aware types" and forbids "local wall-clock types (naive datetimes)". A JS
// `Date` is the first and not the second and not the permitted shape either. It satisfies neither side of a
// two-way partition, because the phrase "UTC-anchored offset-aware" fuses two independent properties that
// `DateTimeOffset` happens to supply together:
//
//   1. **Unambiguity.** The value denotes exactly one instant. This is what the harm paragraph is about, and a
//      JS `Date` has it.
//   2. **Offset retention.** The value remembers the local offset it was recorded at, so an audit trail can be
//      rendered as the actor experienced it. The harm paragraph never mentions this, and a JS `Date` lacks it.
//
// One edition could not separate them. See the register, TIME-1's entry.
//
// **`Temporal` is not available.** Measured on this edition's pinned runtime, Node 24.13.1 (V8 13.6):
// `typeof globalThis.Temporal` is `undefined`. `Temporal.ZonedDateTime` would be wall time plus an IANA zone id
// as a first-class value, which is precisely the shape TIME-1's own weakening note says `DateTimeOffset` is
// insufficient for, so the handover's hypothesis that Node might be the stronger realization here is refuted at
// this runtime rather than in principle. A polyfill is a dependency and falls under DEP-1; it is not taken in a
// pass that has no scheduling slice to need it.
//
// So the reachable discipline is: the instant is a `Date`, the offset is carried beside it when a surface needs
// it, and both come from here. The wire form is RFC3339 with an offset, which the contract surface enforces
// separately, because JSON Schema's `format: 'date-time'` IS offset-bearing by definition and is therefore the
// one surface in this edition where the claim's full requirement is native.

export type Clock = Readonly<{
  // The wall clock, as an instant. Never subtracted from another reading: see `elapsed`.
  now: () => Date;
  // The monotonic source, exposed rather than assumed. TIME-1's monotonic extension asks for a duration to come
  // "from the monotonic source through one clock seam", and the .NET idiom is `Stopwatch`, a TYPE, so a type ban
  // finds a wall-clock delta by finding the wrong type. Node's monotonic source is a function on a global, so
  // there is no type to ban and the seam has to be bought by confinement: `eslint.config.js` refuses `Date.now`,
  // `new Date`, `Date.parse` and `performance.now` everywhere but this file.
  elapsed: <T>(work: () => T) => Readonly<{ value: T; milliseconds: number }>;
  // The offset half of TIME-1's permitted shape, which no JavaScript value carries. A caller that needs to
  // render an instant as it was experienced asks for both and stores both.
  offsetMinutesAt: (instant: Date, zone: string) => number;
}>;

export const systemClock: Clock = Object.freeze({
  now: () => new Date(),

  // The wall clock steps under NTP correction, so the difference across a step is not a duration. This is the
  // whole of TIME-1's monotonic sentence, and it is why the return is a measured number rather than two readings
  // handed back for a caller to subtract.
  elapsed: <T>(work: () => T) => {
    const started = performance.now();
    const value = work();
    return Object.freeze({ value, milliseconds: performance.now() - started });
  },

  // `Intl` is the only zone database in the platform, and it is a formatter rather than a time type, which is
  // the same shape as everything else in this port: the capability exists and is not modelled as a value.
  offsetMinutesAt: (instant: Date, zone: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(instant);
    const field = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
    const asUtc = Date.UTC(
      field('year'),
      field('month') - 1,
      field('day'),
      field('hour') % 24,
      field('minute'),
      field('second'),
    );
    return Math.round((asUtc - instant.getTime()) / 60_000);
  },
});

// DATA-5's runtime-refusal half, and the only seam in this edition that can carry it. The claim asks that "an
// operation requiring context the system does not have refuses with a named error rather than guessing", and
// names a user's timezone as the example; TIME-1 names the same one. This edition has no principal and therefore
// no stored timezone, so the refusal has nothing to refuse ON, and the honest realization is the idiom itself
// with a test rather than a live seam. Recorded in the conformance note rather than counted as coverage.
export function requireZone(zone: string | null | undefined, operation: string): string {
  if (zone === null || zone === undefined || zone.trim() === '') {
    throw new Error(
      `${operation} requires the principal's timezone and none is recorded. Refusing rather than guessing: a guessed zone corrupts every schedule it touches while looking plausible (DATA-5, TIME-1).`,
    );
  }
  return zone;
}
