import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(root, 'translation/protected-terms.json'), 'utf8'));
let failures = 0;

for (const sourcePath of config.pilotSources) {
  const source = readFileSync(join(root, sourcePath), 'utf8');
  const translatedPath = `${config.translationPrefix}${sourcePath}`;
  const translated = readFileSync(join(root, translatedPath), 'utf8');

  for (const term of config.preserveVerbatim) {
    // Word-boundary match so short terms don't false-positive inside other
    // words (e.g. "mining" must not match "deter*mining*", "chain" is still
    // satisfied by "block*chain*" because that is a word boundary on both
    // sides of the standalone token only).
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`);
    if (re.test(source) && !re.test(translated)) {
      console.error(`${translatedPath}: missing protected term "${term}"`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`Protected terminology validation failed with ${failures} missing term(s).`);
  process.exit(1);
}

console.log('Protected terminology validation passed for Italian pilot pages.');
