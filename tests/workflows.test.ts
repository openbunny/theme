import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (path: string): string =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const ci = read('.github/workflows/ci.yml');
const mise = read('mise.toml');

const gateRun =
  /name: every gate job succeeded\n(?: {8}.*\n)*? {8}run: (.+)\n/.exec(ci)?.[1];

const needsList = /needs: \[([^\]]+)\]/.exec(ci)?.[1]?.split(', ') ?? [];

const gate = (needs: Record<string, { result: string }>) =>
  spawnSync('bash', ['-c', gateRun ?? 'exit 99'], {
    env: { ...process.env, NEEDS: JSON.stringify(needs) },
  });

describe('gate job', () => {
  it('has a run command to test', () => {
    assert.notEqual(gateRun, undefined);
    assert.ok(needsList.length > 0);
  });

  it('succeeds only when every needed job succeeded', () => {
    assert.equal(
      gate({ a: { result: 'success' }, b: { result: 'success' } }).status,
      0,
    );
  });

  for (const result of ['failure', 'skipped', 'cancelled']) {
    it(`fails when a needed job is ${result}`, () => {
      const outcome = gate({ a: { result: 'success' }, b: { result } });
      assert.equal(outcome.status, 1);
      assert.equal(String(outcome.stdout), 'false\n');
    });
  }

  it('needs every other job except the pull-request-only DCO job', () => {
    const jobs = [
      ...ci.slice(ci.indexOf('\njobs:')).matchAll(/^ {2}([a-z-]+):\n/gm),
    ].map((m) => m[1]);
    assert.deepEqual(
      [...needsList].sort(),
      jobs.filter((job) => job !== 'gate' && job !== 'dco').sort(),
    );
  });
});

describe('tool versions', () => {
  const pin = (tool: string): string | undefined =>
    new RegExp(`^${tool} = "([^"]+)"$`, 'm').exec(mise)?.[1];

  for (const [tool, job] of [
    ['zizmor', 'zizmor'],
    ['gitleaks', 'gitleaks'],
  ] as const) {
    it(`passes the mise.toml ${tool} version to its reusable workflow`, () => {
      const passed = new RegExp(
        `reusable-${tool}\\.yml@\\S+ # \\S+\\n {4}with:\\n {6}version: (\\S+)\\n`,
      ).exec(ci)?.[1];
      assert.notEqual(pin(tool), undefined, `${job}: no pin in mise.toml`);
      assert.equal(passed, pin(tool));
    });
  }

  it('fails on a tool missing from mise.lock', () => {
    assert.match(mise, /^locked = true$/m);
  });
});

describe('runner labels', () => {
  it('pins every runner to a versioned label', () => {
    const labels = [...ci.matchAll(/(?:runner|runs-on): (\S+)/g)].map(
      (m) => m[1],
    );
    assert.ok(labels.length > 0);
    assert.deepEqual(
      labels.filter((label) => /latest/.test(label ?? '')),
      [],
    );
  });
});
