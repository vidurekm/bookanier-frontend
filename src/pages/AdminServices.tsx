import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, Layers3, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { json, list, orgApi, resourceTypes, versions } from '../lib/api';
import type { Service, Version } from '../lib/types';
import { formatDate, money, today } from '../lib/utils';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, Notice, PageTitle, Pager, SearchBox, Select, SubmitRow, TextArea } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { bookingCurrencies } from '../lib/bookingOptions';
import { getSetup } from '../lib/setup';
import { useConfirm } from '../contexts/ConfirmContext';
export function AdminServices() {
    const confirm = useConfirm();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Service | null | undefined>(undefined);
    const [detail, setDetail] = useState<Service | null>(null);
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [form, setForm] = useState({ name: '', description: '', active: true });
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['services', orgId, page, q], queryFn: () => list<Service>(orgId, '/services', { page, size: 12, q }) });
    const open = (s: Service | null) => { setError(tr("")); setEdit(s); setForm({ name: s?.name || '', description: s?.description || '', active: s?.active ?? true }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/services/${edit.id}` : '/services', json(edit ? 'PUT' : 'POST', edit ? form : { name: form.name, description: form.description })), onSuccess: () => { setEdit(undefined); qc.invalidateQueries({ queryKey: ['services', orgId] }); }, onError: e => setError(safeErrorMessage(e)) });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/services/${id}`, { method: 'DELETE' }), onSuccess: () => { setDeleteError(''); qc.invalidateQueries({ queryKey: ['services', orgId] }); }, onError: e => setDeleteError(safeErrorMessage(e)) });
    return <><PageTitle eyebrow={tr("CATALOG")} title={tr("Services")} description={tr("Configure services, prices, duration, and required resources.")} action={<AddButton label={tr("New service")} onClick={() => open(null)}/>}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search services…")}/>    <span className="muted small">{tr('Service count')}: {data?.totalElements || 0}</span></div><Notice message={deleteError}/>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? q.trim() ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No services yet")} description={tr("Create your first service.")} action={<AddButton onClick={() => open(null)}/>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Service")}</th><th>{tr("Description")}</th><th>{tr("Status")}</th><th /></tr></thead><tbody>{data.items.map(s => <tr key={s.id}><td><div className="cell-name"><span className="cell-icon"><Layers3 size={18}/></span><strong>{s.name}</strong></div></td><td className="table-description">{s.description || '—'}</td><td><Badge tone={s.active ? 'green' : 'neutral'}>{s.active ? tr('Active') : tr('Inactive')}</Badge></td><td><div className="table-actions"><Button variant="ghost" onClick={() => setDetail(s)}><Settings2 size={16}/>{tr("Manage")}</Button><button className="icon-button" title={tr("Edit")} onClick={() => open(s)}><Pencil size={17}/></button><button className="icon-button" title={tr('Delete service')} aria-label={tr('Delete service')} disabled={remove.isPending} onClick={async () => { if (await confirm(tr('Delete this service? Services used in reservations or waitlists cannot be deleted.'))) { setDeleteError(''); remove.mutate(s.id); } }}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Edit service') : tr('New service')} onClose={() => setEdit(undefined)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={error}/><Field label={tr("Service name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("Description")}><TextArea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/></Field>{edit && <Field label={tr("Status")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option></Select></Field>}<SubmitRow busy={save.isPending} onCancel={() => setEdit(undefined)}/></form></Modal>}
    {detail && <Modal wide title={`${tr('Service')} · ${detail.name}`} onClose={() => setDetail(null)}><ServiceDetail org={orgId} service={detail}/></Modal>}
  </>;
}
function ServiceDetail({ org, service }: {
    org: number;
    service: Service;
}) { const [tab, setTab] = useState<'versions' | 'resources' | 'photos'>('versions'); return <><div className="tabs"><button className={tab === 'versions' ? 'active' : ''} onClick={() => setTab('versions')}><CalendarClock size={16}/>{tr("Prices and durations")}</button><button className={tab === 'resources' ? 'active' : ''} onClick={() => setTab('resources')}><Settings2 size={16}/>{tr("Required resources")}</button><button className={tab === 'photos' ? 'active' : ''} onClick={() => setTab('photos')}><Camera size={16}/>{tr("Photos")}</button></div>{tab === 'versions' ? <VersionsEditor org={org} service={service.id}/> : tab === 'resources' ? <RequirementsEditor org={org} service={service.id}/> : <MediaGallery org={org} kind="service" target={service.id}/>}</>; }
function VersionsEditor({ org, service }: {
    org: number;
    service: number;
}) {
    const qc = useQueryClient();
    const key = ['versions', org, service];
    const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => versions(org, service) });
    const {data:setup}=useQuery({queryKey:['setup',org],queryFn:()=>getSetup(org)});
    const [add, setAdd] = useState(false);
    const [failure, setFailure] = useState('');
    const [form, setForm] = useState({ validFrom: today(), validTo: '', durationMinutes: 45, slotIntervalMinutes: 15, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, price: 450, currency: 'CZK', durationMode: 'FIXED', maxDurationMinutes: 1440 });
    const update = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));
    const save = useMutation({ mutationFn: () => orgApi(org, `/services/${service}/versions`, json('POST', { ...form, validTo: form.validTo || null, maxDurationMinutes: form.durationMode === 'CUSTOM' ? form.maxDurationMinutes : null })), onSuccess: () => { setAdd(false); setFailure(''); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><div className="section-heading"><div><h3>{tr("Service version")}</h3><p>{tr("Validity, price, and duration. Service versions are retained for history.")}</p></div><AddButton onClick={() => { const currency=(setup?.settings as Record<string,unknown>)?.defaultCurrency;setForm(p=>({...p,currency:typeof currency==='string'?currency:'CZK'}));setAdd(true); }} label={tr("New version")}/></div>{isLoading ? <Loading /> : error ? <ErrorState error={error}/> : !data?.length ? <Empty title={tr("Price and duration not set yet")} description={tr("A service cannot be booked publicly without a valid version.")}/> : <div className="version-list">{data.map((v: Version) => <div className="version-row" key={v.id}><div><strong>{money(v.price, v.currency)}</strong><span>{v.duration_mode === 'CUSTOM' ? tr('Custom duration') : `${v.duration_minutes} min`}{tr("· step ")}{v.slot_interval_minutes}{tr("min")}</span></div><div><Badge tone="blue">{tr("From ")}{formatDate(v.valid_from)}</Badge>{v.valid_to && <small>{tr("To ")}{formatDate(v.valid_to)}</small>}</div></div>)}</div>}
    {add && <Modal title={tr("New pricing version")} onClose={() => setAdd(false)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={failure}/><div className="form-grid"><Field label={tr("Valid from")}><Input type="date" required value={form.validFrom} onChange={e => update('validFrom', e.target.value)}/></Field><Field label={tr("Valid until (optional)")}><Input type="date" value={form.validTo} onChange={e => update('validTo', e.target.value)}/></Field></div><div className="form-grid"><Field label={tr("Price")}><Input type="number" min="0" step="0.01" required value={form.price} onChange={e => update('price', Number(e.target.value))}/></Field><Field label={tr("Currency")}><Select value={form.currency} onChange={e => update('currency', e.target.value)}>{bookingCurrencies.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</Select></Field></div><Field label={tr("Duration mode")}><Select value={form.durationMode} onChange={e => update('durationMode', e.target.value)}><option value="FIXED">{tr("Fixed duration")}</option><option value="CUSTOM">{tr("Custom duration (rental)")}</option></Select></Field><div className="form-grid"><Field label={tr("Minimum duration (min)")}><Input type="number" min="1" required value={form.durationMinutes} onChange={e => update('durationMinutes', Number(e.target.value))}/></Field><Field label={tr("Slot interval (min)")}><Input type="number" min="1" required value={form.slotIntervalMinutes} onChange={e => update('slotIntervalMinutes', Number(e.target.value))}/></Field></div>{form.durationMode === 'CUSTOM' && <Field label={tr("Maximum duration (min)")}><Input type="number" min={form.durationMinutes} value={form.maxDurationMinutes} onChange={e => update('maxDurationMinutes', Number(e.target.value))}/></Field>}<div className="form-grid"><Field label={tr("Setup before (min)")}><Input type="number" min="0" value={form.bufferBeforeMinutes} onChange={e => update('bufferBeforeMinutes', Number(e.target.value))}/></Field><Field label={tr("Cleanup after (min)")}><Input type="number" min="0" value={form.bufferAfterMinutes} onChange={e => update('bufferAfterMinutes', Number(e.target.value))}/></Field></div><p className="muted small">{tr('Pricing periods cannot overlap. End the previous price first.')}</p><SubmitRow busy={save.isPending} onCancel={() => setAdd(false)}/></form></Modal>}
  </div>;
}
interface Req {
    resource_type_id: number;
    quantity: number;
    min_capacity: number | null;
    resource_type: string;
    category: string;
}
function RequirementsEditor({ org, service }: {
    org: number;
    service: number;
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
    const [failure, setFailure] = useState('');
    const [success, setSuccess] = useState('');
    const active = rows ?? data?.map(r => ({ resourceTypeId: r.resource_type_id, quantity: r.quantity, minCapacity: r.min_capacity == null ? '' : String(r.min_capacity) })) ?? [];
    const save = useMutation({ mutationFn: () => orgApi(org, `/services/${service}/resource-requirements`, json('PUT', { requirements: active.map(r => ({ resourceTypeId: r.resourceTypeId, quantity: r.quantity, minCapacity: r.minCapacity ? Number(r.minCapacity) : null })) })), onSuccess: () => { setRows(null); setFailure(''); setSuccess(tr("Resource requirements saved.")); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><div className="section-heading"><div><h3>{tr("Resource requirements")}</h3><p>{tr("For example, 1 hairdresser, 1 chair, or 2 pieces of equipment.")}</p></div></div><Notice message={failure}/><Notice message={success} kind="success"/>{isLoading || types.isLoading ? <Loading /> : error ? <ErrorState error={error}/> : <>{active.map((r, i) => <div key={i} className="requirement-row"><Field label={tr("Resource type")}><Select value={r.resourceTypeId} onChange={e => setRows(active.map((x, j) => j === i ? { ...x, resourceTypeId: Number(e.target.value) } : x))}>{types.data?.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}</Select></Field><Field label={tr("Quantity")}><Input type="number" min="1" max="100" value={r.quantity} onChange={e => setRows(active.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))}/></Field><Field label={tr("Min. capacity")}><Input type="number" min="1" placeholder="—" value={r.minCapacity} onChange={e => setRows(active.map((x, j) => j === i ? { ...x, minCapacity: e.target.value } : x))}/></Field><Button variant="ghost" onClick={() => setRows(active.filter((_, j) => j !== i))}>{tr("Remove")}</Button></div>)}<Button variant="secondary" disabled={!types.data?.length} onClick={() => setRows([...active, { resourceTypeId: types.data![0].id, quantity: 1, minCapacity: '' }])}>{tr("+ Add requirement")}</Button><p className="muted small">{tr('Add the equipment or people a service needs. Availability is checked when booking.')}</p><div className="form-actions"><Button loading={save.isPending} onClick={() => save.mutate()}>{tr("Save requirements")}</Button></div></>}
  </div>;
}
