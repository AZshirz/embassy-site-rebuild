// Deletes the USWDS files the built site never uses. Runs after `astro build`.
//
// copy-uswds.mjs copies the whole USWDS package into public/uswds (about 2,600 files), and Astro
// publishes everything in public/. The pages use a few dozen of them: two scripts, the trimmed
// stylesheet, some icons and fonts. Everything else would be uploaded on every deploy for nothing.
// A file is kept if any built page or stylesheet refers to it.
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

const DIST = 'dist';

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const all = files(DIST).map((f) => relative(DIST, f).split(sep).join('/'));
const referenced = new Set();
for (const file of all.filter((f) => /\.(html|css|js)$/.test(f) && !f.startsWith('uswds/js/'))) {
  const text = readFileSync(join(DIST, file), 'utf8');
  for (const [, path] of text.matchAll(/["'(]\/(uswds\/[^"'()\s?#]+)/g)) referenced.add(path);
  // Relative url(...) inside stylesheets, e.g. url(../fonts/x.woff2) in uswds/css/.
  for (const [, url] of text.matchAll(/url\(\s*["']?(\.\.?\/[^"')?#]+)/g)) {
    referenced.add(posix.normalize(posix.join(posix.dirname(file), url)));
  }
}

let removed = 0;
for (const file of all.filter((f) => f.startsWith('uswds/') && !referenced.has(f))) {
  rmSync(join(DIST, file));
  removed++;
}
for (const dir of ['uswds']) pruneEmptyDirs(join(DIST, dir));
function pruneEmptyDirs(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) pruneEmptyDirs(path);
  }
  if (!readdirSync(dir).length) rmSync(dir, { recursive: true });
}
console.log(`USWDS files published: ${all.filter((f) => f.startsWith('uswds/')).length - removed} (removed ${removed} unused)`);
