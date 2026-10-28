const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function renderPicker(minDate) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'PeriodPicker.tsx'), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    let firstState = true;
    const exports = {};
    const load = name => {
        if (name === 'react') return {
            ...React,
            useState(initial) {
                const value = firstState ? true : initial;
                firstState = false;
                return [value, () => {}];
            },
        };
        if (name === '../lib/preferences') return { localeTag: () => 'en-US' };
        if (name === '../lib/translations') return { tr: value => value };
        if (name === '../lib/utils') return { today: () => '2026-10-28' };
        return require(name);
    };
    new Function('exports', 'require', compiled)(exports, load);
    return renderToStaticMarkup(React.createElement(exports.PeriodPicker, {
        mode: 'day', value: '2026-10-28', minYear: 2025, maxYear: 2028,
        label: 'Date', minDate, unavailableDays: ['2026-10-27', '2026-10-29'],
        onChange() {},
    }));
}

test('creation and rescheduling disable historical and unavailable days identically', () => {
    const creation = renderPicker('2026-10-28');
    const rescheduling = renderPicker('2026-10-28');
    assert.match(creation, /class=" past" disabled="">27<\/button>/);
    assert.equal(rescheduling, creation);
    for (const markup of [creation, rescheduling]) {
        assert.match(markup, /class=" unavailable" title="No available times" disabled="">29<\/button>/);
        assert.doesNotMatch(markup, /class="[^"]*past[^"]*unavailable/);
    }
});

test('both booking forms configure the same date restrictions', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'BookingManagement.tsx'), 'utf8');
    const pickers = source.match(/<PeriodPicker\b.*?\/>/g) || [];
    assert.equal(pickers.length, 2);
    for (const picker of pickers) {
        assert.match(picker, /minDate=\{today\(\)\}/);
        assert.match(picker, /minYear=\{currentYear\}/);
        assert.match(picker, /unavailableDays=\{unavailableDays.data\}/);
    }
});
