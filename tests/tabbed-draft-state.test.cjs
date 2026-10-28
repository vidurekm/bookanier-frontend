const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (relative) => fs.readFileSync(path.join(__dirname, '..', 'src', relative), 'utf8');

test('tabbed service and location editors keep visited panels mounted when switching tabs', () => {
  const services = src('pages/AdminServices.tsx');
  const locations = src('pages/AdminLocations.tsx');
  const team = src('pages/AdminTeam.tsx');

  assert.match(services, /visitedTabs\.has\('booking'\)[\s\S]*display: activeTab === 'booking' \? undefined : 'none'/);
  assert.match(services, /visitedTabs\.has\('resources'\)[\s\S]*display: activeTab === 'resources' \? undefined : 'none'/);
  assert.match(locations, /visitedTabs\.has\('hours'\)[\s\S]*display: tab === 'hours' \? undefined : 'none'/);
  assert.match(locations, /visitedTabs\.has\('exceptions'\)[\s\S]*display: tab === 'exceptions' \? undefined : 'none'/);
  assert.match(locations, /visitedTabs\.has\('services'\)[\s\S]*display: tab === 'services' \? undefined : 'none'/);
  assert.match(team, /display: tab === 'services' \? undefined : 'none'/);
});

test('service detail saves staged booking and resource settings with one shared action', () => {
  const services = src('pages/AdminServices.tsx');

  assert.match(services, /MemberDetailSaveProvider value=\{registerSave\}/);
  assert.match(services, /useMemberDetailSave\(`booking-options-\$\{service\}`, 0, dirty/);
  assert.match(services, /useMemberDetailSave\(`resource-requirements-\$\{service\}`, 1, dirty/);
  assert.match(services, /<MediaGallery[^>]*saveManagedExternally/);
  assert.match(services, /tr\('Save all changes'\)/);
  assert.doesNotMatch(services, /tr\("Save booking options"\)/);
  assert.doesNotMatch(services, /tr\("Save requirements"\)/);
});
