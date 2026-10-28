const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (relative) => fs.readFileSync(path.join(__dirname, '..', 'src', relative), 'utf8');

test('table row actions use a pencil for editing and an eye for viewing', () => {
  const customers = src('pages/AdminCustomers.tsx');
  const bookingCustomers = src('pages/AdminBookingCustomers.tsx');

  assert.match(customers, /className="icon-button" title=\{tr\("Edit"\)\}[\s\S]*?<Pencil size=\{17\}\/>/);
  assert.match(bookingCustomers, /title=\{tr\('View reservations'\)\}[\s\S]*?<Eye size=\{17\}\/>/);
  assert.doesNotMatch(bookingCustomers, /<ChevronRight size=\{17\}\/>/);
});

test('customer names use shared initials avatars and overview rows match table hover states', () => {
  const customers = src('pages/AdminCustomers.tsx');
  const bookingCustomers = src('pages/AdminBookingCustomers.tsx');
  const overview = src('pages/AdminOverview.tsx');
  const styles = src('styles.css');

  assert.match(customers, /nameInitials\(c\.name\)/);
  assert.match(bookingCustomers, /nameInitials\(customer\.name\)/);
  assert.match(overview, /nameInitials\(b\.customer_name\)/);
  assert.match(styles, /\.data-table tbody tr:hover\{background:#fbfdfc\}/);
  assert.match(styles, /\.overview-booking-button:hover\{background:#fbfdfc\}/);
  assert.match(styles, /\.icon-button:hover\{background:var\(--accent-soft\);color:var\(--accent\)\}/);
  assert.match(styles, /\.overview-booking-icon:hover[^}]*background:var\(--accent-soft\);color:var\(--accent\)/);
});
