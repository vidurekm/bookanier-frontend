const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Bookanear brand assets and metadata are present', () => {
  for (const file of ['public/favicon.png', 'public/brand/icon.png', 'public/brand/wordmark.png', 'public/brand/lockup.png']) {
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  }
  assert.match(read('index.html'), /https:\/\/bookanear\.online\//);
  assert.match(read('index.html'), /Bookanear/);
  assert.equal(JSON.parse(read('package.json')).name, 'bookanear-frontend');
});

test('all key frontend entry points use the reusable logo', () => {
  for (const file of ['src/pages/HomePage.tsx', 'src/pages/AuthPages.tsx', 'src/pages/PublicBookingPage.tsx', 'src/pages/ManageBookingPage.tsx', 'src/components/AdminShell.tsx']) {
    assert.match(read(file), /<BrandLogo/);
    assert.doesNotMatch(read(file), /rezervo/i);
  }
  assert.match(read('src/components/AdminShell.tsx'), /to="\/admin\/overview"/);
});

test('API URL and four languages stay compatible', () => {
  assert.match(read('src/lib/api.ts'), /const ROOT = '\/api\/v1'/);
  for (const lang of ["'cs'", "'sk'", "'pl'", "'en'"]) assert.ok(read('src/lib/preferences.tsx').includes(lang));
  assert.match(read('src/App.tsx'), /path="\/verify-email"/);
});
