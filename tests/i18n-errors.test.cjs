const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../src/lib');
let language = 'cs';
const preferences = { currentLanguage: () => language };
function load(name, dependencies = {}) {
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: (id) => dependencies[id] || (id === './preferences' ? preferences : (() => { throw new Error(`Unknown import: ${id}`); })()) });
  return module.exports;
}
const translations = load('translations.ts');
const errors = load('errors.ts', { './translations': translations });

test('all supported languages translate navigation and booking', () => {
  const expected = { cs: 'Rezervace', sk: 'Rezervácie', pl: 'Rezerwacje', en: 'Bookings' };
  for (const [locale, result] of Object.entries(expected)) {
    language = locale;
    assert.equal(translations.tr('Rezervace'), result);
    assert.ok(translations.tr('Potvrdit rezervaci'));
    assert.ok(errors.errorMessage('SLOT_UNAVAILABLE'));
  }
});

test('known machine error code maps to a localized message', () => {
  language = 'en';
  assert.equal(errors.knownErrorCode('SLOT_UNAVAILABLE'), 'SLOT_UNAVAILABLE');
  assert.equal(errors.statusErrorCode(409), 'CONFLICT');
  assert.match(errors.safeErrorMessage(new errors.ApiError(409, 'SLOT_UNAVAILABLE')), /no longer available/);
});

test('server-supplied text never appears in the UI', () => {
  language = 'en';
  const malicious = '<img src=x onerror=alert(1)> Internal database password';
  assert.doesNotMatch(errors.safeErrorMessage(new Error(malicious)), /password|onerror/i);
  assert.equal(errors.knownErrorCode(malicious), undefined);
  assert.doesNotMatch(errors.safeErrorMessage(new errors.ApiError(500, 'SERVER_ERROR')), /password|onerror/i);
});

test('local validation messages are translated', () => {
  language = 'pl';
  assert.match(errors.safeErrorMessage(new errors.UiError('Vyberte pracovníka.')), /Wybierz pracownika/);
});
