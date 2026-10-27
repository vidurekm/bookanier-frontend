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
const setupTranslations = load('setupTranslations.ts', { './translations': translations });
const errors = load('errors.ts', { './translations': translations });

test('all supported languages translate navigation and booking', () => {
  const expected = { cs: 'Rezervace', sk: 'Rezervácie', pl: 'Rezerwacje', en: 'Bookings' };
  for (const [locale, result] of Object.entries(expected)) {
    language = locale;
    assert.equal(translations.tr('Bookings'), result);
    assert.ok(translations.tr('Potvrdit rezervaci'));
    assert.ok(errors.errorMessage('SLOT_UNAVAILABLE'));
  }
  language = 'cs';
  assert.equal(translations.tr('Invite staff member'), 'Pozvat zaměstnance');
  assert.equal(translations.tr('Organization logo'), 'Logo organizace');
  assert.equal(translations.tr('Customers'), 'Zákazníci');
  assert.equal(translations.tr('Good morning, Jane 👋'), 'Dobré ráno, Jano 👋');
  language = 'en';
  assert.equal(translations.tr('Invite staff member'), 'Invite staff member');
});

test('setup and group-event screens are localized in Czech and other supported languages', () => {
  const expected = {
    cs: ['Nastavit Bookanear', 'Zákazníci si rezervují pracovníka, službu a konkrétní termín.', 'Vytvořit lekci'],
    sk: ['Nastavenie Bookanear', 'Zákazník si rezervuje pracovníka, službu a konkrétny čas.', 'Vytvoriť lekciu'],
    pl: ['Konfiguracja Bookanear', 'Klient rezerwuje pracownika, usługę i konkretny termin.', 'Utwórz zajęcia'],
    en: ['Set up Bookanear', 'Customers book a staff member, service and time slot.', 'Create a class'],
  };
  for (const [locale, values] of Object.entries(expected)) {
    language = locale;
    assert.deepEqual([
      setupTranslations.st('Set up Bookanear'),
      setupTranslations.st('Customers book a staff member, service and time slot.'),
      setupTranslations.st('Create a class'),
    ], values);
  }
  language = 'cs';
  assert.equal(setupTranslations.st('Opening-hours intervals per week: {intervals}', { intervals: 14 }), 'Počet intervalů otevírací doby za týden: 14');
});

test('email examples and form validation messages use the selected language', () => {
  const expected = {
    cs: ['vas@email.cz', 'Vyplňte prosím toto pole.'],
    sk: ['vas@email.sk', 'Vyplňte, prosím, toto pole.'],
    pl: ['twoj@email.pl', 'Wypełnij to pole.'],
    en: ['your@email.com', 'Please fill out this field.'],
  };
  for (const [locale, [email, required]] of Object.entries(expected)) {
    language = locale;
    assert.equal(translations.tr('your@email.com'), email);
    assert.equal(translations.tr('Please fill out this field.'), required);
  }
  language = 'cs';
});

test('registration examples use the selected language', () => {
  const expected = {
    cs: ['Např. Studio Aurora', 'Jana Nováková'],
    sk: ['Napr. Štúdio Aurora', 'Jana Nováková'],
    pl: ['Np. Studio Aurora', 'Anna Kowalska'],
    en: ['e.g. Aurora Studio', 'Jane Smith'],
  };
  for (const [locale, [organization, name]] of Object.entries(expected)) {
    language = locale;
    assert.equal(translations.tr('e.g. Aurora Studio'), organization);
    assert.equal(translations.tr('Jane Smith'), name);
  }
  language = 'cs';
});

test('known machine error code maps to a localized message', () => {
  language = 'en';
  assert.equal(errors.knownErrorCode('SLOT_UNAVAILABLE'), 'SLOT_UNAVAILABLE');
  assert.equal(errors.statusErrorCode(409), 'CONFLICT');
  assert.match(errors.safeErrorMessage(new errors.ApiError(409, 'SLOT_UNAVAILABLE')), /no longer available/);
  assert.match(errors.safeErrorMessage(new errors.ApiError(409, 'SERVICE_IN_USE')), /cannot be deleted/);
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
  assert.match(errors.safeErrorMessage(new errors.UiError('Choose a staff member.')), /Wybierz pracownika/);
});
