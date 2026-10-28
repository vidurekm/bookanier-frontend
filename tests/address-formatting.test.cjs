const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'address.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const exportsObject = {};
new Function('exports', 'require', compiled)(exportsObject, require);
const { formatGeocodedAddress } = exportsObject;

test('formats addresses according to the country of the result', () => {
    const cases = [
        [{ road: 'Sokolovská', house_number: '45', city: 'Praha 8', postcode: '18600', country_code: 'cz' }, 'Sokolovská 45, 186 00 Praha 8'],
        [{ road: 'Hlavná', house_number: '12', city: 'Košice', postcode: '04001', country_code: 'sk' }, 'Hlavná 12, 040 01 Košice'],
        [{ road: 'Długa', house_number: '10', city: 'Warszawa', postcode: '00238', country_code: 'pl' }, 'Długa 10, 00-238 Warszawa'],
        [{ road: 'Hauptstraße', house_number: '10', city: 'Berlin', postcode: '10115', country_code: 'de' }, 'Hauptstraße 10, 10115 Berlin'],
        [{ road: 'Hamilton Avenue', house_number: '301', city: 'Palo Alto', state: 'California', postcode: '94303', country_code: 'us' }, '301 Hamilton Avenue, Palo Alto, CA 94303'],
    ];
    for (const [details, expected] of cases) {
        assert.equal(formatGeocodedAddress('Long provider description', details), expected);
    }
});

test('retains the provider description when structured country data is missing', () => {
    assert.equal(formatGeocodedAddress('Original description'), 'Original description');
    assert.equal(formatGeocodedAddress('Original description', {}), 'Original description');
});
