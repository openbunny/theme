import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const scratch: string[] = [];

const workspace = (): { tokens: string; out: string } => {
  const dir = mkdtempSync(join(tmpdir(), 'openbunny-generator-'));
  scratch.push(dir);
  const tokens = join(dir, 'tokens');
  cpSync(join(root, 'tokens'), tokens, { recursive: true });
  const out = join(dir, 'out');
  mkdirSync(out);
  return { tokens, out };
};

const generate = (tokens: string, out: string) =>
  spawnSync(
    join(root, 'node_modules/.bin/style-dictionary'),
    ['build', '--config', 'style-dictionary.config.mjs'],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, OPENBUNNY_TOKENS: tokens, OPENBUNNY_OUT: out },
    },
  );

const read = (out: string, path: string): string =>
  readFileSync(join(out, path), 'utf8');

afterEach(() => {
  for (const dir of scratch.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe('generator', () => {
  it('resolves the background alias to paper in every output', () => {
    const { tokens, out } = workspace();
    const result = generate(tokens, out);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      read(out, 'packages/web/css/tokens.css'),
      /--background: var\(--paper\);/,
    );
    assert.match(
      read(out, 'packages/web/src/tokens.ts'),
      /"background": "#fffaeb"/,
    );
    assert.match(
      read(out, 'Sources/OpenBunnyTheme/Generated/Tokens.swift'),
      /static let background = Color\(\n\s+\.sRGB, red: 255\.0 \/ 255\.0, green: 250\.0 \/ 255\.0, blue: 235\.0 \/ 255\.0\)/,
    );
  });

  it('does not emit print overrides', () => {
    const { tokens, out } = workspace();
    assert.equal(generate(tokens, out).status, 0);
    const css = read(out, 'packages/web/css/tokens.css');
    assert.doesNotMatch(css, /@media/);
    assert.doesNotMatch(css, /#fff;|#000;/);
  });

  it('fails when no token file matches the glob', () => {
    const { tokens, out } = workspace();
    rmSync(tokens, { recursive: true });
    mkdirSync(tokens);
    const result = generate(tokens, out);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no token files match/);
  });

  it('fails when every token file is an empty object', () => {
    const { tokens, out } = workspace();
    rmSync(tokens, { recursive: true });
    mkdirSync(tokens);
    writeFileSync(join(tokens, 'color.json'), '{}');
    const result = generate(tokens, out);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /token set is empty/);
  });

  it('fails when an alias does not resolve', () => {
    const { tokens, out } = workspace();
    const file = join(tokens, 'color.json');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace('{color.paper}', '{color.missing}'),
    );
    const result = generate(tokens, out);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /references .* could not be found/);
  });

  it('fails when the color-scheme token is absent', () => {
    const { tokens, out } = workspace();
    const file = join(tokens, 'color.json');
    const json = JSON.parse(readFileSync(file, 'utf8')) as Record<
      string,
      unknown
    >;
    delete json['color-scheme'];
    writeFileSync(file, JSON.stringify(json));
    const result = generate(tokens, out);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /color-scheme/);
  });

  it('fails when a color is not a six-digit lowercase hex', () => {
    const { tokens, out } = workspace();
    const file = join(tokens, 'color.json');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace('#fffaeb', 'rebeccapurple'),
    );
    const result = generate(tokens, out);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /six-digit lowercase hex/);
  });
});
