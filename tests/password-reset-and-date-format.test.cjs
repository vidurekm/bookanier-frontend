const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const read = name=>fs.readFileSync(path.join(root,'src',name),'utf8');

test('password recovery uses branded frontend screens and unauthed API endpoints',()=>{
  const routes=read('App.tsx'),auth=read('pages/AuthPages.tsx');
  for(const path of ['/login','/register','/verify-email','/forgot-password','/reset-password','/reservations/:publicId'])
    assert.ok(routes.includes(`path="${path}"`),path);
  assert.match(auth,/<BrandLogo light tagline\/>/);
  assert.match(auth,/auth\/password\/forgot/);
  assert.match(auth,/auth\/password\/reset/);
  assert.match(auth,/newPassword:password/);
  assert.match(auth,/if\(password!==confirmation\)/);
});

test('legacy Czech route paths redirect to English slugs without losing query parameters',()=>{
  const app=read('App.tsx');
  assert.match(app,/path="\/rezervace\/:publicId"/);
  assert.match(app,/to="\/reservations\/:publicId"/);
  assert.match(app,/loc\.search\+loc\.hash/);
  assert.match(read('pages/AdminSettings.tsx'),/\/reservations\/\$\{org\.public_id\}/);
});

test('date-only values never shift with timezone and owner can set display format',()=>{
  const source=read('lib/dateFormat.ts');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exportsObject={};new Function('exports','require',compiled)(exportsObject,require);
  assert.equal(exportsObject.formattedDate('2026-10-21','DD.MM.YYYY'),'21.10.2026');
  assert.equal(exportsObject.formattedDate('2026-10-21','MM/DD/YYYY'),'10/21/2026');
  assert.equal(exportsObject.formattedDate('2026-10-21','YYYY-MM-DD'),'2026-10-21');
  assert.match(read('pages/AdminSettings.tsx'),/dateFormats\.map/);
  assert.match(read('pages/SetupWizard.tsx'),/dateFormats\.map/);
  assert.match(read('components/DateExceptions.tsx'),/formattedDate\(date\)/);
});
