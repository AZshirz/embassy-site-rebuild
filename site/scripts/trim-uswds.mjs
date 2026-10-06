// Writes a trimmed copy of the USWDS stylesheet with only the components this site uses.
//
// The full uswds.min.css is about 515 KB and blocks rendering, and the site uses a small part of
// it. Runs before `astro build`, so the v() hash in Base.astro is taken from the trimmed file.
//
// USWDS's JavaScript builds most of its class names at runtime from a prefix ("usa" + "-nav"), so
// scanning for class names would miss them and break things like the open mobile menu. Instead,
// any USWDS component the site uses at all is kept whole, in every state. Utility classes
// (margin-top-2, tablet:grid-col-6, ...) are kept when they appear in the source.
import postcss from 'postcss';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'public/uswds/css/uswds.min.css';
const OUTPUT = 'public/uswds/css/uswds.trimmed.min.css';

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const ourText = ['src', 'public/js'].flatMap(files).filter((f) => /\.(astro|ts|js)$/.test(f))
  .map((f) => readFileSync(f, 'utf8')).join('\n');
const usdsJs = readFileSync('public/uswds/js/uswds.min.js', 'utf8');

// Every word-like token in our source and in USWDS's JS. ':' and '/' are part of a token so that
// responsive classes like tablet:grid-col-6 survive.
const tokens = new Set((ourText + '\n' + usdsJs).match(/[\w:/-]+/g));

// Component roots the site uses, e.g. usa-nav__primary-item -> usa-nav. Anything starting with one
// of these is kept, as are the state classes USWDS puts on <html> and <body> (usa-js-...).
const roots = [...new Set([...ourText.matchAll(/usa-[a-z0-9-]+/g)].map((m) => m[0].split(/__|--/)[0].replace(/-$/, '')))];
const keepAlways = [...roots.map((r) => new RegExp(r.replace(/[-]/g, '\\-') + '(?![a-z0-9])')), /usa-js-/];
const alwaysClasses = new Set(['is-visible', 'is-safari', 'usa-overlay', 'usa-current', 'usa-sr-only']);

function selectorUsed(selector) {
  if (keepAlways.some((re) => re.test(selector))) return true;
  // Classes inside :not(...) don't have to be present for the rule to apply.
  const classes = selector.replace(/:not\([^)]*\)/g, '').match(/\.(?:\\.|[\w-])+/g) || [];
  return classes.every((c) => {
    const name = c.slice(1).replace(/\\(.)/g, '$1');
    return alwaysClasses.has(name) || tokens.has(name);
  });
}

const root = postcss.parse(readFileSync(SOURCE, 'utf8'));
root.walkRules((rule) => {
  if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
  const kept = rule.selectors.filter(selectorUsed);
  if (!kept.length) rule.remove();
  else rule.selectors = kept;
});
// Fonts: list only the .woff2 file. Every browser this site supports reads it, and the .woff and .ttf
// copies would otherwise have to be published too.
root.walkAtRules('font-face', (at) => at.walkDecls('src', (decl) => {
  const woff2 = decl.value.split(/,(?![^(]*\))/).filter((part) => part.includes('.woff2'));
  if (woff2.length) decl.value = woff2.join(',');
}));
// Drop @media / @supports blocks left empty.
root.walkAtRules((at) => {
  if (at.nodes && at.nodes.length === 0) at.remove();
});

const css = root.toString();
writeFileSync(OUTPUT, css);
const before = statSync(SOURCE).size;
console.log(`USWDS stylesheet trimmed: ${(before / 1024).toFixed(0)} KB -> ${(css.length / 1024).toFixed(0)} KB, keeping ${roots.length} components`);
