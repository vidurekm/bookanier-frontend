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
test('transparent logo has no white tile in sidebar and auth',()=>{
 const css=read('src/styles.css');
 assert.match(css,/sidebar \.brand-logo,\.auth-brand \.brand-logo\{background:transparent!important/);
});
test('single location public booking skips branch selection',()=>{
 const booking=read('src/pages/PublicBookingPage.tsx');
 assert.match(booking,/catalog\?\.locations\.length===1/);
});
