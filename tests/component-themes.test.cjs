const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const css = postcss.parse(fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8'));
function declarations(selector) {
    const values = {};
    css.walkRules(rule => {
        if (rule.selector !== selector) return;
        rule.walkDecls(declaration => { values[declaration.prop] = declaration.value; });
    });
    return values;
}
function rgb(hex) {
    const digits = hex.slice(1);
    const expanded = digits.length === 3 ? Array.from(digits, digit => digit + digit).join('') : digits;
    return expanded.match(/../g).map(value => parseInt(value, 16));
}
function mix(first, weight, second) {
    return first.map((value, index) => value * weight + second[index] * (1 - weight));
}
function contrast(first, second) {
    const luminance = color => color.map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
}

test('all six themes have readable shared text and accent highlights in both appearances', () => {
    const light = declarations('.admin-layout');
    const dark = declarations('.admin-layout[data-appearance="dark"]');
    assert.equal(light['--accent-text'], 'var(--accent-dark)');
    assert.equal(dark['--accent-text'], 'color-mix(in srgb,var(--accent) 30%,#fff)');
    assert.equal(dark['--accent-soft'], 'color-mix(in srgb,var(--accent) 18%,#142131)');
    for (const theme of ['brand', 'emerald', 'ocean', 'violet', 'amber', 'slate']) {
        const tokens = declarations(`.admin-layout[data-theme="${theme}"]`);
        const accent = rgb(tokens['--accent']);
        const text = rgb(tokens['--accent-dark']);
        const soft = rgb(tokens['--accent-soft']);
        const darkText = mix(accent, 0.3, rgb('#ffffff'));
        const darkSoft = mix(accent, 0.18, rgb('#142131'));
        assert.ok(contrast(text, soft) >= 4.5, `${theme}: light highlighted text`);
        assert.ok(contrast(darkText, darkSoft) >= 4.5, `${theme}: dark highlighted text`);
        assert.ok(contrast(darkText, mix(accent, 0.25, rgb('#1c2c3e'))) >= 4.5, `${theme}: dark combobox`);
        for (const appearance of [light, dark]) {
            for (const surface of ['--surface', '--surface-control', '--surface-subtle']) {
                for (const foreground of ['--text', '--text-muted']) {
                    assert.ok(contrast(rgb(appearance[foreground]), rgb(appearance[surface])) >= 4.5,
                        `${theme}: ${foreground} on ${surface}`);
                }
            }
        }
    }
});

test('empty states, icons, switches and charts use shared appearance and theme tokens', () => {
    for (const [component, property, expected] of [
        ['.empty h3', 'color', 'var(--text)'],
        ['.empty', 'color', 'var(--text-muted)'],
        ['.empty-graphic', 'color', 'var(--accent-text)'],
        ['.org-avatar', 'background', 'var(--accent-soft)'],
        ['.view-switch button.active', 'background', 'var(--accent-soft)'],
        ['.statistics-card.active', 'border-color', 'var(--accent)'],
        ['.help-chat-prompts button', 'color', 'var(--accent-text)'],
    ]) {
        let found = false;
        css.walkRules(rule => {
            if (!rule.selector.startsWith('.admin-layout') || !rule.selector.includes(component)) return;
            rule.walkDecls(property, declaration => {
                if (declaration.value === expected) found = true;
            });
        });
        assert.ok(found, `${component}: ${property}`);
    }
    assert.equal(declarations('.statistics-bar')['background'], 'var(--accent)');
    assert.equal(declarations('.stat-card-link:focus-visible')['outline'], '3px solid var(--accent)');
});

test('dark semantic notices remain readable without inheriting the decorative theme', () => {
    for (const selector of [
        '.admin-layout[data-appearance="dark"] :is(.notice-error,.help-chat-notice.error-text)',
        '.admin-layout[data-appearance="dark"] .notice-success',
        '.admin-layout[data-appearance="dark"] .notice-info',
        '.admin-layout[data-appearance="dark"] .btn-danger',
    ]) {
        const rule = declarations(selector);
        assert.ok(contrast(rgb(rule.color), rgb(rule.background)) >= 4.5, selector);
    }
});

test('calendar columns use a neutral surface while bookings retain their original status palette', () => {
    assert.equal(declarations('.admin-layout .calendar-day').background, 'var(--surface-subtle)');
    assert.equal(declarations('.calendar-event').background, '#e4f5ed');
    assert.equal(declarations('.calendar-event-upcoming')['border-left-color'], '#25967f');
    assert.equal(declarations('.calendar-event.calendar-event-no_show,.calendar-event.calendar-event-cancelled').background, '#fdeeee');
    assert.equal(declarations('.calendar-event.calendar-event-completed').background, '#eaf0fa');
    css.walkRules(rule => {
        if (!rule.selector.includes('.calendar-event')) return;
        rule.walkDecls(declaration => {
            if (declaration.prop === 'background' || declaration.prop === 'border-left-color') {
                assert.doesNotMatch(declaration.value, /var\(--accent/);
            }
        });
    });
});
