const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const src = (relative) => fs.readFileSync(path.join(__dirname, '..', 'src', relative), 'utf8');
const source = src('lib/locale.ts');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exportsObject={};
new Function('exports','require',compiled)(exportsObject,require);

test('localized URLs are shareable and preserve deep-link paths', () => {
  const {urlLocale, localizedPath}=exportsObject;
  assert.match(source, /DEFAULT_LANGUAGE:\s*Language\s*=\s*'en'/);
  assert.match(source, /urlLocale\(window\.location\.pathname\)\s*\|\|\s*DEFAULT_LANGUAGE/);
  assert.match(src('main.tsx'), /let desired:\s*Language\s*=\s*DEFAULT_LANGUAGE/);
  assert.equal(urlLocale('/pl/'), 'pl');
  assert.equal(urlLocale('/en/admin/tym'), 'en');
  assert.equal(urlLocale('/'), null);
  assert.equal(localizedPath('/', 'pl'), '/pl');
  assert.equal(localizedPath('/admin/prehled', 'cs'), '/cs/admin/prehled');
  assert.equal(localizedPath('/cs/rezervace/uuid', 'pl'), '/pl/rezervace/uuid');
  assert.equal(localizedPath('/pl/prihlaseni', 'sk'), '/sk/prihlaseni');
  assert.equal(localizedPath('/pl', 'en'), '/en');
});
test('all language routes work with router basename; public URL shares locale', () => {
  assert.match(src('main.tsx'), /BrowserRouter basename=\{localeBasename\}/);
  assert.match(src('lib/preferences.tsx'), /window\.location\.assign\(localizedPath/);
  assert.match(src('pages/AdminSettings.tsx'), /opts\.defaultPublicLanguage/);
  assert.match(src('main.tsx'), /defaultPublicLanguage/);
});
test('address verification is explicit, coordinates do not survive address edits', () => {
  const lookup = src('components/AddressVerify.tsx');
  assert.match(lookup, /onClick=\{verify\}/);
  assert.match(lookup, /geocoding\/address/);
  assert.match(lookup, /OpenStreetMap contributors/);
  assert.match(src('pages/SetupWizard.tsx'), /latitude:null,longitude:null/);
  assert.match(src('pages/AdminLocations.tsx'), /latitude: null, longitude: null/);
  assert.match(src('pages/AdminLocations.tsx'), /latitude: form.latitude, longitude: form.longitude/);
});
test('exceptions preview conflicts and never auto-cancel booked reservations', () => {
  const code = src('components/DateExceptions.tsx');
  assert.match(code, /dryRun=true/);
  assert.match(code, /conflictCount\+=preview\.conflictCount/);
  assert.match(code, /if\(conflictCount>0\)/);
  assert.doesNotMatch(code, /cancelConflictingReservations=true/);
  assert.match(code, /method:'DELETE'/);
  assert.match(src('pages/AdminTeam.tsx'), /DateExceptions/);
  assert.match(src('pages/AdminLocations.tsx'), /DateExceptions/);
});
test('saved exceptions can only be staged for deletion, not edited or overwritten', () => {
  const code = src('components/DateExceptions.tsx');
  assert.doesNotMatch(code, /editDay|editingDate|tr\('Edit'\)/);
  assert.match(code, /setStaged\(current=>\(\{\.\.\.current,\[day.date\]:null\}\)\)/);
  assert.match(code, /tr\('Delete exception'\)/);
  assert.match(code, /entries.some\(day=>day.date===date\)/);
  assert.match(code, /tr\('Undo pending change'\)/);
  const save = code.slice(code.indexOf('const saveDraft='), code.indexOf('useMemberDetailSave('));
  assert.match(save, /changedDate\}\?dryRun=true`,\{method:'DELETE'\}/);
  assert.match(save, /changedDate\}`,\{method:'DELETE'\}/);
  assert.ok(save.indexOf('if(conflictCount>0)') < save.lastIndexOf("method:'DELETE'"));
});
test('dashboard stat tiles link to respective pages', () => {
  const code = src('pages/AdminOverview.tsx');
  assert.match(code, /className="stat-card-link"/);
  for (const part of ['/admin/reservations','/admin/locations','/admin/team','/admin/events']) assert.ok(code.includes(part));
});
