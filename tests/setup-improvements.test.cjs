const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (file) => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
test('verification uses existing branded login layout with only login success action', () => {
  const auth=src('pages/AuthPages.tsx');
  assert.match(auth, /<AuthLayout title=.*Ov/);
  assert.match(auth, /<BrandLogo light tagline\/>/);
  assert.match(auth, /to="\/login"/);
  assert.doesNotMatch(auth, /className="btn btn-secondary" to="\/"/);
});
test('setup separates owner reservability, reception and branch opening slots', () => {
  const wizard=src('pages/SetupWizard.tsx');
  assert.match(wizard, /ownerProvidesServices/);
  assert.match(wizard, /providesServices/);
  assert.match(wizard, /Otevírací doba/);
  assert.match(wizard, /Přidat interval/);
  assert.match(wizard, /locationIndex/);
});
