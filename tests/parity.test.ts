import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (path: string | URL): string => readFileSync(path, 'utf8');

const block = (css: string, opener: string): string => {
  const start = css.indexOf(opener);
  assert.notEqual(start, -1, `${opener} block not found`);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('\n}', open));
};

const declarations = (body: string): Map<string, string> =>
  new Map(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1] ?? '',
      (m[2] ?? '').trim(),
    ]),
  );

const resolve = (name: string, values: Map<string, string>): string => {
  const value = values.get(name);
  assert.notEqual(value, undefined, `${name} is not defined`);
  const reference = /^var\((--[\w-]+)\)$/.exec(value ?? '');
  return reference === null
    ? (value ?? '')
    : resolve(reference[1] ?? '', values);
};

const sources = [
  {
    name: 'committed fixture',
    path: new URL('./fixtures/token-baseline.css', import.meta.url),
  },
  ...(process.env['SITE_GLOBALS'] === undefined
    ? []
    : [
        {
          name: 'live website stylesheet',
          path: process.env['SITE_GLOBALS'],
        },
      ]),
];

const generated = (file: string): string =>
  read(new URL(`../packages/web/css/${file}`, import.meta.url));

describe('token parity', () => {
  for (const { name, path } of sources) {
    const css = read(path);

    it(`${name}: every :root value resolves to the same string`, () => {
      const expected = declarations(block(css, ':root {'));
      const actual = declarations(block(generated('tokens.css'), ':root {'));
      assert.ok(expected.size > 0, 'no :root declarations in the source');
      for (const property of expected.keys()) {
        assert.equal(
          resolve(property, actual),
          resolve(property, expected),
          property,
        );
      }
    });

    it(`${name}: color-scheme matches`, () => {
      assert.match(block(css, ':root {'), /color-scheme:\s*light;/);
      assert.match(
        block(generated('tokens.css'), ':root {'),
        /color-scheme:\s*light;/,
      );
    });

    it(`${name}: every @theme inline declaration is reproduced verbatim`, () => {
      const expected = declarations(block(css, '@theme inline {'));
      const actual = declarations(
        block(generated('tailwind.css'), '@theme inline {'),
      );
      assert.ok(expected.size > 0, 'no @theme declarations in the source');
      for (const [property, value] of expected) {
        assert.equal(actual.get(property), value, property);
      }
    });
  }
});
