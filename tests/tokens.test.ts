import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { tokens } from '../packages/web/src/tokens.ts';
import { color } from '@openbunny/theme/tokens';

const url = (path: string): URL => new URL(`../${path}`, import.meta.url);
const json = (path: string): Record<string, Record<string, unknown>> =>
  JSON.parse(readFileSync(url(path), 'utf8'));

const documentedGroups = ['text', 'leading', 'space', 'page', 'link', 'width'];

describe('token source', () => {
  it('exports the generated web tokens from the repository root', () => {
    assert.deepEqual(color, tokens.color);
  });

  it('has a role-based usage statement on every scale token', () => {
    const dimension = json('tokens/dimension.json');
    const missing: string[] = [];
    const checked: string[] = [];
    for (const group of [...documentedGroups, 'measure']) {
      const node = dimension[group] ?? {};
      const entries: [string, unknown][] =
        group === 'measure' ? [[group, node]] : Object.entries(node);
      for (const [name, token] of entries) {
        if (name.startsWith('$')) continue;
        checked.push(`${group}.${name}`);
        const description = (token as { $description?: unknown }).$description;
        if (
          typeof description !== 'string' ||
          !/^Role: [a-z][^/\\]*\.$/.test(description)
        ) {
          missing.push(`${group}.${name}`);
        }
      }
    }
    assert.ok(checked.length > 0);
    assert.deepEqual(missing, []);
  });

  it('names no file, route or component of the private site in any published text', () => {
    const files = [
      'tokens/color.json',
      'tokens/dimension.json',
      'tokens/native.json',
      'tests/contrast-pairs.json',
      'tests/fixtures/token-baseline.css',
      'README.md',
      'CONTRIBUTING.md',
    ];
    // Terms are assembled from parts so this file never contains them.
    const terms = [
      ...['components', 'app', 'scripts', 'public'].map((d) => `${d}\\/`),
      ['can', 'ary'].join(''),
      ['arm', 'or'].join(''),
      ['fiona', 'sm\\/'].join('\\.'),
    ];
    const private_ = new RegExp(terms.join('|'), 'i');
    const leaks = files.filter((file) =>
      private_.test(readFileSync(url(file), 'utf8')),
    );
    assert.deepEqual(leaks, []);
  });

  it('is square: every radius token is 0', () => {
    assert.deepEqual(Object.values(tokens.radius), Array(7).fill(0));
  });

  it('lowercases every color hex', () => {
    for (const [name, value] of Object.entries(tokens.color)) {
      assert.match(value, /^#[0-9a-f]{6}$/, name);
    }
  });
});

describe('fonts', () => {
  const css = readFileSync(url('packages/web/css/fonts.css'), 'utf8');
  const faces = [
    ...css.matchAll(/font-family: "([^"]+)";[^}]*?url\("([^"]+)"\)/gs),
  ];

  it('declares at least one font face', () => {
    assert.ok(faces.length > 0);
  });

  it('points every font face at an existing file', () => {
    for (const [, , file] of faces) {
      assert.ok(
        existsSync(new URL(file ?? '', url('packages/web/css/fonts.css'))),
        file,
      );
    }
  });

  it('declares only families the font tokens name', () => {
    const named = Object.values(tokens.font).flatMap((stack) =>
      stack.split(',').map((family) => family.trim().replaceAll('"', '')),
    );
    for (const [, family] of faces)
      assert.ok(named.includes(family ?? ''), family);
  });

  it('ships a license text beside every font file', () => {
    const files = readdirSync(url('packages/web/fonts'));
    assert.ok(files.some((f) => f.endsWith('.woff2')));
    assert.ok(files.includes('OFL-CourierPrime.txt'));
    assert.ok(files.includes('OFL-JetBrainsMono.txt'));
  });

  it('ships WOFF fonts for image renderers', () => {
    for (const family of ['courier-prime', 'jetbrains-mono']) {
      for (const weight of [400, 700]) {
        assert.ok(
          existsSync(
            url(`packages/web/fonts/${family}-latin-${weight}-normal.woff`),
          ),
        );
      }
    }
  });
});
