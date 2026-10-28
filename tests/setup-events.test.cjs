const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=path.resolve(root,'../bookanear-api');
const backendAvailable=fs.existsSync(path.join(api,'src/main/resources/db/migration/V6__booking_models_onboarding_events.sql'));
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
test('four booking templates and setup wizard are wired',{skip:!backendAvailable},()=>{
 const sql=fs.readFileSync(path.join(api,'src/main/resources/db/migration/V6__booking_models_onboarding_events.sql'),'utf8');
 for(const key of ['SALON','RESTAURANT','RENTAL','EVENTS'])assert.match(sql,new RegExp("'"+key+"'"));
 assert.match(read('src/pages/SetupWizard.tsx'),/completeSetup/);
 assert.match(read('src/components/AdminShell.tsx'),/setup_status==='draft'/);
 assert.match(read('src/components/AdminShell.tsx'),/setupError/);
 assert.match(read('src/components/AdminShell.tsx'),/org\.setup_status === 'draft' && \['owner', 'admin'\]\.includes\(org\.my_role \|\| ''\)/);
 assert.match(fs.readFileSync(path.join(api,'src/main/java/online/bookanear/api/service/BackofficeService.java'),'utf8'),/c\.setup_status/);
});
test('events booking checks seats under row lock and returns a management token',{skip:!backendAvailable},()=>{
 const svc=fs.readFileSync(path.join(api,'src/main/java/online/bookanear/api/service/EventService.java'),'utf8');
 assert.match(svc,/FOR UPDATE OF o/);
 assert.match(svc,/taken\+r\.seats\(\)/);
 assert.match(svc,/EVENT_FULL/);
 assert.match(svc,/token_hash/);
});
test('booking model is locked after completing onboarding',{skip:!backendAvailable},()=>{
 const svc=fs.readFileSync(path.join(api,'src/main/java/online/bookanear/api/service/SetupService.java'),'utf8');
 assert.match(svc,/SETUP_LOCKED/);
 assert.match(svc,/locked_at=now\(\)/);
});
test('appearance, language and color theme persist in local storage',()=>{
 const prefs=read('src/lib/preferences.tsx');
 for(const key of ['APPEARANCE_KEY','LANGUAGE_KEY','THEME_KEY'])assert.match(prefs,new RegExp('localStorage\\.setItem\\('+key));
 assert.match(read('src/styles.css'),/data-appearance="dark"/);
});
test('dark table row hover keeps readable contrast across color themes',()=>{
 const css=read('src/styles.css');
 assert.match(css,/\.data-table tbody tr:hover\{background:#fbfdfc\}/);
 assert.match(css,/\.admin-layout\[data-appearance="dark"\] \.data-table tbody tr:hover\{background:#203447\}/);
});
test('dark combobox highlights follow the selected color theme',()=>{
 const css=read('src/styles.css');
 const rule=css.match(/\.admin-layout\[data-appearance="dark"\] \.combo-option:hover,\.admin-layout\[data-appearance="dark"\] \.combo-option\.active\{([^}]+)\}/);
 assert.ok(rule);
 assert.match(rule[1],/background:color-mix\(in srgb,var\(--accent\) 25%,#1c2c3e\)/);
 assert.match(rule[1],/color:color-mix\(in srgb,var\(--accent\) 30%,#fff\)/);
});
test('team table reserves consistent slots for optional row actions',()=>{
 const css=read('src/styles.css');
 const team=read('src/pages/AdminTeam.tsx');
 assert.match(css,/\.team-table-actions\{display:grid;grid-template-columns:minmax\(0,1fr\) repeat\(3,34px\);gap:4px;min-width:450px\}/);
 assert.match(team,/team-table-actions/);
 assert.equal((team.match(/className="team-action-slot"/g)||[]).length,3);
});
test('confirmation dialogs use the in-app dialog provider instead of native browser prompts',()=>{
 const provider=read('src/contexts/ConfirmContext.tsx');
 const entry=read('src/main.tsx');
 const ui=read('src/components/UI.tsx');
 assert.match(provider,/ConfirmProvider/);
 assert.match(provider,/<Modal/);
 assert.match(ui,/role="dialog"/);
 assert.match(entry,/<ConfirmProvider>/);
 for(const file of ['components/BookingManagement.tsx','components/DateExceptions.tsx','components/MediaGallery.tsx','pages/AdminEvents.tsx','pages/AdminLocations.tsx','pages/AdminServices.tsx','pages/AdminTeam.tsx','pages/ManageBookingPage.tsx','pages/PublicEventsPage.tsx']){
  assert.doesNotMatch(read(`src/${file}`),/window\.(confirm|prompt|alert)\s*\(/);
  assert.match(read(`src/${file}`),/useConfirm/);
 }
});
test('transparent logo has no white tile in sidebar and auth',()=>{
 const css=read('src/styles.css');
 assert.match(css,/sidebar \.brand-logo,\.auth-brand \.brand-logo\{background:transparent!important/);
});
test('single location public booking skips branch selection',()=>{
 const booking=read('src/pages/PublicBookingPage.tsx');
 assert.match(booking,/catalog\?\.locations\.length===1/);
});
