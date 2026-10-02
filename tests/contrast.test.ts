import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ColorError,
  contrastRatio,
  parseHex,
} from '../packages/web/src/contrast.ts';
import { tokens } from '../packages/web/src/tokens.ts';
import {
  defaultSpec,
  evaluate,
  referenced,
  resolve,
  UnknownTokenError,
  type Spec,
} from './contrast.ts';

describe('contrast helper', () => {
  it('rates black on white 21:1 and a color on itself 1:1', () => {
    assert.equal(contrastRatio('#000000', '#ffffff'), 21);
    assert.equal(contrastRatio('#fffaeb', '#fffaeb'), 1);
  });

  it('is symmetric', () => {
    assert.equal(
      contrastRatio('#2a2217', '#fffaeb'),
      contrastRatio('#fffaeb', '#2a2217'),
    );
  });

  it('rejects anything but a six-digit hex', () => {
    assert.throws(() => parseHex('rgb(0, 0, 0)'), ColorError);
    assert.throws(() => parseHex('#fff'), ColorError);
  });
});

describe('contrast coverage', () => {
  it('evaluates at least one pair', () => {
    assert.ok(evaluate().length > 0);
  });

  it('resolves every referenced token', () => {
    for (const path of referenced())
      assert.doesNotThrow(() => resolve(path), path);
  });

  it('rejects an unknown token', () => {
    assert.throws(() => resolve('color.missing'), UnknownTokenError);
  });

  it('covers every color token in a pair', () => {
    const covered = referenced();
    const colors = [
      ...Object.keys(tokens.color).map((name) => `color.${name}`),
      ...Object.keys(tokens.extension)
        .filter((name) => name !== 'radius')
        .map((name) => `extension.${name}`),
    ];
    assert.deepEqual(
      colors.filter((path) => !covered.has(path)),
      [],
    );
  });
});

describe('contrast evaluation', () => {
  const empty = { min: 0, grounds: [], foregrounds: [] };
  const only = (min: number): Spec => ({
    body: empty,
    ui: empty,
    disallowed: [],
    evidence: '',
    pairs: [
      {
        role: 'probe',
        min,
        foreground: 'color.ink-soft',
        ground: 'color.paper-deep',
      },
    ],
  });

  it('flags a pair below its minimum', () => {
    assert.deepEqual(
      evaluate(only(4.5)).map((r) => r.pass),
      [false],
    );
  });

  it('passes a pair at or above its minimum', () => {
    assert.deepEqual(
      evaluate(only(3)).map((r) => r.pass),
      [true],
    );
  });
});

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

const tripleKey = (min: number, foreground: string, ground: string): string =>
  `${min} ${foreground} on ${ground}`;

const parseAllowedPairs = (markdown: string): Set<string> => {
  const heading = markdown.indexOf('### Allowed pairs');
  assert.notEqual(heading, -1, 'README has no "Allowed pairs" heading');
  const lines = markdown.slice(heading).split('\n').slice(1);
  const end = lines.findIndex((line) => line.startsWith('#'));
  const rows = (end === -1 ? lines : lines.slice(0, end))
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));
  assert.match(rows[1] ?? '', /^\|[\s:|-]+\|$/, 'no table separator row');
  const keys = new Set<string>();
  for (const line of rows.slice(2)) {
    const [, foreground, grounds, minimum] = line
      .split('|')
      .map((cell) => cell.trim());
    const min = /^(\d+(?:\.\d+)?):1$/.exec(minimum ?? '');
    if (!foreground || !grounds || min === null)
      throw new Error(`malformed allowed-pairs row: ${line}`);
    for (const ground of grounds.split(',')) {
      keys.add(
        tripleKey(
          Number(min[1]),
          foreground.replaceAll('`', ''),
          ground.trim().replaceAll('`', ''),
        ),
      );
    }
  }
  return keys;
};

const readmePairs = (): Set<string> => parseAllowedPairs(readme);

const table = (...rows: string[]): string =>
  [
    '### Allowed pairs',
    '| Foreground | Grounds | Minimum |',
    '| --- | --- | --- |',
    ...rows,
  ].join('\n');

describe('allowed-pairs table parser', () => {
  it('reads a well-formed row', () => {
    assert.deepEqual(
      [...parseAllowedPairs(table('| `a` | `b`, `c` | 4.5:1 |'))],
      ['4.5 a on b', '4.5 a on c'],
    );
  });

  for (const [name, row] of [
    ['a missing minimum', '| `a` | `b` | |'],
    ['a minimum without the ratio suffix', '| `a` | `b` | 4.5 |'],
    ['an empty foreground', '| | `b` | 4.5:1 |'],
    ['an empty grounds cell', '| `a` | | 4.5:1 |'],
    ['a row with too few cells', '| `a` |'],
  ] as const) {
    it(`throws on ${name}`, () => {
      assert.throws(
        () => parseAllowedPairs(table('| `x` | `y` | 3:1 |', row)),
        /malformed allowed-pairs row/,
      );
    });
  }
});

describe('README and contrast-pairs.json', () => {
  it('list the same allowed pairs and minimums', () => {
    const fromJson = new Set(
      evaluate().map((r) => tripleKey(r.min, r.foreground, r.ground)),
    );
    const fromReadme = readmePairs();
    assert.ok(fromReadme.size > 0);
    assert.deepEqual(
      [...fromJson].filter((key) => !fromReadme.has(key)),
      [],
      'in contrast-pairs.json, missing from README',
    );
    assert.deepEqual(
      [...fromReadme].filter((key) => !fromJson.has(key)),
      [],
      'in README, missing from contrast-pairs.json',
    );
  });
});

describe('disallowed pairs', () => {
  const rows = evaluate({
    ...defaultSpec,
    body: { min: 0, grounds: [], foregrounds: [] },
    ui: { min: 0, grounds: [], foregrounds: [] },
    pairs: defaultSpec.disallowed,
  });

  it('lists at least one pair', () => {
    assert.ok(rows.length > 0);
  });

  it('stay below their minimum', () => {
    assert.deepEqual(
      rows.filter((r) => r.pass).map((r) => `${r.foreground} on ${r.ground}`),
      [],
    );
  });

  it('are absent from the allowed pairs', () => {
    const allowed = new Set(
      evaluate().map((r) => `${r.foreground} on ${r.ground}`),
    );
    assert.deepEqual(
      rows
        .map((r) => `${r.foreground} on ${r.ground}`)
        .filter((key) => allowed.has(key)),
      [],
    );
  });

  it('are named in the README and the expired token description', () => {
    assert.match(readme, /expired text on `paper-deep` fails WCAG/);
    assert.match(
      readFileSync(new URL('../tokens/color.json', import.meta.url), 'utf8'),
      /expired text on paper-deep fails WCAG/,
    );
  });
});

describe('expired token description', () => {
  it('names the grounds that contrast-pairs.json allows for expired text', () => {
    const description = JSON.stringify(
      JSON.parse(
        readFileSync(new URL('../tokens/color.json', import.meta.url), 'utf8'),
      ).color.expired.$description,
    );
    const named = /^"Text on ([^;]+) only;/.exec(description);
    assert.notEqual(
      named,
      null,
      'description has no "Text on ... only;" clause',
    );
    const fromDescription = (named?.[1] ?? '')
      .split(/,| and /)
      .map((ground) => `color.${ground.trim()}`)
      .filter((ground) => ground !== 'color.')
      .sort();
    const fromJson = evaluate()
      .filter(
        (r) => r.role === 'expired text' && r.foreground === 'color.expired',
      )
      .map((r) => r.ground)
      .sort();
    assert.ok(fromJson.length > 0);
    assert.deepEqual(fromDescription, fromJson);
  });
});

describe('expired evidence', () => {
  it('states the measured ratio on every ground', () => {
    const grounds = [
      'color.paper',
      'color.paper-inset',
      'color.paper-deep',
    ] as const;
    for (const ground of grounds) {
      const ratio = contrastRatio(resolve('color.expired'), resolve(ground));
      assert.ok(
        defaultSpec.evidence.includes(`${ratio.toFixed(2)}:1`),
        `${ground} ${ratio.toFixed(2)}:1 missing from evidence`,
      );
    }
  });
});
