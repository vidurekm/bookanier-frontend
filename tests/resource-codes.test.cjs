const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const api = path.resolve(root,'../bookanear-api');
const read = (p)=>fs.readFileSync(p,'utf8');

test('resource types have canonical keys separate from user labels',()=>{
  const migration = read(path.join(api,'src/main/resources/db/migration/V11__language_neutral_resource_codes.sql'));
  assert.match(migration, /ADD COLUMN code text/);
  for (const code of ['staff','table','chair','equipment']) assert.match(migration,new RegExp(`'${code}'`));
  assert.match(migration, /UPDATE resources r\s+SET resource_type = rt.code/);
  assert.match(migration, /UPDATE service_resource_requirements req\s+SET resource_type = rt.code/);
  assert.match(migration, /CREATE UNIQUE INDEX resource_types_org_code_unique/);
  assert.match(migration, /resources_type_code_ascii/);
  assert.match(migration, /service_requirements_type_code_ascii/);
});

test('setup and backoffice write type codes, not translated labels',()=>{
  const setup = read(path.join(api,'src/main/java/online/bookanear/api/service/SetupService.java'));
  const backoffice = read(path.join(api,'src/main/java/online/bookanear/api/service/BackofficeService.java'));
  assert.match(setup, /m\.display_name,'staff',:type/);
  assert.match(setup, /VALUES\(:sid,'staff',:type/);
  assert.match(setup, /resourceTypeCode\(equipmentType\)/);
  assert.match(backoffice, /type\.get\("code"\)/);
  assert.match(backoffice, /SELECT :service,rt.code,rt.id/);
});

test('service requirements expose non-staff resources and preserve automatic staff requirements',()=>{
  const page = read(path.join(root,'src/pages/AdminServices.tsx'));
  const backoffice = read(path.join(api,'src/main/java/online/bookanear/api/service/BackofficeService.java'));
  assert.match(page, /data\?\.filter\(r=>r\.category!=='staff'&&\(!appointment\|\|r\.category!=='space'\)\)/);
  assert.match(page, /types\.data\?\.filter\(type=>type\.category!=='staff'&&\(!appointment\|\|type\.category!=='space'\)\)/);
  assert.match(page, /Staff availability is managed in Team/);
  assert.match(backoffice, /DELETE FROM service_resource_requirements req\s+USING resource_types rt/);
  assert.match(backoffice, /rt\.category<>'staff'/);
  assert.match(backoffice, /if \(staffTypes\.contains\(req\.resourceTypeId\(\)\)\) continue;/);
});

test('minimum people capacity is shown only for space requirements',()=>{
  const page = read(path.join(root,'src/pages/AdminServices.tsx'));
  assert.match(page, /selectedType\?\.category==='space'/);
  assert.match(page, /Min\. people/);
  assert.match(page, /category==='space' \? x\.minCapacity : ''/);
  assert.match(page, /resourceTypeLabel\(t\)/);
  assert.match(page, /tr\(resourceCategories\[t\.category\] \|\| t\.category\)/);
  assert.doesNotMatch(page, /Minimum number of people this room or table must fit/);
});

test('service management guidance and examples are translated',()=>{
  const page = read(path.join(root,'src/pages/AdminServices.tsx'));
  const translations = read(path.join(root,'src/lib/translations.ts'));
  for (const key of [
    'For example, one chair, room, or two pieces of equipment.',
    'Add equipment or rooms needed for this service. Staff availability is managed in Team.',
  ]) {
    assert.match(page, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(translations, new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
});

test('space requirements are hidden only for appointment services and preserved on save',()=>{
  const page = read(path.join(root,'src/pages/AdminServices.tsx'));
  assert.match(page, /appointment=\{setup\?\.booking_model==='APPOINTMENT'\}/);
  assert.match(page, /appointment: boolean/);
  assert.match(page, /const hiddenSpaces=appointment\?/);
  assert.match(page, /r\.category==='space'/);
  assert.match(page, /type\.category!=='space'/);
  assert.match(page, /\.\.\.hiddenSpaces/);
});

test('resources can be deleted when unused while reservation and team resources are protected',()=>{
  const page = read(path.join(root,'src/pages/AdminResources.tsx'));
  const controller = read(path.join(api,'src/main/java/online/bookanear/api/controller/BackofficeController.java'));
  const backoffice = read(path.join(api,'src/main/java/online/bookanear/api/service/BackofficeService.java'));
  assert.match(page, /title=\{tr\("Delete resource"\)\}/);
  assert.match(page, /visibleResources\.map\(r =>/);
  assert.match(controller, /@DeleteMapping\("\/\{org\}\/locations\/\{loc\}\/resources\/\{id\}"\)/);
  assert.match(backoffice, /FROM reservation_resources\s+WHERE organization_id=:org AND location_id=:loc AND resource_id=:id/);
  assert.match(backoffice, /resource\.get\("member_id"\) != null/);
  assert.match(backoffice, /DELETE FROM resource_images WHERE organization_id=:org AND resource_id=:id/);
});

test('resource photos are managed from the edit dialog tabs, not table actions',()=>{
  const page = read(path.join(root,'src/pages/AdminResources.tsx'));
  assert.match(page, /editTab === 'photos'[\s\S]*tr\('Photos'\)/);
  assert.match(page, /kind="resource" target=\{edit\.id\}/);
  assert.match(page, /kind="resource-type" target=\{editType\.id\}/);
  assert.doesNotMatch(page, /title=\{tr\("Photos"\)\}/);
  assert.doesNotMatch(page, /setPhotos/);
});

test('staff resource types and staff resources stay hidden from resource administration',()=>{
  const page = read(path.join(root,'src/pages/AdminResources.tsx'));
  const backoffice = read(path.join(api,'src/main/java/online/bookanear/api/service/BackofficeService.java'));
  assert.match(page, /type\.category !== 'staff'/);
  assert.match(page, /resource\.category !== 'staff'/);
  assert.match(page, /getSetup\(orgId\)/);
  assert.match(page, /setup\.data\?\.booking_model === 'APPOINTMENT'/);
  assert.match(page, /!appointment \|\| category === 'equipment'/);
  assert.doesNotMatch(page, /staff: 'Employee'/);
  assert.match(page, /Manage rooms, tables, and equipment/);
  assert.match(backoffice, /if \(appointmentModel\(org\) && !"equipment"\.equals\(r\.category\(\)\)\)/);
  assert.match(backoffice, /private boolean appointmentModel\(long org\)/);
});

test('resource types can be deleted when unused and are protected while assigned',()=>{
  const page = read(path.join(root,'src/pages/AdminResources.tsx'));
  const controller = read(path.join(api,'src/main/java/online/bookanear/api/controller/BackofficeController.java'));
  const backoffice = read(path.join(api,'src/main/java/online/bookanear/api/service/BackofficeService.java'));
  assert.match(page, /title=\{tr\("Delete resource type"\)\}/);
  assert.match(page, /`\/resource-types\/\$\{id\}`/);
  assert.match(controller, /@DeleteMapping\("\/\{org\}\/resource-types\/\{id\}"\)/);
  assert.match(backoffice, /public void deleteResourceType\(long org, long id\)/);
  assert.match(backoffice, /EXISTS\(SELECT 1 FROM resources WHERE organization_id=:org AND resource_type_id=:id\)/);
  assert.match(backoffice, /EXISTS\(SELECT 1 FROM service_resource_requirements WHERE resource_type_id=:id\)/);
  assert.match(backoffice, /DELETE FROM resource_type_images WHERE organization_id=:org AND resource_type_id=:id/);
  assert.match(backoffice, /"RESOURCE_TYPE_IN_USE"/);
});

test('built-in labels render in UI locale and custom names are not translated',()=>{
  const labels = read(path.join(root,'src/lib/resourceTypeLabels.ts'));
  const page = read(path.join(root,'src/pages/AdminResources.tsx'));
  assert.match(labels,/type\.name/);
  assert.match(labels,/tr\(system\.key\)/);
  assert.match(page,/resourceTypeLabel\(t\)/);
  assert.match(page,/resourceTypeLabel\(\{code:r\.resource_type,name:r\.resource_type_name\}\)/);
});
