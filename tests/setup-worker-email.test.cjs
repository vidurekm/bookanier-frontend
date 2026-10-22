const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.resolve(__dirname, '../src', name), 'utf8');

test('setup collects a member email and checks it before final completion', () => {
  const wizard = read('pages/SetupWizard.tsx');
  const setup = read('lib/setup.ts');
  assert.match(setup, /members:\{name:string;email:string;/);
  assert.match(wizard, /label=\{st\("Team member email"\)\}/);
  assert.match(wizard, /current==='summary'&&draft\.members\.some\(x=>!x\.email/);
  assert.match(wizard, /completeSetup\(orgId,draft\)/);
});

test('email remains optional for draft saves and is required only on completion', () => {
  const service = fs.readFileSync(path.resolve(__dirname, '../../bookanear-api/src/main/java/online/bookanear/api/service/SetupService.java'), 'utf8');
  assert.match(service, /finalSubmission && \(m\.email\(\)==null/);
  assert.match(service, /A valid email is required for every team member/);
  assert.match(service, /invitationService\.create\(org/);
  assert.match(service, /member\.email\(\), member\.name\(\), "worker".*entry\.getKey\(\)/s);
});
