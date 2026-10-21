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

test('built-in labels render in UI locale and custom names are not translated',()=>{
  const labels = read(path.join(root,'src/lib/resourceTypeLabels.ts'));
  const page = read(path.join(root,'src/pages/AdminResources.tsx'));
  assert.match(labels,/type\.name/);
  assert.match(labels,/tr\(system\.key\)/);
  assert.match(page,/resourceTypeLabel\(t\)/);
  assert.match(page,/resourceTypeLabel\(\{code:r\.resource_type,name:r\.resource_type_name\}\)/);
});
