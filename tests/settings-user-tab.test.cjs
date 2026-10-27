const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (relative) => fs.readFileSync(path.join(__dirname, '..', 'src', relative), 'utf8');

test('organization and user account settings are tabs in the admin workspace', () => {
  const settings = src('pages/AdminSettings.tsx');
  const shell = src('components/AdminShell.tsx');
  assert.match(settings, /tr\("Organization"\)/);
  assert.match(settings, /tr\("User"\)/);
  assert.match(settings, /<AccountSettingsPanel\/>/);
  assert.match(settings, /access\.canWrite/);
  assert.match(shell, /'settings'\]\.includes\(l\.path\)/);
  assert.match(shell, /\/admin\/settings\?tab=user/);
});

test('organization settings keep photos inline and expose customer settings without retired cards', () => {
  const settings = src('pages/AdminSettings.tsx');
  assert.match(settings, /kind="organization-logo"[^>]*single/);
  assert.match(settings, /kind="organization"/);
  assert.match(settings, /tr\("Customers"\)/);
  assert.doesNotMatch(settings, /Booking link|Project information|Booking model is locked|tab:'photos'/);
  const publicBooking = src('pages/PublicBookingPage.tsx');
  assert.match(publicBooking, /organization-logo/);
  assert.match(publicBooking, /orderedPhotos\.map/);
  assert.match(publicBooking, /Number\(b\.primary\)-Number\(a\.primary\)/);
});

test('organization settings show the selected booking type as read-only', () => {
  const settings = src('pages/AdminSettings.tsx');
  const translations = src('lib/setupTranslations.ts');
  assert.match(settings, /businessTypeLabel\(setup\?\.template_key\)/);
  assert.match(settings, /<Input value=\{businessTypeLabel\(setup\?\.template_key\)\} readOnly\/>/);
  assert.match(translations, /RENTAL: st\('Equipment rentals'\)/);
  assert.match(translations, /EVENTS: st\('Classes and events'\)/);
});

test('default class capacity is only available for event organizations', () => {
  const settings = src('pages/AdminSettings.tsx');
  assert.match(settings, /\{setup\?\.booking_model==='EVENT'&&<Field label=\{st\('Default class capacity'\)\}/);
});

test('team settings let an owner distinguish service providers from receptionists', () => {
  const team = src('pages/AdminTeam.tsx');
  const types = src('lib/types.ts');
  const setupTranslations = src('lib/setupTranslations.ts');
  assert.match(team, /providesServices: m\.provides_services\?\?true/);
  assert.match(team, /checked=\{form\.providesServices\}/);
  assert.match(team, /providesServices:e\.target\.checked/);
  assert.match(types, /provides_services\?: boolean/);
  assert.match(setupTranslations, /Turn this off for receptionists/);
});

test('destructive settings use separate cards and settings actions stay compact and right-aligned', () => {
  const settings = src('pages/AdminSettings.tsx');
  const account = src('pages/AccountPage.tsx');
  const styles = src('styles.css');
  assert.match(settings, /<Card className="danger-zone">/);
  assert.match(account, /<Card className="danger-zone">/);
  assert.match(settings, /className="settings-button-row"><Button loading=\{saveOpts\.isPending\}/);
  assert.match(account, /className="settings-button-row"><Button type="submit" loading=\{saveName\.isPending\}/);
  assert.match(styles, /\.settings-button-row\{display:flex;justify-content:flex-end\}/);
  assert.doesNotMatch(styles, /\.account-grid>\.card:last-child\{grid-column:1\/-1\}/);
});

test('email and password changes open modal forms', () => {
  const account = src('pages/AccountPage.tsx');
  assert.match(account, /setEmailOpen\(true\)/);
  assert.match(account, /setPasswordOpen\(true\)/);
  assert.match(account, /emailOpen&&<Modal/);
  assert.match(account, /passwordOpen&&<Modal/);
});
