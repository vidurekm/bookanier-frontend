const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('invalid fields show inline errors, block native bubbles, and clear after correction', async () => {
    class Element {
        attributes = new Map();
        validity = { valueMissing: true, valid: false };
        isConnected = true;
        type = 'text';
        getAttribute(name) { return this.attributes.get(name) ?? null; }
        setAttribute(name, value) { this.attributes.set(name, value); }
        removeAttribute(name) { this.attributes.delete(name); }
        insertAdjacentElement(position, message) { this.message = message; }
        focus() { this.focused = true; }
        remove() { this.removed = true; }
    }
    const listeners = {};
    const document = {
        body: {},
        addEventListener(name, callback) { listeners[name] = callback; },
        createElement() { return new Element(); },
    };
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'formValidation.ts'), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const exports = {};
    const translations = { tr: value => value, translateWith: value => value };
    new Function('exports', 'require', 'document', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'MutationObserver', compiled)(
        exports, () => translations, document, Element, Element, Element, class { observe() {} },
    );
    exports.installFormValidation();
    const field = new Element();
    field.setAttribute('aria-describedby', 'existing-hint');
    let prevented = false;
    listeners.invalid({ target: field, preventDefault() { prevented = true; } });
    await Promise.resolve();
    assert.equal(prevented, true);
    assert.equal(field.focused, true);
    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.equal(field.message.textContent, 'Please fill out this field.');
    assert.equal(field.message.getAttribute('role'), 'alert');
    assert.match(field.getAttribute('aria-describedby'), /^existing-hint form-validation-/);
    field.validity = { valid: true };
    listeners.input({ target: field });
    assert.equal(field.getAttribute('aria-invalid'), null);
    assert.equal(field.getAttribute('aria-describedby'), 'existing-hint');
    assert.equal(field.message.removed, true);

    field.validity = { valueMissing: true, valid: false };
    field.form = {};
    listeners.invalid({ target: field, preventDefault() {} });
    listeners.reset({ target: field.form });
    assert.equal(field.message.removed, true);
});
