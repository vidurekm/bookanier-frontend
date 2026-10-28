const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = relative => fs.readFileSync(path.join(__dirname, '..', 'src', relative), 'utf8');
const jsx = (type, props) => ({ type, props });
function harness(relative, name, data = {}, extraExports = []) {
    const state = [];
    let cursor = 0;
    let effects = [];
    let registration;
    const calls = [];
    const notify = () => {};
    const react = {
        useState(initial) {
            const index = cursor++;
            if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
            return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
        },
        useCallback: callback => callback,
        useMemo: callback => callback(),
        useRef: value => ({ current: value }),
        useEffect(callback, dependencies) {
            const index = cursor++;
            const previous = state[index];
            if (!previous || !dependencies || dependencies.some((value, i) => value !== previous[i])) effects.push(callback);
            state[index] = dependencies;
        },
    };
    const modules = {
        react,
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
        'react-dom': { createPortal: element => element },
        '@tanstack/react-query': {
            useQuery: ({ queryKey }) => ({ data: data[queryKey[0]], isLoading: false }),
            useQueryClient: () => ({ invalidateQueries: async () => {} }),
            useMutation: options => ({ isPending: false, mutate: (...args) => calls.push({ options, args }) }),
        },
        '../lib/translations': { tr: value => value, translateWith: value => value },
        '../lib/utils': {
            today: () => '2026-10-28',
            roleLabel: value => value,
            money: String,
            nameInitials: value => value.slice(0, 2),
            timeZoneOptions: value => [value],
            timeZoneLabel: value => value,
            sortByName: rows => rows,
            dateWithZone: (date, time) => `${date}T${time}:00Z`,
        },
        '../lib/locationSelection': { singleActiveLocationId: rows => rows.length === 1 ? rows[0].id : null },
        '../lib/resourceTypeLabels': { resourceTypeLabel: row => row.name },
        '../lib/setupTranslations': { st: value => value, businessTypeLabel: value => value },
        '../lib/dateFormat': { formattedDate: value => value, dateFormats: [{ value: 'DD.MM.YYYY', label: 'Date' }] },
        '../lib/bookingOptions': { bookingCurrencies: [{ value: 'CZK', label: 'CZK' }], bookingLanguages: [{ value: 'cs', label: 'Czech' }] },
        '../lib/useAdmin': { useAdmin: () => ({ orgId: 1, org: data.organization }) },
        '../contexts/AuthContext': { useAuth: () => ({ logout() {} }) },
        '../contexts/ToastContext': { useToast: () => notify },
        'react-router-dom': { useNavigate: () => () => {}, useSearchParams: () => searchParams },
        './PeriodPicker': { PeriodPicker: 'PeriodPicker' },
        '../contexts/ConfirmContext': { useConfirm: () => async () => true },
    };
    const searchParams = [{ get: () => null }, () => {}];
    const ui = new Proxy({}, { get: (_, property) => property });
    const saveContext = { useMemberDetailSave: (_key, _order, dirty, save) => { registration = { dirty, save }; } };
    function load(file, exports = []) {
        const source = read(file) + (exports.length ? `\nexport { ${exports.join(', ')} };` : '');
        const compiled = ts.transpileModule(source, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
        }).outputText;
        const result = {};
        new Function('exports', 'require', 'document', 'requestAnimationFrame', compiled)(
            result,
            module => {
                if (module.endsWith('/UI')) return ui;
                if (module.endsWith('/MemberDetailSaveContext')) return saveContext;
                if (module.endsWith('/useFormDraft')) return load('lib/useFormDraft.ts');
                return modules[module] ?? {};
            },
            { body: {} },
            callback => callback(),
        );
        return result;
    }
    const component = load(relative, extraExports)[name];
    return {
        calls,
        render(props) {
            for (let attempt = 0; attempt < 10; attempt++) {
                cursor = 0;
                effects = [];
                const tree = component(props);
                if (!effects.length) return tree;
                effects.forEach(callback => callback());
            }
            throw new Error('Effects did not settle');
        },
        registration: () => registration,
    };
}
function all(tree) {
    if (!tree || typeof tree !== 'object') return [];
    if (Array.isArray(tree)) return tree.flatMap(all);
    return [...(tree.type ? [tree] : []), ...Object.values(tree.props ?? {}).flatMap(all)];
}
function find(tree, type, predicate = () => true) {
    const node = all(tree).find(node => node.type === type && predicate(node.props));
    assert.ok(node, `Missing ${type}`);
    return node.props;
}
const submit = tree => find(tree, 'form').onSubmit({ preventDefault() {} });
const customer = { id: 1, name: 'Existing', email: 'customer@example.com', phone: '', notes: '' };
const location = { id: 1, name: 'Existing', active: true, timezone: 'UTC', address: '' };
const resource = { id: 1, name: 'Existing', location_id: 1, resource_type_id: 1, capacity: 1, active: true, resource_state: 'available' };
const member = { id: 1, display_name: 'Existing', email: 'staff@example.com', role: 'worker', active: true };
const fixtures = {
    customers: { items: [customer] },
    locations: { items: [location] },
    services: { items: [{ id: 1, name: 'Existing', description: '', active: true }] },
    resources: [resource],
    'resource-types': [{ id: 1, name: 'Equipment', category: 'equipment', active: true }],
    members: { items: [member] },
    access: { isOwner: true, canWrite: true },
    setup: { booking_model: 'APPOINTMENT', settings: {} },
};

test('drafts compare values and reset their baseline when reopening or saving', () => {
    const h = harness('lib/useFormDraft.ts', 'useFormDraft');
    let [value, setValue, dirty, reset] = h.render({ name: '', active: true });
    assert.equal(dirty, false);
    setValue(previous => ({ ...previous, active: false }));
    [value, setValue, dirty, reset] = h.render({});
    assert.equal(dirty, true);
    setValue(previous => ({ ...previous, active: true }));
    assert.equal(h.render({})[2], false);
    reset({ name: 'Another record', active: false });
    assert.equal(h.render({})[2], false);
    setValue(previous => ({ ...previous, name: 'Updated' }));
    [value, , dirty, reset] = h.render({});
    assert.equal(dirty, true);
    reset(value);
    assert.equal(h.render({})[2], false);
});

for (const [page, typeTab] of [
    ['AdminCustomers'], ['AdminLocations'], ['AdminServices'], ['AdminTeam'],
    ['AdminResources'], ['AdminResources', true],
]) {
    test(`${page}${typeTab ? ' resource type' : ''}: edit, revert, keyboard submit and reopen`, () => {
        const h = harness(`pages/${page}.tsx`, page, fixtures);
        let tree = h.render();
        if (typeTab) {
            find(tree, 'button', props => [].concat(props.children).includes('Resource types')).onClick();
            tree = h.render();
        }
        find(tree, 'button', props => props.title === 'Edit').onClick();
        tree = h.render();
        assert.equal(find(tree, 'SubmitRow').dirty, false);
        submit(tree);
        assert.equal(h.calls.length, 0);
        const initial = find(tree, 'Input').value;
        find(tree, 'Input').onChange({ target: { value: 'Changed' } });
        tree = h.render();
        assert.equal(find(tree, 'SubmitRow').dirty, true);
        submit(tree);
        assert.equal(h.calls.length, 1);
        find(tree, 'Input').onChange({ target: { value: initial } });
        tree = h.render();
        assert.equal(find(tree, 'SubmitRow').dirty, false);
        submit(tree);
        assert.equal(h.calls.length, 1);
        if (page !== 'AdminCustomers' && page !== 'AdminServices') {
            find(tree, 'button', props => [].concat(props.children).includes('Photos')).onClick();
            assert.equal(find(h.render(), 'SubmitRow').dirty, false);
        }
        find(h.render(), 'Modal').onClose();
        find(h.render(), 'button', props => props.title === 'Edit').onClick();
        assert.equal(find(h.render(), 'SubmitRow').dirty, false);
    });
}

for (const page of ['AdminCustomers', 'AdminLocations', 'AdminServices', 'AdminResources']) {
    test(`${page}: new dialogs start clean even with prefilled defaults`, () => {
        const h = harness(`pages/${page}.tsx`, page, fixtures);
        find(h.render(), 'AddButton', props => props.label?.startsWith('New ')).onClick();
        assert.equal(find(h.render(), 'SubmitRow').dirty, false);
        find(h.render(), 'Input').onChange({ target: { value: 'New record' } });
        assert.equal(find(h.render(), 'SubmitRow').dirty, true);
        find(h.render(), 'Input').onChange({ target: { value: '' } });
        assert.equal(find(h.render(), 'SubmitRow').dirty, false);
    });
}

test('pricing versions take a fresh baseline each time the dialog opens', () => {
    const h = harness('pages/AdminServices.tsx', 'VersionsEditor', { versions: [], setup: { settings: { defaultCurrency: 'EUR' } } }, ['VersionsEditor']);
    const render = () => h.render({ org: 1, service: 1 });
    find(render(), 'AddButton').onClick();
    assert.equal(find(render(), 'SubmitRow').dirty, false);
    find(render(), 'Input', props => props.type === 'number').onChange({ target: { value: '500' } });
    assert.equal(find(render(), 'SubmitRow').dirty, true);
    find(render(), 'Modal').onClose();
    find(render(), 'AddButton').onClick();
    assert.equal(find(render(), 'SubmitRow').dirty, false);
});

test('prefilled staff invitations start clean and reverting edits disables sending', () => {
    const h = harness('pages/AdminTeam.tsx', 'AdminTeam', {
        ...fixtures, members: { items: [{ ...member, email: null }] },
    });
    find(h.render(), 'button', props => props.title === 'Link account by email').onClick();
    const send = () => find(h.render(), 'Button', props => props.children === 'Send invitation');
    assert.equal(send().disabled, true);
    find(h.render(), 'Input', props => props.type === 'email').onChange({ target: { value: 'new@example.com' } });
    assert.equal(send().disabled, false);
    find(h.render(), 'Input', props => props.type === 'email').onChange({ target: { value: '' } });
    assert.equal(send().disabled, true);
    submit(h.render());
    assert.equal(h.calls.length, 0);
});

test('account settings disable unchanged names, emails and passwords and reset reopened dialogs', () => {
    const h = harness('pages/AccountPage.tsx', 'AccountSettingsPanel', {
        'current-user': { name: 'Existing', email: 'account@example.com' },
    });
    const button = label => find(h.render(), 'Button', props => props.children === label);
    assert.equal(button('Save name').disabled, true);
    find(h.render(), 'Input', props => props.value === 'Existing').onChange({ target: { value: 'New name' } });
    assert.equal(button('Save name').disabled, false);
    find(h.render(), 'Input', props => props.value === 'New name').onChange({ target: { value: 'Existing' } });
    assert.equal(button('Save name').disabled, true);
    button('Change email address').onClick();
    assert.equal(button('Send confirmation email').disabled, true);
    find(h.render(), 'Input', props => props.type === 'email').onChange({ target: { value: 'new@example.com' } });
    assert.equal(button('Send confirmation email').disabled, false);
    find(h.render(), 'Input', props => props.type === 'email').onChange({ target: { value: 'account@example.com' } });
    assert.equal(button('Send confirmation email').disabled, true);
    find(h.render(), 'Modal').onClose();
    button('Change email address').onClick();
    assert.equal(button('Send confirmation email').disabled, true);
    find(h.render(), 'Modal').onClose();
    button('Change password').onClick();
    assert.equal(button('Update password').disabled, true);
    find(h.render(), 'Input', props => props.autoComplete === 'new-password').onChange({ target: { value: 'new password' } });
    assert.equal(button('Update password').disabled, false);
    find(h.render(), 'Modal').onClose();
    button('Change password').onClick();
    assert.equal(button('Update password').disabled, true);
});

test('settings save controls only enable for changes in their own section', () => {
    const h = harness('pages/AdminSettings.tsx', 'AdminSettings', {
        ...fixtures, organization: { name: 'Existing organization', default_timezone: 'UTC', booking_enabled: true },
    });
    const disabled = () => all(h.render()).filter(node => node.type === 'Button' && node.props.children === 'Save settings').map(node => node.props.disabled);
    const field = label => find(h.render(), 'Field', props => props.label === label).children.props;
    assert.deepEqual(disabled(), [true, true, true, true]);
    field('Start of working week').onChange({ target: { value: '2' } });
    assert.deepEqual(disabled(), [false, true, true, true]);
    field('Start of working week').onChange({ target: { value: '1' } });
    assert.deepEqual(disabled(), [true, true, true, true]);
    field('Organization name').onChange({ target: { value: 'Changed' } });
    assert.deepEqual(disabled(), [true, false, true, true]);
    field('Organization name').onChange({ target: { value: 'Existing organization' } });
    find(h.render(), 'input', props => props.type === 'checkbox').onChange({ target: { checked: true } });
    assert.deepEqual(disabled(), [true, true, false, true]);
    find(h.render(), 'input', props => props.type === 'checkbox').onChange({ target: { checked: false } });
    field('Default public page language').onChange({ target: { value: 'en' } });
    assert.deepEqual(disabled(), [true, true, true, false]);
    field('Default public page language').onChange({ target: { value: 'cs' } });
    assert.deepEqual(disabled(), [true, true, true, true]);
});

test('booking option changes register for shared saving only while dirty', () => {
    const h = harness('pages/AdminServices.tsx', 'BookingOptionsEditor', {
        'service-booking-options': { customer_can_choose_staff: false, customer_can_choose_resource: false, required_staff_count: 1 },
        requirements: [],
    }, ['BookingOptionsEditor']);
    const render = () => h.render({ org: 1, service: 1, appointment: true });
    render();
    assert.equal(h.registration().dirty, false);
    find(render(), 'input').onChange({ target: { checked: true } });
    render();
    assert.equal(h.registration().dirty, true);
    find(render(), 'input').onChange({ target: { checked: false } });
    render();
    assert.equal(h.registration().dirty, false);
});

test('resource choice and its hints are hidden when resource tracking is disabled', () => {
    for (const requirements of [
        [],
        [{ category: 'equipment', quantity: 1 }],
        [{ category: 'equipment', quantity: 2 }],
        [{ category: 'equipment', quantity: 1 }, { category: 'space', quantity: 1 }],
    ]) {
        const h = harness('pages/AdminServices.tsx', 'BookingOptionsEditor', {
            'service-booking-options': { customer_can_choose_staff: false, customer_can_choose_resource: true, required_staff_count: 1 },
            requirements,
        }, ['BookingOptionsEditor']);
        const render = resourcesEnabled => h.render({ org: 1, service: 1, appointment: true, resourcesEnabled });
        const resourceControls = tree => all(tree).filter(node =>
            node.type === 'label' && [].concat(node.props.children).includes('Customers can choose a resource for this service') ||
            node.type === 'p' && /resource/.test(node.props.children));
        assert.equal(resourceControls(render(false)).length, 0);
        assert.equal(resourceControls(render(true)).length, 1);
        assert.equal(h.registration().dirty, false);
        assert.ok(all(render(false)).some(node => node.type === 'input' && node.props.type === 'checkbox'));
    }
});

test('service resource options use the same tracking gate as resource requirements', () => {
    for (const [booking_model, trackResources, expected] of [
        ['APPOINTMENT', false, false],
        ['APPOINTMENT', true, true],
        ['RESOURCE', false, true],
        ['RENTAL', false, true],
    ]) {
        const h = harness('pages/AdminServices.tsx', 'ServiceDetail', {
            setup: { booking_model, settings: { trackResources } },
        }, ['ServiceDetail']);
        const render = () => h.render({ org: 1, service: { id: 1 }, onSaved() {} });
        find(render(), 'button', props => [].concat(props.children).includes('Booking options')).onClick();
        const editor = all(render()).find(node => typeof node.type === 'function' && node.type.name === 'BookingOptionsEditor');
        assert.ok(editor);
        assert.equal(editor.props.resourcesEnabled, expected);
    }
});

test('resource requirement changes register for shared saving only while dirty', () => {
    const h = harness('pages/AdminServices.tsx', 'RequirementsEditor', {
        requirements: [], 'resource-types': fixtures['resource-types'],
    }, ['RequirementsEditor']);
    const render = () => h.render({ org: 1, service: 1, appointment: true });
    render();
    assert.equal(h.registration().dirty, false);
    find(render(), 'Button', props => props.children === '+ Add requirement').onClick();
    render();
    assert.equal(h.registration().dirty, true);
    find(render(), 'Button', props => props.children === 'Remove').onClick();
    render();
    assert.equal(h.registration().dirty, false);
});

test('location service assignments compare sets, not just whether a checkbox was touched', () => {
    const h = harness('pages/AdminLocations.tsx', 'LocationServices', {
        'location-services': [{ service_id: 1, name: 'Service', active: true }],
    }, ['LocationServices']);
    const render = () => h.render({ org: 1, location: 1 });
    render();
    assert.equal(h.registration().dirty, false);
    find(render(), 'input').onChange({ target: { checked: false } });
    render();
    assert.equal(h.registration().dirty, true);
    find(render(), 'input').onChange({ target: { checked: true } });
    render();
    assert.equal(h.registration().dirty, false);
});

test('date exceptions only register actual additions or removals, and undo restores the clean state', () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const h = harness('components/DateExceptions.tsx', 'DateExceptions', {
        'date-exceptions': [{ id: 1, work_date: date, start_time: null, end_time: null }],
    });
    const render = () => h.render({ org: 1, location: 1 });
    find(render(), 'Button', props => props.children === 'Add exception to pending').onClick();
    render();
    assert.equal(h.registration().dirty, false);
    find(render(), 'button', props => props.children === 'Delete exception').onClick();
    render();
    assert.equal(h.registration().dirty, true);
    find(render(), 'button', props => props.children === 'Undo pending change').onClick();
    render();
    assert.equal(h.registration().dirty, false);
    find(render(), 'PeriodPicker').onChange(`${now.getFullYear() + 1}-01-01`);
    find(render(), 'Select').onChange({ target: { value: 'custom' } });
    find(render(), 'Button', props => props.children === 'Add exception to pending').onClick();
    render();
    assert.equal(h.registration().dirty, true);
    find(render(), 'button', props => props.children === 'Undo pending change').onClick();
    render();
    assert.equal(h.registration().dirty, false);
});

test('rescheduling is enabled only for a changed time or assignment', async () => {
    const h = harness('components/BookingManagement.tsx', 'BookingStatusActions', {
        locations: { items: [location] },
        'reschedule-options': { staffCount: 1, currentMemberIds: [1], currentResourceId: null, members: [{ id: 1 }, { id: 2 }], resources: [] },
        setup: { settings: {} },
        'reschedule-availability': { slots: [{ startsAt: '2026-10-28T10:00:00Z', time: '10:00' }, { startsAt: '2026-10-28T11:00:00Z', time: '11:00' }] },
    });
    const render = () => h.render({
        org: 1, id: 1, status: 'confirmed', item: { location_id: 1, service_id: 1, starts_at: '2026-10-28T10:00:00Z' },
        onChanged() {}, onActionComplete() {},
    });
    find(render(), 'Button', props => props.children === 'Reschedule booking').onClick();
    const save = () => find(render(), 'Button', props => props.children === 'Save new time');
    assert.equal(save().disabled, true);
    await submit(render());
    assert.equal(h.calls.length, 0);
    find(render(), 'Button', props => props.children === '11:00').onClick();
    assert.equal(save().disabled, false);
    find(render(), 'Button', props => props.children === '10:00').onClick();
    assert.equal(save().disabled, true);
    find(render(), 'Select').onChange({ target: { value: '2' } });
    assert.equal(save().disabled, true);
    find(render(), 'Button', props => props.children === '10:00').onClick();
    assert.equal(save().disabled, false);
    find(render(), 'Select').onChange({ target: { value: '1' } });
    find(render(), 'Button', props => props.children === '10:00').onClick();
    assert.equal(save().disabled, true);
});

test('the shared submit control requires a dirty form and remains disabled while saving', () => {
    const source = read('components/UI.tsx');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const exports = {};
    new Function('exports', 'require', compiled)(exports, module => module === 'react/jsx-runtime'
        ? { jsx, jsxs: jsx } : { tr: value => value });
    for (const [dirty, busy, disabled] of [[false, false, true], [true, false, false], [true, true, true]]) {
        const row = exports.SubmitRow({ dirty, busy });
        const button = exports.Button(find(row, exports.Button));
        assert.equal(button.props.disabled, disabled);
    }
});
