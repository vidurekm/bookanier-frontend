const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.resolve(__dirname, '../src', name), 'utf8');

test('email inputs require a domain suffix, not just browser type=email', () => {
  const ui = read('components/UI.tsx');
  const match = ui.match(/export const EMAIL_PATTERN = String\.raw`([^`]+)`/);
  assert.ok(match, 'common Input must define an email pattern');
  const pattern = new RegExp(`^(?:${match[1]})$`, 'v');
  for (const invalid of ['df@s', 'foo@localhost', 'person@domain.c', 'person@.cz', 'x@@example.cz']) {
    assert.equal(pattern.test(invalid), false, `reject ${invalid}`);
  }
  for (const valid of ['df@s.cz', 'user@example.com', 'john+tag@example.co.uk', 'person@sub.example.test']) {
    assert.equal(pattern.test(valid), true, `accept ${valid}`);
  }
  assert.match(ui, /props\.type === 'email' \? EMAIL_PATTERN/);
  assert.match(ui, /validationMessage\(event\.currentTarget\)/);
  assert.match(ui, /Please fill out this field\./);
});

test('registration, invitation acceptance and password reset allow 8–128 character passwords', () => {
  const page = read('pages/AuthPages.tsx');
  const translations = read('lib/translations.ts');
  assert.match(page, /language:\s*currentLanguage\(\)/);
  assert.equal((page.match(/minLength=\{8\}/g) || []).length, 4);
  assert.equal((page.match(/maxLength=\{128\}/g) || []).length, 4);
  assert.doesNotMatch(page, /minLength=\{12\}/);
  assert.match(translations, /Heslo \(min\. 8 znaků\)/);
  assert.match(translations, /Nové heslo \(min\. 8 znaků\)/);
});
