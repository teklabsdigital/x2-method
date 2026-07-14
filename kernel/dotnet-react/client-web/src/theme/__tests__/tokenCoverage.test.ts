import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '../tokens.ts';

// The artifact under test is the design-system export at its canonical home (INV-01): design/prototype/_ds/ at
// the edition root, where the Claude Design import lands at instantiation. One home, no second copy to rot.
const css = readFileSync(join(process.cwd(), '..', 'design', 'prototype', '_ds', 'colors_and_type.css'), 'utf8');
const cssVariables = [...css.matchAll(/--([a-z0-9-]+)\s*:/g)].map((match) => match[1]);

const toCamelCase = (name: string) => name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

describe('token coverage (UI-1)', () => {
  it('the design export defines more than 50 distinct variables', () => {
    // Distinct count: a variable redeclared across selectors (e.g. a theme override) must not inflate the floor.
    expect(new Set(cssVariables).size).toBeGreaterThan(50);
  });

  it('every design-system variable has a matching token', () => {
    for (const variable of cssVariables) {
      expect(tokens).toHaveProperty(toCamelCase(variable));
    }
  });
});
