import { tr, translateWith } from './translations';

type Validatable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function validationMessage(field: Validatable) {
    const { validity } = field;
    if (validity.valueMissing) return tr('Please fill out this field.');
    if (field instanceof HTMLInputElement && field.type === 'email' && (validity.typeMismatch || validity.patternMismatch))
        return tr('Enter an email address like name@example.com.');
    if (validity.patternMismatch) return tr('Please match the requested format.');
    if (validity.tooShort && 'minLength' in field)
        return translateWith('Please enter at least {count} characters.', { count: field.minLength });
    if (validity.rangeUnderflow)
        return translateWith('Please enter a value greater than or equal to {value}.', { value: field.getAttribute('min') || '' });
    if (validity.rangeOverflow)
        return translateWith('Please enter a value less than or equal to {value}.', { value: field.getAttribute('max') || '' });
    if (validity.typeMismatch || validity.badInput || validity.stepMismatch || validity.tooLong)
        return tr('Please enter a valid value.');
    return field.validationMessage || tr('Please enter a valid value.');
}

export function installFormValidation() {
    const errors = new Map<Validatable, { message: HTMLElement; invalid: string | null }>();
    let sequence = 0;
    let focusPending = false;
    const isField = (target: EventTarget | null): target is Validatable =>
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    const clear = (field: Validatable) => {
        const error = errors.get(field);
        if (!error) return;
        const descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== error.message.id);
        if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
        else field.removeAttribute('aria-describedby');
        if (error.invalid === null) field.removeAttribute('aria-invalid');
        else field.setAttribute('aria-invalid', error.invalid);
        error.message.remove();
        errors.delete(field);
    };
    document.addEventListener('invalid', event => {
        if (!isField(event.target)) return;
        event.preventDefault();
        const field = event.target;
        clear(field);
        const message = document.createElement('span');
        message.id = `form-validation-${++sequence}`;
        message.className = 'field-validation-error';
        message.setAttribute('role', 'alert');
        message.textContent = validationMessage(field);
        errors.set(field, { message, invalid: field.getAttribute('aria-invalid') });
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), message.id].filter(Boolean).join(' '));
        field.insertAdjacentElement('afterend', message);
        if (!focusPending) {
            focusPending = true;
            queueMicrotask(() => { focusPending = false; if (field.isConnected) field.focus(); });
        }
    }, true);
    const update = (event: Event) => {
        if (!isField(event.target)) return;
        if (event.target.validity.valid) clear(event.target);
        else {
            const error = errors.get(event.target);
            if (error) error.message.textContent = validationMessage(event.target);
        }
    };
    document.addEventListener('input', update);
    document.addEventListener('change', update);
    document.addEventListener('reset', event => {
        for (const field of errors.keys()) if (field.form === event.target) clear(field);
    });
    new MutationObserver(() => {
        for (const field of errors.keys()) if (!field.isConnected) clear(field);
    }).observe(document.body, { childList: true, subtree: true });
}
