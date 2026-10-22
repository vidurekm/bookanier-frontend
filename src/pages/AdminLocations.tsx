import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Clock3, MapPin, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { json, list, orgApi } from '../lib/api';
import type { Location } from '../lib/types';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, Notice, PageTitle, Pager, SearchBox, Select, SubmitRow } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { WeekEditor } from '../components/WeekEditor';
import { AddressVerify, mapUrl } from '../components/AddressVerify';
import { DateExceptions } from '../components/DateExceptions';
import { CalendarOff } from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';
export function AdminLocations() {
    const confirm = useConfirm();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Location | null | undefined>(undefined);
    const [editTab, setEditTab] = useState<'details' | 'photos'>('details');
    const [detail, setDetail] = useState<Location | null>(null);
    const [error, setError] = useState('');
    const [removeError, setRemoveError] = useState('');
    const key = ['locations', orgId, page, q];
    const { data, isLoading, error: loadError } = useQuery({ queryKey: key, queryFn: () => list<Location>(orgId, '/locations', { page, size: 12, q }) });
    const [form, setForm] = useState({ name: '', address: '', timezone: 'Europe/Prague', active: true, latitude: null as number|null, longitude: null as number|null });
    const open = (l: Location | null) => { setError(tr("")); setEditTab('details'); setEdit(l); setForm({ name: l?.name || '', address: l?.address || '', timezone: l?.timezone || 'Europe/Prague', active: l?.active ?? true, latitude: l?.latitude ?? null, longitude: l?.longitude ?? null }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/locations/${edit.id}` : '/locations', json(edit ? 'PUT' : 'POST', edit ? form : { name: form.name, address: form.address, timezone: form.timezone, latitude: form.latitude, longitude: form.longitude })), onSuccess: () => { setEdit(undefined); qc.invalidateQueries({ queryKey: ['locations', orgId] }); }, onError: e => setError(safeErrorMessage(e)) });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/locations/${id}`, { method: 'DELETE' }), onSuccess: (_data, id) => { setRemoveError(''); setDetail(current => current?.id === id ? null : current); setPage(0); qc.invalidateQueries({ queryKey: ['locations', orgId] }); }, onError: e => setRemoveError(safeErrorMessage(e)) });
    return <><PageTitle eyebrow={tr("LOCATION MANAGEMENT")} title={tr("Locations")} description={tr("Manage locations, opening hours, services, and photos.")} action={<AddButton label={tr("New location")} onClick={() => open(null)}/>}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search locations…")}/>    <span className="muted small">{tr('Location count')}: {data?.totalElements ?? 0}</span></div><Notice message={removeError}/>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? q.trim() ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No locations yet")} description={tr("Add your first location.")} action={<AddButton onClick={() => open(null)} label={tr("Add location")}/>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Location")}</th><th>{tr("Address")}</th><th>{tr("Time zone")}</th><th>{tr("Status")}</th><th /></tr></thead><tbody>{data.items.map(l => <tr key={l.id}><td><div className="cell-name"><span className="cell-icon"><MapPin size={18}/></span><strong>{l.name}</strong></div></td><td>{l.address || '—'}{l.latitude!=null&&l.longitude!=null&&<a className="geo-table-map" href={mapUrl(l.latitude,l.longitude)} target="_blank" rel="noopener noreferrer">{tr('Map')} ↗</a>}</td><td>{l.timezone}</td><td><Badge tone={l.active ? 'green' : 'neutral'}>{l.active ? tr('Active') : tr('Inactive')}</Badge></td><td><div className="table-actions"><Button variant="ghost" onClick={() => setDetail(l)}><Settings2 size={16}/>{tr("Manage")}</Button><button className="icon-button" title={tr("Edit")} onClick={() => open(l)}><Pencil size={17}/></button><button className="icon-button" title={tr("Archive location")} aria-label={tr("Archive location")} disabled={remove.isPending} onClick={async () => { if (await confirm(tr("Archive this location? Historical reservations will be kept."))) remove.mutate(l.id); }}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Edit location') : tr('New location')} onClose={() => setEdit(undefined)} wide><>{edit && <div className="tabs"><button className={editTab === 'details' ? 'active' : ''} onClick={() => setEditTab('details')}>{tr('Details')}</button><button className={editTab === 'photos' ? 'active' : ''} onClick={() => setEditTab('photos')}><Camera size={16}/>{tr('Photos')}</button></div>}{editTab === 'details' || !edit ? <form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={error}/><Field label={tr("Location name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("Address")}><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value, latitude: null, longitude: null }))}/></Field><AddressVerify org={orgId} address={form.address} latitude={form.latitude} longitude={form.longitude} onSelect={geo=>setForm(p=>({...p,address:geo.address,latitude:geo.latitude,longitude:geo.longitude}))}/><Field label={tr("Time zone")}><Input required value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} placeholder={tr("Europe/Prague")}/></Field>{edit && <Field label={tr("Status")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option></Select></Field>}<SubmitRow busy={save.isPending} onCancel={() => setEdit(undefined)}/></form> : edit ? <MediaGallery org={orgId} kind="location" target={edit.id}/> : null}</></Modal>}
    {detail && <Modal wide title={`${tr('Location')} · ${detail.name}`} onClose={() => setDetail(null)}><LocationDetail org={orgId} location={detail}/></Modal>}
  </>;
}
function LocationDetail({ org, location }: {
    org: number;
    location: Location;
}) {
    const [tab, setTab] = useState<'hours' | 'exceptions' | 'services'>('hours');
    return <div><div className="tabs"><button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}><Clock3 size={16}/>{tr("Opening hours")}</button><button className={tab === 'exceptions' ? 'active' : ''} onClick={() => setTab('exceptions')}><CalendarOff size={16}/>{tr('Exceptions and holidays')}</button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}><Settings2 size={16}/>{tr("Service offering")}</button></div>{tab === 'hours' ? <WeekEditor org={org} location={location.id}/> : tab === 'exceptions' ? <DateExceptions org={org} location={location.id}/> : <LocationServices org={org} location={location.id}/>}</div>;
}
function LocationServices({ org, location }: {
    org: number;
    location: number;
}) {
    const qc = useQueryClient();
    const key = ['location-services', org, location];
    const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => orgApi<{
            service_id: number;
            name: string;
            active: boolean;
        }[]>(org, `/locations/${location}/services`) });
    const [selected, setSelected] = useState<number[] | null>(null);
    const [message, setMessage] = useState('');
    const [failure, setFailure] = useState('');
    const ids = selected ?? data?.filter(x => x.active).map(x => x.service_id) ?? [];
    const save = useMutation({ mutationFn: () => orgApi(org, `/locations/${location}/services`, json('PUT', { ids })), onSuccess: () => { setSelected(null); setMessage(tr('Service offering saved.')); setFailure(''); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><p className="muted">{tr("Select the services available at this location. A service cannot be booked publicly unless assigned to a location.")}</p><Notice message={failure}/><Notice message={message} kind="success"/>{isLoading ? <Loading /> : error ? <ErrorState error={error}/> : data?.length ? data.map(x => <label className="checkbox-row" key={x.service_id}><input type="checkbox" checked={ids.includes(x.service_id)} onChange={e => setSelected(p => e.target.checked ? [...(p ?? ids), x.service_id] : (p ?? ids).filter(id => id !== x.service_id))}/><span>{x.name}</span></label>) : <Empty title={tr("No services created yet")}/>}<div className="form-actions"><Button loading={save.isPending} disabled={!data?.length} onClick={() => save.mutate()}>{tr("Save assignments")}</Button></div></div>;
}
