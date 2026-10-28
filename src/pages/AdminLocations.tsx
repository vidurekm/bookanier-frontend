import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { timeZoneLabel, timeZoneOptions } from '../lib/utils';
import { useCallback, useState, type FormEvent } from 'react';
import { MemberDetailSaveProvider, useMemberDetailSave, type MemberDetailSave } from '../components/MemberDetailSaveContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Clock3, MapPin, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { json, list, orgApi } from '../lib/api';
import type { Location } from '../lib/types';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, PageTitle, Pager, SearchBox, Select, SortableHeader, SubmitRow } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { WeekEditor } from '../components/WeekEditor';
import { AddressVerify, mapUrl } from '../components/AddressVerify';
import { DateExceptions } from '../components/DateExceptions';
import { CalendarOff } from 'lucide-react';
import { useConfirm } from '../contexts/ConfirmContext';
import { useFormDraft } from '../lib/useFormDraft';
import { useToast } from '../contexts/ToastContext';
export function AdminLocations() {
    const confirm = useConfirm();
    const notify = useToast();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Location | null | undefined>(undefined);
    const [editTab, setEditTab] = useState<'details' | 'photos'>('details');
    const [detail, setDetail] = useState<Location | null>(null);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const changeSort = (field: string) => {
        setSortDirection(current => field === sortField ? current === 'asc' ? 'desc' : 'asc' : 'asc');
        setSortField(field);
        setPage(0);
    };
    const key = ['locations', orgId, page, q, sortField, sortDirection];
    const { data, isLoading, error: loadError } = useQuery({ queryKey: key, queryFn: () => list<Location>(orgId, '/locations', { page, size: 12, q, sort: `${sortField},${sortDirection}` }) });
    const [form, setForm, dirty, resetForm] = useFormDraft({ name: '', address: '', timezone: 'Europe/Prague', active: true, latitude: null as number|null, longitude: null as number|null });
    const open = (l: Location | null) => { setEditTab('details'); setEdit(l); resetForm({ name: l?.name || '', address: l?.address || '', timezone: l?.timezone || 'Europe/Prague', active: l?.active ?? true, latitude: l?.latitude ?? null, longitude: l?.longitude ?? null }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/locations/${edit.id}` : '/locations', json(edit ? 'PUT' : 'POST', edit ? form : { name: form.name, address: form.address, timezone: form.timezone, latitude: form.latitude, longitude: form.longitude })), onSuccess: () => { notify(tr(edit ? 'Location updated successfully.' : 'Location created successfully.')); setEdit(undefined); qc.invalidateQueries({ queryKey: ['locations', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/locations/${id}`, { method: 'DELETE' }), onSuccess: (_data, id) => { notify(tr('Location archived successfully.')); setDetail(current => current?.id === id ? null : current); setPage(0); qc.invalidateQueries({ queryKey: ['locations', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    return <><PageTitle eyebrow={tr("LOCATION MANAGEMENT")} title={tr("Locations")} description={tr("Manage locations, opening hours, services, and photos.")} action={<AddButton label={tr("New location")} onClick={() => open(null)}/>}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search locations…")}/></div>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? q.trim() ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No locations yet")} description={tr("Add your first location.")} action={<AddButton onClick={() => open(null)} label={tr("Add location")}/>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><SortableHeader label={tr("Location")} active={sortField === 'name'} direction={sortDirection} onClick={() => changeSort('name')}/><SortableHeader label={tr("Address")} active={sortField === 'address'} direction={sortDirection} onClick={() => changeSort('address')}/><SortableHeader label={tr("Time zone")} active={sortField === 'timezone'} direction={sortDirection} onClick={() => changeSort('timezone')}/><SortableHeader label={tr("Status")} active={sortField === 'active'} direction={sortDirection} onClick={() => changeSort('active')}/><th /></tr></thead><tbody>{data.items.map(l => <tr key={l.id}><td><div className="cell-name"><span className="cell-icon"><MapPin size={18}/></span><strong>{l.name}</strong></div></td><td>{l.address || '—'}{l.latitude!=null&&l.longitude!=null&&<a className="geo-table-map" href={mapUrl(l.latitude,l.longitude)} target="_blank" rel="noopener noreferrer">{tr('Map')} ↗</a>}</td><td>{l.timezone}</td><td><Badge tone={l.active ? 'green' : 'neutral'}>{l.active ? tr('Active') : tr('Inactive')}</Badge></td><td><div className="table-actions"><Button variant="ghost" onClick={() => setDetail(l)}><Settings2 size={16}/>{tr("Manage")}</Button><button className="icon-button" title={tr("Edit")} onClick={() => open(l)}><Pencil size={17}/></button><button className="icon-button" title={tr("Archive location")} aria-label={tr("Archive location")} disabled={remove.isPending} onClick={async () => { if (await confirm(tr("Archive this location? Historical reservations will be kept."))) remove.mutate(l.id); }}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Edit location') : tr('New location')} onClose={() => setEdit(undefined)} wide>
        {edit && <div className="tabs"><button className={editTab === 'details' ? 'active' : ''} onClick={() => setEditTab('details')}>{tr('Details')}</button><button className={editTab === 'photos' ? 'active' : ''} onClick={() => setEditTab('photos')}><Camera size={16}/>{tr('Photos')}</button></div>}
        <div style={{display:editTab==='details'||!edit?undefined:'none'}}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}>
            <Field label={tr("Location name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("Address")}><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value, latitude: null, longitude: null }))}/></Field><AddressVerify org={orgId} address={form.address} latitude={form.latitude} longitude={form.longitude} onSelect={geo=>setForm(p=>({...p,address:geo.address,latitude:geo.latitude,longitude:geo.longitude}))}/><Field label={tr("Time zone")}><Select required value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>{timeZoneOptions(form.timezone).map(zone => <option key={zone} value={zone}>{timeZoneLabel(zone)}</option>)}</Select></Field>{edit && <Field label={tr("Status")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option></Select></Field>}<SubmitRow busy={save.isPending} dirty={dirty}/>
        </form></div>
        {edit && <div style={{display:editTab==='photos'?undefined:'none'}}><MediaGallery org={orgId} kind="location" target={edit.id} onSaved={() => setEdit(undefined)}/></div>}
    </Modal>}
    {detail && <Modal wide title={`${tr('Location')} · ${detail.name}`} onClose={() => setDetail(null)}><LocationDetail org={orgId} location={detail} onClose={() => setDetail(null)}/></Modal>}
  </>;
}
function LocationDetail({ org, location, onClose }: {
    org: number;
    location: Location;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<'hours' | 'exceptions' | 'services'>('hours');
    const [visitedTabs, setVisitedTabs] = useState(new Set(['hours', 'exceptions', 'services']));
    const [pendingSaves, setPendingSaves] = useState<Record<string, { order: number; save: MemberDetailSave }>>({});
    const [saving, setSaving] = useState(false);
    const notify=useToast();
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
            onClose();
        } catch (e) { notify(safeErrorMessage(e),'error'); } finally { setSaving(false); }
    }
    const selectTab = (next: 'hours' | 'exceptions' | 'services') => {
        setTab(next);
        setVisitedTabs(current => new Set(current).add(next));
    };
    return <MemberDetailSaveProvider value={registerSave}>
        <div className="tabs">
            <button className={tab === 'hours' ? 'active' : ''} onClick={() => selectTab('hours')}><Clock3 size={16}/>{tr("Opening hours")}</button>
            <button className={tab === 'exceptions' ? 'active' : ''} onClick={() => selectTab('exceptions')}><CalendarOff size={16}/>{tr('Exceptions and holidays')}</button>
            <button className={tab === 'services' ? 'active' : ''} onClick={() => selectTab('services')}><Settings2 size={16}/>{tr("Service offering")}</button>
        </div>
        <fieldset disabled={saving} style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}>
        {visitedTabs.has('hours')&&<div style={{ display: tab === 'hours' ? undefined : 'none' }}><WeekEditor org={org} location={location.id}/></div>}
        {visitedTabs.has('exceptions')&&<div style={{ display: tab === 'exceptions' ? undefined : 'none' }}><DateExceptions org={org} location={location.id}/></div>}
        {visitedTabs.has('services')&&<div style={{ display: tab === 'services' ? undefined : 'none' }}><LocationServices org={org} location={location.id}/></div>}
        </fieldset>
        <div className="form-actions"><Button loading={saving} disabled={!Object.keys(pendingSaves).length} onClick={saveAll}>{tr('Save all changes')}</Button></div>
    </MemberDetailSaveProvider>;
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
    const savedIds = data?.filter(x => x.active).map(x => x.service_id) ?? [];
    const ids = selected ?? savedIds;
    const dirty = selected !== null && (ids.length !== savedIds.length || ids.some(id => !savedIds.includes(id)));
    const saveDraft = useCallback(async () => {
        await orgApi(org, `/locations/${location}/services`, json('PUT', { ids }));
        setSelected(null);
        await qc.invalidateQueries({ queryKey: key });
    }, [ids, location, org, qc]); // eslint-disable-line react-hooks/exhaustive-deps
    useMemberDetailSave(`services-${location}`, 1, dirty, saveDraft);
    return <div className="stack"><p className="muted small">{tr("Select the services available at this location. A service cannot be booked publicly unless assigned to a location.")}</p>{isLoading ? <Loading /> : error ? <ErrorState error={error}/> : data?.length ? data.map(x => <label className="checkbox-row" key={x.service_id}><input type="checkbox" checked={ids.includes(x.service_id)} onChange={e => setSelected(p => e.target.checked ? [...(p ?? ids), x.service_id] : (p ?? ids).filter(id => id !== x.service_id))}/><span>{x.name}</span></label>) : <Empty title={tr("No services created yet")}/>}</div>;
}
