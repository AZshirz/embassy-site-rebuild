// Copies the prebuilt U.S. Web Design System assets from node_modules into public/uswds
// so the site can reference /uswds/css/uswds.min.css etc. Runs automatically after `npm install`.
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const src = 'node_modules/@uswds/uswds/dist';
const dest = 'public/uswds';
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const dir of ['css', 'js', 'fonts', 'img']) {
  cpSync(`${src}/${dir}`, `${dest}/${dir}`, { recursive: true });
}
console.log('USWDS assets copied to', dest);
