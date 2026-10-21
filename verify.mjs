import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Extract and test the exact module sources embedded in the deployed HTML.
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const match = html.match(/<script id="casemix-source" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Application source bundle not found.');
const bundle = JSON.parse(match[1]), directory = mkdtempSync(join(tmpdir(), 'casemix-regression-'));
for (const [name, source] of Object.entries({...bundle.modules,...bundle.tests})) {
  if (!/^[\w.-]+$/.test(name)) throw new Error('Invalid bundle file name.');
  writeFileSync(join(directory, name), source);
}
writeFileSync(join(directory, 'package.json'), JSON.stringify({type:'module'}));
const result = spawnSync(process.execPath, ['--test','audit.test.mjs','browser.test.mjs','web.test.cjs'], {cwd:directory,stdio:'inherit'});
process.exitCode = result.status ?? 1;
