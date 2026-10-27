const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = (file) => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');
test('verification uses existing branded login layout with only login success action', () => {
  const auth=src('pages/AuthPages.tsx');
  assert.match(auth, /<AuthLayout title=.*Invitation acceptance/);
  assert.match(auth, /<BrandLogo light tagline\/>/);
  assert.match(auth, /to="\/login"/);
  assert.doesNotMatch(auth, /className="btn btn-secondary" to="\/"/);
});
test('signed-in users can create an organization without registering another account', () => {
  const auth=src('pages/AuthPages.tsx');
  const shell=src('components/AdminShell.tsx');
  assert.match(auth, /if \(token\) \{\s+const organization = await api<\{ id: number \}>\('\/backoffice\/organizations'/);
  assert.match(auth, /Your existing account will become the organization owner/);
  assert.match(auth, /sessionStorage\.setItem\('bookanear_org_id', String\(organization\.id\)\)/);
  assert.match(auth, /queryClient\.setQueryData<Page<Organization>>\(\['organizations'\]/);
  assert.match(auth, /setup_status: 'draft', my_role: 'owner'/);
  assert.match(auth, /!token && <><Field label=\{tr\("Your name"\)\}/);
  assert.match(shell, /to="\/register">\{tr\("Create organization"\)\}/);
});
test('setup separates owner reservability, reception and branch opening slots', () => {
  const wizard=src('pages/SetupWizard.tsx');
  assert.match(wizard, /ownerProvidesServices/);
  assert.match(wizard, /providesServices/);
  assert.match(wizard, /Otevírací doba/);
  assert.match(wizard, /Přidat interval/);
  assert.match(wizard, /locationIndex/);
});
test('appointment setup follows the requested step order and places public settings before summary', () => {
  const wizard=src('pages/SetupWizard.tsx');
  assert.match(wizard, /template\?\.booking_model==='APPOINTMENT'\s*\?\s*\['locations','team','services','resources','hours'\]/);
  assert.match(wizard, /return \['type',\.\.\.configured,'public','summary'\]/);
  assert.match(wizard, /current==='public'&&<div className="stack">/);
  assert.doesNotMatch(wizard, /current==='type'&&<div className="stack setup-preferences">/);
});
test('organization and account deletion require typing their identifying names', () => {
  const settings=src('pages/AdminSettings.tsx');
  const account=src('pages/AccountPage.tsx');
  const api=fs.readFileSync(path.join(__dirname, '..', '..', 'bookanear-api', 'src', 'main', 'java', 'online', 'bookanear', 'api', 'service', 'AuthService.java'), 'utf8');
  const deletion=fs.readFileSync(path.join(__dirname, '..', '..', 'bookanear-api', 'src', 'main', 'java', 'online', 'bookanear', 'api', 'service', 'OrganizationDeletionService.java'), 'utf8');
  assert.match(settings, /orgApi<void>\(orgId, '', \{ method: 'DELETE' \}\)/);
  assert.match(settings, /deleteOrganizationName !== org\.name/);
  assert.match(settings, /Type the organization name to confirm/);
  assert.match(account, /api<void>\('\/auth\/me',\{method:'DELETE'\}\)/);
  assert.match(account, /deleteAccountEmail!==account\.email/);
  assert.match(account, /Type your email address to confirm/);
  assert.match(api, /organizationDeletionService\.delete\(organizationId\)/);
  assert.match(deletion, /DELETE FROM organizations WHERE id=:org/);
  assert.match(api, /UPDATE organization_members SET user_id=NULL, active=false/);
});
