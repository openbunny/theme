import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { compile } from 'tailwindcss';

const theme = readFileSync(
  new URL('../packages/web/css/tailwind.css', import.meta.url),
  'utf8',
);

const utilities = [
  ['bg-paper-deep', 'background-color: var(--paper-deep)'],
  ['bg-paper-inset', 'background-color: var(--paper-inset)'],
  ['text-muted', 'color: var(--muted)'],
  ['text-sprout', 'color: var(--sprout)'],
  ['text-expired', 'color: var(--expired)'],
  ['border-line', 'border-color: var(--line)'],
  ['font-display', 'font-family: "Courier Prime", monospace'],
  ['font-mono', 'font-family: "JetBrains Mono", monospace'],
] as const;

describe('tailwind theme', () => {
  it('generates each expected utility from the generated @theme block', async () => {
    const compiler = await compile(`${theme}\n@tailwind utilities;`);
    const css = compiler.build(utilities.map(([name]) => name));
    for (const [name, declaration] of utilities) {
      assert.ok(css.includes(`.${name}`), `${name} was not generated`);
      assert.ok(css.includes(declaration), `${name} lacks ${declaration}`);
    }
  });

  it('generates rounded utilities with a zero radius', async () => {
    const compiler = await compile(`${theme}\n@tailwind utilities;`);
    const css = compiler.build(['rounded-lg']);
    assert.match(css, /border-radius:\s*0/);
  });
});
