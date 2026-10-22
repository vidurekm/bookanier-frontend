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

test('email and password changes open modal forms', () => {
  const account = src('pages/AccountPage.tsx');
  assert.match(account, /setEmailOpen\(true\)/);
  assert.match(account, /setPasswordOpen\(true\)/);
  assert.match(account, /emailOpen&&<Modal/);
  assert.match(account, /passwordOpen&&<Modal/);
});
