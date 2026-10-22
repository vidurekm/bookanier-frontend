const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');

test('customer creation includes an internal note and customer rows can be deleted', () => {
  const customers = read('pages/AdminCustomers.tsx');
  assert.match(customers, /<Field label=\{tr\("Internal note"\)\}>/);
  assert.match(customers, /json\(edit \? 'PUT' : 'POST', form\)/);
  assert.match(customers, /`\/customers\/\$\{id\}`.*method: 'DELETE'/);
  assert.match(customers, /remove\.mutate\(c\.id\)/);
});

test('table record counts use the consistent label-colon-count format', () => {
  const checks = [
    ['pages/AdminCustomers.tsx', 'Customer count'],
    ['pages/AdminLocations.tsx', 'Location count'],
    ['pages/AdminServices.tsx', 'Service count'],
    ['pages/AdminTeam.tsx', 'Team member count'],
    ['pages/AdminResources.tsx', 'Resource count']
  ];
  for (const [file, label] of checks) {
    assert.match(read(file), new RegExp(`tr\\('${label}'\\)\\}: \\{`));
  }
});
