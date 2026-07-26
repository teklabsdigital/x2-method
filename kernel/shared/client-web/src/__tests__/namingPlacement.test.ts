import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// MOD-2 and UI-3 as a zero-dependency source scan of src/. File name and location are a pure function of what a
// file contains, and only primitives import the token source.
const srcRoot = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(srcRoot);
const relative = (file: string) => file.slice(srcRoot.length + 1).replaceAll('\\', '/');

describe('client naming and placement (MOD-2, UI-3)', () => {
  it('component files are PascalCase under components/ or a module', () => {
    // Exempt the entry point by its exact path, not endsWith('main.tsx') (which also matches e.g. Domain.tsx).
    for (const file of files.filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx') && relative(f) !== 'main.tsx')) {
      const path = relative(file);
      const base = path.split('/').at(-1)!;
      expect(/^[A-Z][A-Za-z0-9]*\.tsx$/.test(base)).toBe(true);
      expect(path.startsWith('components/') || path.startsWith('modules/')).toBe(true);
    }
  });

  it('repositories are named *Repo.ts under data/', () => {
    for (const file of files.filter((f) => f.endsWith('Repo.ts'))) {
      expect(relative(file).startsWith('data/')).toBe(true);
    }
  });

  it('tests live in a __tests__ folder', () => {
    for (const file of files.filter((f) => /\.test\.tsx?$/.test(f))) {
      expect(relative(file).includes('__tests__/')).toBe(true);
    }
  });

  it('only primitives and the theme import the token layer (UI-3)', () => {
    // Match any import from the theme layer (the tokens file or a re-export barrel), not just a path ending /tokens.
    for (const file of files.filter((f) => /\.tsx?$/.test(f))) {
      const importsTheme = /from ['"][^'"]*\/theme(?:\/[^'"]*)?['"]/.test(readFileSync(file, 'utf8'));
      if (importsTheme) {
        const path = relative(file);
        expect(path.startsWith('components/') || path.startsWith('theme/')).toBe(true);
      }
    }
  });
});
