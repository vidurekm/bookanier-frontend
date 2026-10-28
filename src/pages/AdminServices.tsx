import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useCallback, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, Layers3, Pencil, Settings2, Trash2, Users } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { json, list, orgApi, resourceTypes, versions } from '../lib/api';
import type { Service, Version } from '../lib/types';
import { formatDate, money, today } from '../lib/utils';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, PageTitle, Pager, SearchBox, Select, SortableHeader, SubmitRow, TextArea } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { bookingCurrencies } from '../lib/bookingOptions';
import { getSetup } from '../lib/setup';
import { useConfirm } from '../contexts/ConfirmContext';
import { resourceTypeLabel } from '../lib/resourceTypeLabels';
import { useFormDraft } from '../lib/useFormDraft';
import { useToast } from '../contexts/ToastContext';
import { MemberDetailSaveProvider, useMemberDetailSave, type MemberDetailSave } from '../components/MemberDetailSaveContext';
import { PeriodPicker } from '../components/PeriodPicker';
const resourceCategories: Record<string, string> = { space: 'Space / table', equipment: 'Equipment', other: 'Other' };
export function AdminServices() {
    const confirm = useConfirm();
    const notify=useToast();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [edit, setEdit] = useState<Service | null | undefined>(undefined);
    const [detail, setDetail] = useState<Service | null>(null);
    const [form, setForm, dirty, resetForm] = useFormDraft({ name: '', description: '', active: true });
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['services', orgId, page, q, sortField, sortDirection], queryFn: () => list<Service>(orgId, '/services', { page, size: 12, q, sort: `${sortField},${sortDirection}` }) });
    const changeSort = (field: string) => {
        setSortDirection(current => field === sortField ? current === 'asc' ? 'desc' : 'asc' : 'asc');
        setSortField(field);
        setPage(0);
    };
    const open = (s: Service | null) => { setEdit(s); resetForm({ name: s?.name || '', description: s?.description || '', active: s?.active ?? true }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/services/${edit.id}` : '/services', json(edit ? 'PUT' : 'POST', edit ? form : { name: form.name, description: form.description })), onSuccess: () => { notify(tr(edit ? 'Service updated successfully.' : 'Service created successfully.')); setEdit(undefined); qc.invalidateQueries({ queryKey: ['services', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/services/${id}`, { method: 'DELETE' }), onSuccess: () => { notify(tr('Service deleted successfully.')); qc.invalidateQueries({ queryKey: ['services', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    return <><PageTitle eyebrow={tr("CATALOG")} title={tr("Services")} description={tr("Configure services, prices, duration, and required resources.")} action={<AddButton label={tr("New service")} onClick={() => open(null)}/>}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search services…")}/></div>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? q.trim() ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No services yet")} description={tr("Create your first service.")} action={<AddButton onClick={() => open(null)}/>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><SortableHeader label={tr("Service")} active={sortField === 'name'} direction={sortDirection} onClick={() => changeSort('name')}/><SortableHeader label={tr("Description")} active={sortField === 'description'} direction={sortDirection} onClick={() => changeSort('description')}/><SortableHeader label={tr("Status")} active={sortField === 'active'} direction={sortDirection} onClick={() => changeSort('active')}/><th /></tr></thead><tbody>{data.items.map(s => <tr key={s.id}><td><div className="cell-name"><span className="cell-icon"><Layers3 size={18}/></span><strong>{s.name}</strong></div></td><td className="table-description">{s.description || '—'}</td><td><Badge tone={s.active ? 'green' : 'neutral'}>{s.active ? tr('Active') : tr('Inactive')}</Badge></td><td><div className="table-actions"><Button variant="ghost" onClick={() => setDetail(s)}><Settings2 size={16}/>{tr("Manage")}</Button><button className="icon-button" title={tr("Edit")} onClick={() => open(s)}><Pencil size={17}/></button><button className="icon-button" title={tr('Delete service')} aria-label={tr('Delete service')} disabled={remove.isPending} onClick={async () => { if (await confirm(tr('Delete this service? Services used in reservations or waitlists cannot be deleted.'))) remove.mutate(s.id); }}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Edit service') : tr('New service')} onClose={() => setEdit(undefined)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}><Field label={tr("Service name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("Description")}><TextArea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/></Field>{edit && <Field label={tr("Status")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option></Select></Field>}<SubmitRow busy={save.isPending} dirty={dirty}/></form></Modal>}
    {detail && <Modal wide title={`${tr('Service')} · ${detail.name}`} onClose={() => setDetail(null)}><ServiceDetail org={orgId} service={detail} onSaved={() => setDetail(null)}/></Modal>}
  </>;
}
function ServiceDetail({ org, service, onSaved }: {
    org: number;
    service: Service;
    onSaved: () => void;
}) {
    const [tab, setTab] = useState<'versions' | 'booking' | 'resources' | 'photos'>('versions');
    const [visitedTabs, setVisitedTabs] = useState(new Set(['versions']));
    const [pendingSaves, setPendingSaves] = useState<Record<string, { order: number; save: MemberDetailSave }>>({});
    const [saving, setSaving] = useState(false);
    const notify = useToast();
    const {data:setup}=useQuery({queryKey:['setup',org],queryFn:()=>getSetup(org)});
    const settings=setup?.settings as Record<string,unknown>|undefined;
    const showResourceRequirements=setup?.booking_model==='RESOURCE'||setup?.booking_model==='RENTAL'||settings?.trackResources===true;
    const activeTab=tab==='resources'&&!showResourceRequirements?'versions':tab;
    const selectTab = (next: 'versions' | 'booking' | 'resources' | 'photos') => {
        setTab(next);
        setVisitedTabs(current => new Set(current).add(next));
    };
    const registerSave = useCallback((key: string, order: number, save: MemberDetailSave | null) => {
        setPendingSaves(current => {
            if (!save) { if (!current[key]) return current; const next = { ...current }; delete next[key]; return next; }
            return { ...current, [key]: { order, save } };
        });
    }, []);
    async function saveAll() {
        setSaving(true);
        try {
            for (const task of Object.values(pendingSaves).sort((a, b) => a.order - b.order)) await task.save();
            notify(tr('Changes saved successfully.'));
            onSaved();
        } catch (e) { notify(safeErrorMessage(e), 'error'); } finally { setSaving(false); }
    }
    return <MemberDetailSaveProvider value={registerSave}>
        <div className="tabs">
            <button className={activeTab === 'versions' ? 'active' : ''} onClick={() => selectTab('versions')}><CalendarClock size={16}/>{tr("Prices and durations")}</button>
            <button className={activeTab === 'booking' ? 'active' : ''} onClick={() => selectTab('booking')}><Users size={16}/>{tr("Booking options")}</button>
            {showResourceRequirements&&<button className={activeTab === 'resources' ? 'active' : ''} onClick={() => selectTab('resources')}><Settings2 size={16}/>{tr("Required resources")}</button>}
            <button className={activeTab === 'photos' ? 'active' : ''} onClick={() => selectTab('photos')}><Camera size={16}/>{tr("Photos")}</button>
        </div>
        <fieldset disabled={saving} style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}>
        {visitedTabs.has('versions')&&<div style={{ display: activeTab === 'versions' ? undefined : 'none' }}><VersionsEditor org={org} service={service.id}/></div>}
        {visitedTabs.has('booking')&&<div style={{ display: activeTab === 'booking' ? undefined : 'none' }}><BookingOptionsEditor org={org} service={service.id} appointment={setup?.booking_model==='APPOINTMENT'} resourcesEnabled={showResourceRequirements}/></div>}
        {showResourceRequirements&&visitedTabs.has('resources')&&<div style={{ display: activeTab === 'resources' ? undefined : 'none' }}><RequirementsEditor org={org} service={service.id} appointment={setup?.booking_model==='APPOINTMENT'}/></div>}
        {visitedTabs.has('photos')&&<div style={{ display: activeTab === 'photos' ? undefined : 'none' }}><MediaGallery org={org} kind="service" target={service.id} saveManagedExternally onSaved={onSaved}/></div>}
        </fieldset>
        <div className="form-actions"><Button loading={saving} disabled={!Object.keys(pendingSaves).length} onClick={saveAll}>{tr('Save all changes')}</Button></div>
    </MemberDetailSaveProvider>;
}
function VersionsEditor({ org, service }: {
    org: number;
    service: number;
}) {
    const qc = useQueryClient();
    const notify=useToast();
    const key = ['versions', org, service];
    const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => versions(org, service) });
    const {data:setup}=useQuery({queryKey:['setup',org],queryFn:()=>getSetup(org)});
    const [add, setAdd] = useState(false);
    const [form, setForm, dirty, resetForm] = useFormDraft({ validFrom: today(), validTo: '', durationMinutes: 45, slotIntervalMinutes: 15, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, price: 450, currency: 'CZK', durationMode: 'FIXED', maxDurationMinutes: 1440 });
    const update = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));
    const save = useMutation({ mutationFn: () => orgApi(org, `/services/${service}/versions`, json('POST', { ...form, validTo: form.validTo || null, maxDurationMinutes: form.durationMode === 'CUSTOM' ? form.maxDurationMinutes : null })), onSuccess: () => { notify(tr('Pricing version added successfully.')); setAdd(false); qc.invalidateQueries({ queryKey: key }); }, onError: e => notify(safeErrorMessage(e),'error') });
    return <div className="stack"><div className="section-heading"><div><h3>{tr("Service version")}</h3><p>{tr("Validity, price, and duration. Service versions are retained for history.")}</p></div><AddButton onClick={() => { const currency=(setup?.settings as Record<string,unknown>)?.defaultCurrency;resetForm({...form,currency:typeof currency==='string'?currency:'CZK'});setAdd(true); }} label={tr("New version")}/></div>{isLoading ? <Loading /> : error ? <ErrorState error={error}/> : !data?.length ? <Empty title={tr("Price and duration not set yet")} description={tr("A service cannot be booked publicly without a valid version.")}/> : <div className="version-list">{data.map((v: Version) => <div className="version-row" key={v.id}><div><strong>{money(v.price, v.currency)}</strong><span>{v.duration_mode === 'CUSTOM' ? tr('Custom duration') : `${v.duration_minutes} min`}{tr("· step")} {v.slot_interval_minutes}{tr("min")}</span></div><div><Badge tone="blue">{tr("From")} {formatDate(v.valid_from)}</Badge>{v.valid_to && <small>{tr("To")} {formatDate(v.valid_to)}</small>}</div></div>)}</div>}
    {add && <Modal title={tr("New pricing version")} onClose={() => setAdd(false)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}><div className="form-grid"><Field label={tr("Valid from")}><PeriodPicker field mode="day" label={tr("Valid from")} value={form.validFrom} minYear={1900} maxYear={2100} onChange={value => update('validFrom', value)}/></Field><Field label={tr("Valid until (optional)")}><PeriodPicker field mode="day" label={tr("Valid until (optional)")} value={form.validTo} minYear={1900} maxYear={2100} clearable onChange={value => update('validTo', value)}/></Field></div><div className="form-grid"><Field label={tr("Price")}><Input type="number" min="0" step="0.01" required value={form.price} onChange={e => update('price', Number(e.target.value))}/></Field><Field label={tr("Currency")}><Select value={form.currency} onChange={e => update('currency', e.target.value)}>{bookingCurrencies.map(x => <option value={x.value} key={x.value}>{x.label}</option>)}</Select></Field></div><Field label={tr("Duration mode")}><Select value={form.durationMode} onChange={e => update('durationMode', e.target.value)}><option value="FIXED">{tr("Fixed duration")}</option><option value="CUSTOM">{tr("Custom duration (rental)")}</option></Select></Field><div className="form-grid"><Field label={tr("Minimum duration (min)")}><Input type="number" min="1" required value={form.durationMinutes} onChange={e => update('durationMinutes', Number(e.target.value))}/></Field><Field label={tr("Slot interval (min)")}><Input type="number" min="1" required value={form.slotIntervalMinutes} onChange={e => update('slotIntervalMinutes', Number(e.target.value))}/></Field></div>{form.durationMode === 'CUSTOM' && <Field label={tr("Maximum duration (min)")}><Input type="number" min={form.durationMinutes} value={form.maxDurationMinutes} onChange={e => update('maxDurationMinutes', Number(e.target.value))}/></Field>}<div className="form-grid"><Field label={tr("Setup before (min)")}><Input type="number" min="0" value={form.bufferBeforeMinutes} onChange={e => update('bufferBeforeMinutes', Number(e.target.value))}/></Field><Field label={tr("Cleanup after (min)")}><Input type="number" min="0" value={form.bufferAfterMinutes} onChange={e => update('bufferAfterMinutes', Number(e.target.value))}/></Field></div><p className="muted small">{tr('Pricing periods cannot overlap. End the previous price first.')}</p><SubmitRow busy={save.isPending} dirty={dirty}/></form></Modal>}
  </div>;
}
interface BookingOptions {
    customer_can_choose_staff:boolean;
    customer_can_choose_resource:boolean;
    required_staff_count:number;
}
function BookingOptionsEditor({org,service,appointment,resourcesEnabled}:{org:number;service:number;appointment:boolean;resourcesEnabled:boolean}) {
    const qc=useQueryClient();
    const key=['service-booking-options',org,service];
    const options=useQuery({queryKey:key,queryFn:()=>orgApi<BookingOptions>(org,`/services/${service}/booking-options`)});
    const requirements=useQuery({queryKey:['requirements',org,service],queryFn:()=>orgApi<Req[]>(org,`/services/${service}/resource-requirements`)});
    const [form,setForm]=useState<BookingOptions|null>(null);
    const value=form??options.data;
    const dirty=form!==null&&JSON.stringify(form)!==JSON.stringify(options.data);
    const nonStaffRequirements=requirements.data?.filter(r=>r.category!=='staff')??[];
    const canChooseResource=nonStaffRequirements.length===1&&nonStaffRequirements[0].quantity===1;
    const save=useMutation({mutationFn:()=>orgApi(org,`/services/${service}/booking-options`,json('PUT',{
        customerCanChooseStaff:value?.customer_can_choose_staff??false,
        customerCanChooseResource:value?.customer_can_choose_resource??false,
        requiredStaffCount:value?.required_staff_count??1,
    })),onSuccess:()=>{setForm(null);void qc.invalidateQueries({queryKey:key});void qc.invalidateQueries({queryKey:['requirements',org,service]});}});
    useMemberDetailSave(`booking-options-${service}`, 0, dirty, async () => { await save.mutateAsync(); });
    if(options.isLoading||requirements.isLoading)return <Loading/>;
    if(options.error||requirements.error)return <ErrorState error={options.error||requirements.error}/>;
    if(!value)return null;
    return <div className="stack"><div className="section-heading"><div><h3>{tr("Booking options")}</h3><p>{tr("Choose separately for each service what customers can select.")}</p></div></div>
        {appointment&&<><label className="setup-check"><input type="checkbox" checked={value.customer_can_choose_staff} onChange={e=>setForm({...value,customer_can_choose_staff:e.target.checked})}/>{tr("Customers can choose staff for this service")}</label><p className="muted small">{tr("If enabled, customers must select every required staff member. Otherwise, the system assigns available staff automatically.")}</p><Field label={tr("Staff members required at the same time")}><Input type="number" min={1} max={100} value={value.required_staff_count} onChange={e=>setForm({...value,required_staff_count:Number(e.target.value)})}/></Field></>}
        {resourcesEnabled&&<>
        {canChooseResource&&<label className="setup-check"><input type="checkbox" checked={value.customer_can_choose_resource} onChange={e=>setForm({...value,customer_can_choose_resource:e.target.checked})}/>{tr("Customers can choose a resource for this service")}</label>}
        {nonStaffRequirements.length>1&&<p className="muted small">{tr("Customer resource choice is available only when this service requires one resource type.")}</p>}
        {nonStaffRequirements.length===1&&!canChooseResource&&<p className="muted small">{tr("Customer resource choice is only available when the service requires one unit of a resource.")}</p>}
        {nonStaffRequirements.length===0&&<p className="muted small">{tr("Add one resource requirement to let customers choose a resource for this service.")}</p>}
        </>}
    </div>;
}
interface Req {
    resource_type_id: number;
    quantity: number;
    min_capacity: number | null;
    resource_type: string;
    category: string;
}
function RequirementsEditor({ org, service, appointment }: {
    org: number;
    service: number;
    appointment: boolean;
}) {
    const qc = useQueryClient();
    const key = ['requirements', org, service];
    const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => orgApi<Req[]>(org, `/services/${service}/resource-requirements`) });
    const types = useQuery({ queryKey: ['resource-types', org], queryFn: () => resourceTypes(org) });
    const [rows, setRows] = useState<{
        resourceTypeId: number;
        quantity: number;
        minCapacity: string;
    }[] | null>(null);
    const equipmentTypes=types.data?.filter(type=>type.category!=='staff'&&(!appointment||type.category!=='space'))??[];
    const savedRows = data?.filter(r=>r.category!=='staff'&&(!appointment||r.category!=='space')).map(r => ({ resourceTypeId: r.resource_type_id, quantity: r.quantity, minCapacity: r.min_capacity == null ? '' : String(r.min_capacity) })) ?? [];
    const active = rows ?? savedRows;
    const dirty = rows !== null && JSON.stringify(active) !== JSON.stringify(savedRows);
    const save = useMutation({ mutationFn: () => {
        const hiddenSpaces=appointment?(data??[]).filter(r=>r.category==='space').map(r=>({resourceTypeId:r.resource_type_id,quantity:r.quantity,minCapacity:r.min_capacity})): [];
        return orgApi(org, `/services/${service}/resource-requirements`, json('PUT', { requirements: [...active.map(r => ({ resourceTypeId: r.resourceTypeId, quantity: r.quantity, minCapacity: r.minCapacity ? Number(r.minCapacity) : null })), ...hiddenSpaces] }));
    }, onSuccess: () => { setRows(null); qc.invalidateQueries({ queryKey: key }); } });
    useMemberDetailSave(`resource-requirements-${service}`, 1, dirty, async () => { await save.mutateAsync(); });
    return <div className="stack"><div className="section-heading"><div><h3>{tr("Resource requirements")}</h3><p>{tr("For example, one chair, room, or two pieces of equipment.")}</p></div></div>{isLoading || types.isLoading ? <Loading /> : error ? <ErrorState error={error}/> : <>{active.map((r, i) => { const selectedType=equipmentTypes.find(type=>type.id===r.resourceTypeId); return <div key={i} className="requirement-row"><Field label={tr("Resource type")}><Select value={r.resourceTypeId} onChange={e => { const resourceTypeId=Number(e.target.value); const category=equipmentTypes.find(type=>type.id===resourceTypeId)?.category; setRows(active.map((x, j) => j === i ? { ...x, resourceTypeId, minCapacity: category==='space' ? x.minCapacity : '' } : x)); }}>{equipmentTypes.map(t => <option key={t.id} value={t.id}>{resourceTypeLabel(t)} ({tr(resourceCategories[t.category] || t.category)})</option>)}</Select></Field><Field label={tr("Quantity")}><Input type="number" min="1" max="100" value={r.quantity} onChange={e => setRows(active.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))}/></Field>{selectedType?.category==='space'&&<Field label={tr("Min. people")}><Input type="number" min="1" placeholder="—" value={r.minCapacity} onChange={e => setRows(active.map((x, j) => j === i ? { ...x, minCapacity: e.target.value } : x))}/></Field>}<Button variant="ghost" onClick={() => setRows(active.filter((_, j) => j !== i))}>{tr("Remove")}</Button></div>; })}<Button variant="secondary" disabled={!equipmentTypes.length} onClick={() => setRows([...active, { resourceTypeId: equipmentTypes[0].id, quantity: 1, minCapacity: '' }])}>{tr("+ Add requirement")}</Button><p className="muted small">{tr("Add equipment or rooms needed for this service. Staff availability is managed in Team.")}</p></>}
  </div>;
}
