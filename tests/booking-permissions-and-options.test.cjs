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
});
test('team can manage bookings without technical internal-API messages on UI', () => {
  assert.match(src('pages/AdminReservations.tsx'), /CreateTeamBooking/);
  assert.match(src('pages/AdminReservations.tsx'), /BookingStatusActions/);
  assert.doesNotMatch(src('pages/AdminReservations.tsx'), /Aktuální API neposkytuje/);
});
test('offices are included in the resource booking category description', () => {
  const wizard=src('pages/SetupWizard.tsx');
  assert.match(wizard, /kanceláře a coworkingové prostory/);
  assert.match(wizard, /stůl, zasedací místnost nebo kancelář/);
});
