const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (relative) => fs.readFileSync(path.join(__dirname, '..', 'src', relative), 'utf8');

test('media changes are staged until the shared Save changes action', () => {
  const gallery = src('components/MediaGallery.tsx');
  assert.match(gallery, /setUploads\(current => \[\.\.\.current, upload\]\)/);
  assert.match(gallery, /setPrimaryKey\(String\(image\.id\)\)/);
  assert.match(gallery, /setRemovedIds\(current => new Set\(current\)\.add\(image\.id\)\)/);
  assert.match(gallery, /const save = useMutation/);
  assert.match(gallery, /method: 'POST', body/);
  assert.match(gallery, /mediaId: image\.id/);
  assert.match(gallery, /\(data \?\? \[\]\)\.filter\(item => removedIds\.has\(item\.id\)/);
  assert.match(gallery, /method: 'DELETE'/);
  assert.match(gallery, /onClick=\{\(\) => save\.mutate\(\)\}\>\{tr\('Save changes'\)\}/);
  assert.doesNotMatch(gallery, /unused file later in media management/);
  assert.doesNotMatch(src('lib/translations.ts'), /unused file later in media management/);
  assert.doesNotMatch(gallery, /onSuccess: \(\) => \{ setError\(tr\(""\)\); setSuccess\(tr\("Image uploaded\."\)\)/);
});

test('photo tabs keep staged edits mounted and save without a duplicate cancel action', () => {
  const location = src('pages/AdminLocations.tsx');
  const resources = src('pages/AdminResources.tsx');
  const team = src('pages/AdminTeam.tsx');
  const service = src('pages/AdminServices.tsx');
  assert.match(location, /display:editTab==='photos'\?undefined:'none'.*<MediaGallery/s);
  assert.match(location, /target=\{edit\.id\} onSaved=\{\(\) => setEdit\(undefined\)\}/);
  assert.match(resources, /display:editTab==='photos'\?undefined:'none'.*kind="resource"/s);
  assert.match(resources, /display:editTab==='photos'\?undefined:'none'.*kind="resource-type"/s);
  assert.match(team, /display:editTab==='photos'\?undefined:'none'.*kind="member"/s);
  assert.match(service, /target=\{service\.id\} saveManagedExternally onSaved=\{onSaved\}/);
  assert.doesNotMatch(src('components/MediaGallery.tsx'), /tr\(['"]Cancel['"]\)/);
});
