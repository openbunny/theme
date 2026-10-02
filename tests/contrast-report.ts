import { evaluate, format } from './contrast.ts';

const rows = evaluate();
if (rows.length === 0) {
  console.error('contrast: no pairs were evaluated');
  process.exit(1);
}
console.log(format(rows));
const failed = rows.filter((r) => !r.pass);
console.log(`\n${rows.length} pairs, ${failed.length} below their minimum`);
process.exit(failed.length === 0 ? 0 : 1);
