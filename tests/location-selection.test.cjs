const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'locationSelection.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const helperModule = { exports: {} };
new Function('module', 'exports', compiled)(helperModule, helperModule.exports);

test('only a single active location is auto-selected', () => {
  const { singleActiveLocationId } = helperModule.exports;
  assert.equal(singleActiveLocationId([{ id: 1, active: true }]), 1);
  assert.equal(singleActiveLocationId([{ id: 1, active: false }]), undefined);
  assert.equal(singleActiveLocationId([{ id: 1, active: true }, { id: 2, active: false }]), 1);
  assert.equal(singleActiveLocationId([{ id: 1, active: true }, { id: 2, active: true }]), undefined);
  assert.equal(singleActiveLocationId(undefined), undefined);
});
