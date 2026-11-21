import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const src = join(here, 'poster', 'entry.png');
const dst = join(outDir, 'entry.png');

if (!existsSync(src)) throw new Error('poster/entry.png is missing; build the poster first');
const buf = readFileSync(src);
if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('poster/entry.png is not a PNG');
if (buf.length > 1024 * 1024) throw new Error(`poster/entry.png is ${buf.length} bytes, over the 1 MiB cap`);
mkdirSync(outDir, { recursive: true });
copyFileSync(src, dst);
console.log(JSON.stringify({ wrote: dst, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') }));
