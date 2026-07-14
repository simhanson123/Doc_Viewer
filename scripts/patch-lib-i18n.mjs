import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const keys = {
  removeFromLibrary: 'Remove from library',
  removeFromLibraryHint: 'Remove from library only (source file is kept)',
  removeFromLibraryConfirm:
    'Remove this document from the library?\n\nThe original file on disk will NOT be deleted.',
  toastRemovedFromLib: 'Removed from library (file kept on disk)',
};

const dir = 'src/i18n/locales';
const block =
  Object.entries(keys)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`)
    .join('\n') + '\n';

for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
  if (f === 'en.ts' || f === 'ko.ts' || f === 'rest.ts') continue;
  const path = join(dir, f);
  let s = readFileSync(path, 'utf8');
  if (s.includes('removeFromLibrary:')) {
    console.log('skip', f);
    continue;
  }
  if (s.includes('toastPdfProtected:')) {
    s = s.replace(/(toastPdfProtected: [^\n]+\n)/, `$1${block}`);
  } else if (s.includes('emptyDoc:')) {
    s = s.replace(/(emptyDoc:)/, `${block}  $1`);
  } else {
    console.log('no anchor', f);
    continue;
  }
  writeFileSync(path, s);
  console.log('patched', f);
}
