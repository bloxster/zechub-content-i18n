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
    if (source.includes(term) && !translated.includes(term)) {
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
