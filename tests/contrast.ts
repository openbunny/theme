import { readFileSync } from 'node:fs';
import { contrastRatio } from '../packages/web/src/contrast.ts';
import { tokens } from '../packages/web/src/tokens.ts';

export interface Row {
  readonly role: string;
  readonly foreground: string;
  readonly ground: string;
  readonly min: number;
  readonly ratio: number;
  readonly pass: boolean;
}

interface Matrix {
  readonly min: number;
  readonly grounds: readonly string[];
  readonly foregrounds: readonly string[];
}

interface Pair {
  readonly role: string;
  readonly min: number;
  readonly foreground: string;
  readonly ground: string;
}

export interface Spec {
  readonly body: Matrix;
  readonly ui: Matrix;
  readonly pairs: readonly Pair[];
  readonly disallowed: readonly Pair[];
  readonly evidence: string;
}

export class UnknownTokenError extends Error {}

export const defaultSpec: Spec = JSON.parse(
  readFileSync(new URL('./contrast-pairs.json', import.meta.url), 'utf8'),
);

export const resolve = (path: string): string => {
  const [group, name] = path.split('.');
  const node: unknown = (tokens as Readonly<Record<string, unknown>>)[
    group ?? ''
  ];
  const value =
    typeof node === 'object' && node !== null
      ? new Map(Object.entries(node)).get(name ?? '')
      : undefined;
  if (typeof value !== 'string') {
    throw new UnknownTokenError(`${path} is not a string token`);
  }
  return value;
};

const row = (
  role: string,
  foreground: string,
  ground: string,
  min: number,
): Row => {
  const ratio = contrastRatio(resolve(foreground), resolve(ground));
  return { role, foreground, ground, min, ratio, pass: ratio >= min };
};

const matrix = (role: string, { min, grounds, foregrounds }: Matrix): Row[] =>
  foregrounds.flatMap((fg) => grounds.map((bg) => row(role, fg, bg, min)));

export const evaluate = (spec: Spec = defaultSpec): Row[] => [
  ...matrix('body text', spec.body),
  ...matrix('large text and UI', spec.ui),
  ...spec.pairs.map((p) => row(p.role, p.foreground, p.ground, p.min)),
];

export const referenced = (spec: Spec = defaultSpec): Set<string> =>
  new Set([
    ...spec.body.grounds,
    ...spec.body.foregrounds,
    ...spec.ui.grounds,
    ...spec.ui.foregrounds,
    ...spec.pairs.flatMap((p) => [p.foreground, p.ground]),
  ]);

export const format = (rows: readonly Row[]): string =>
  rows
    .map(
      (r) =>
        `${r.pass ? 'pass' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(5)} (min ${r.min})  ${r.foreground} on ${r.ground}  [${r.role}]`,
    )
    .join('\n');
