const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (relative) => fs.readFileSync(path.join(__dirname, '..','src',relative),'utf8');

test('owner can configure worker selection and customer language independently', () => {
  assert.match(src('pages/SetupWizard.tsx'), /showStaffChoice/);
  assert.match(src('pages/AdminSettings.tsx'), /defaultPublicLanguage/);
  assert.match(src('pages/AdminSettings.tsx'), /defaultCurrency/);
  assert.match(src('pages/PublicBookingPage.tsx'), /showStaffChoice===false/);
  assert.match(src('main.tsx'), /defaultPublicLanguage/);
  assert.match(src('lib/bookingOptions.ts'), /CZK/);
  assert.match(src('lib/bookingOptions.ts'), /PLN/);
  assert.match(src('lib/bookingOptions.ts'), /EUR/);
});
test('member privilege editor and absence workflow use dedicated permissions', () => {
  const team = src('pages/AdminTeam.tsx');
  const absences = src('pages/AdminAbsenceRequests.tsx');
  assert.match(team, /access\?\.isOwner/);
  assert.match(team, /canManageBookings/);
  assert.match(team, /canApproveOwnAbsence/);
  assert.match(absences, /absence-requests/);
  assert.match(absences, /describeIntervals\(row\.intervals\)/);
  assert.match(absences, /approve/);
  assert.match(absences, /reject/);
  assert.match(absences, /<Card><div className="stack">/);
  assert.ok(absences.indexOf('<Notice message={error}/>') < absences.indexOf('<div className="form-grid">'));
  assert.match(src('styles.css'), /\.stack>\.notice \{margin-bottom:0;\}/);
  assert.match(src('styles.css'), /\.form-grid>\.notice \{grid-column:1\/-1;\}/);
});
test('team can manage bookings without technical internal-API messages on UI', () => {
  assert.match(src('pages/AdminReservations.tsx'), /CreateTeamBooking/);
  assert.match(src('pages/AdminReservations.tsx'), /BookingStatusActions/);
  assert.doesNotMatch(src('pages/AdminReservations.tsx'), /Aktuální API neposkytuje/);
});
test('overview only shows management tiles and quick actions the current user can access', () => {
  const overview = src('pages/AdminOverview.tsx');
  assert.match(overview, /const canWrite = access\.data\?\.canWrite === true/);
  assert.match(overview, /enabled: canWrite/);
  assert.match(overview, /\{canWrite && <div[\s\S]*label={st\('Locations'\)}[\s\S]*label={st\('Team'\)}/);
  assert.match(overview, /canManageBookings && model !== 'EVENT'/);
  assert.match(overview, /hasMember\s*\?[\s\S]*'\/admin\/absence-requests'/);
});
test('offices are included in the resource booking category description', () => {
  const wizard=src('pages/SetupWizard.tsx');
  assert.match(wizard, /offices and coworking spaces/);
  assert.match(wizard, /table, meeting room or office/);
});
test('services can be permanently deleted through the guarded API action', () => {
  const page = src('pages/AdminServices.tsx');
  const api = src('lib/errors.ts');
  assert.match(page, /method: 'DELETE'/);
  assert.match(page, /useConfirm/);
  assert.match(page, /await confirm\(tr\('Delete this service\?/);
  assert.match(page, /title={tr\('Delete service'\)}/);
  assert.match(page, /<Notice message={deleteError}\s*\/>/);
  assert.match(api, /'SERVICE_IN_USE'/);
});
