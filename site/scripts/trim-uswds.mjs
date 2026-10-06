// Writes a trimmed copy of the USWDS stylesheet with only the components this site uses.
//
// The full uswds.min.css is about 515 KB and blocks rendering, and the site uses a small part of
// it. Runs before `astro build`, so the v() hash in Base.astro is taken from the trimmed file.
//
// USWDS's JavaScript builds most of its class names at runtime from a prefix ("usa" + "-nav"), so
// scanning for class names would miss them and break things like the open mobile menu. Instead,
// any USWDS component the site uses at all is kept whole, in every state. Utility classes
// (margin-top-2, tablet:grid-col-6, ...) are kept when they appear in the source.
import { PurgeCSS } from 'purgecss';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'public/uswds/css/uswds.min.css';
const OUTPUT = 'public/uswds/css/uswds.trimmed.min.css';
const OURS = ['src', 'public/js'];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const ourFiles = OURS.flatMap(files).filter((f) => /\.(astro|ts|js)$/.test(f));
const ourText = ourFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

// Component roots the site uses, e.g. usa-nav__primary-item -> usa-nav.
const roots = new Set([...ourText.matchAll(/usa-[a-z0-9-]+/g)].map((m) => m[0].split(/__|--/)[0].replace(/-$/, '')));
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const [result] = await new PurgeCSS().purge({
  css: [SOURCE],
  content: [...ourFiles, 'public/uswds/js/uswds.min.js'],
  // The default extractor splits on ':' and would drop responsive classes like tablet:grid-col-6.
  defaultExtractor: (content) => content.match(/[\w:/-]+/g) || [],
  safelist: {
    standard: ['is-visible', 'is-safari', 'usa-overlay', 'usa-current', 'usa-sr-only'],
    greedy: [
      ...[...roots].map((r) => new RegExp(escape(r) + '(?![a-z0-9])')),
      /usa-js-/,            // state classes USWDS puts on <body>, e.g. while the mobile menu is open
    ],
  },
  fontFace: false,
  keyframes: false,
  variables: false,
});

writeFileSync(OUTPUT, result.css);
const before = statSync(SOURCE).size;
const after = statSync(OUTPUT).size;
console.log(`USWDS stylesheet trimmed: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB, keeping ${roots.size} components`);
