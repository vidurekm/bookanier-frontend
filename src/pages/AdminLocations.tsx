import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Clock3, MapPin, Pencil, Settings2 } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { json, list, orgApi } from '../lib/api';
import type { Location } from '../lib/types';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, Notice, PageTitle, Pager, SearchBox, Select, SubmitRow } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { WeekEditor } from '../components/WeekEditor';
import { AddressVerify, mapUrl } from '../components/AddressVerify';
import { DateExceptions } from '../components/DateExceptions';
import { CalendarOff } from 'lucide-react';
export function AdminLocations() {
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Location | null | undefined>(undefined);
    const [detail, setDetail] = useState<Location | null>(null);
    const [error, setError] = useState('');
    const key = ['locations', orgId, page, q];
    const { data, isLoading, error: loadError } = useQuery({ queryKey: key, queryFn: () => list<Location>(orgId, '/locations', { page, size: 12, q }) });
    const [form, setForm] = useState({ name: '', address: '', timezone: 'Europe/Prague', active: true, latitude: null as number|null, longitude: null as number|null });
    const open = (l: Location | null) => { setError(tr("")); setEdit(l); setForm({ name: l?.name || '', address: l?.address || '', timezone: l?.timezone || 'Europe/Prague', active: l?.active ?? true, latitude: l?.latitude ?? null, longitude: l?.longitude ?? null }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/locations/${edit.id}` : '/locations', json(edit ? 'PUT' : 'POST', edit ? form : { name: form.name, address: form.address, timezone: form.timezone, latitude: form.latitude, longitude: form.longitude })), onSuccess: () => { setEdit(undefined); qc.invalidateQueries({ queryKey: ['locations', orgId] }); }, onError: e => setError(safeErrorMessage(e)) });
    return <><PageTitle eyebrow={tr("SPR\u00C1VA PROVOZU")} title={tr("Pobo\u010Dky")} description={tr("Spravujte provozovny, jejich otev\u00EDrac\u00ED dobu, nab\u00EDdku slu\u017Eeb a fotografie.")} action={<AddButton label={tr("Nov\u00E1 pobo\u010Dka")} onClick={() => open(null)}/>}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Hledat pobo\u010Dku\u2026")}/><span className="muted small">{data?.totalElements ?? 0}{tr("pobo\u010Dek")}</span></div>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? <Empty title={tr("\u017D\u00E1dn\u00E9 pobo\u010Dky")} description={tr("P\u0159idejte prvn\u00ED provozovnu.")} action={<AddButton onClick={() => open(null)} label={tr("P\u0159idat pobo\u010Dku")}/>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Pobo\u010Dka")}</th><th>{tr("Adresa")}</th><th>{tr("\u010Casov\u00E9 p\u00E1smo")}</th><th>{tr("Stav")}</th><th /></tr></thead><tbody>{data.items.map(l => <tr key={l.id}><td><div className="cell-name"><span className="cell-icon"><MapPin size={18}/></span><strong>{l.name}</strong></div></td><td>{l.address || '—'}{l.latitude!=null&&l.longitude!=null&&<a className="geo-table-map" href={mapUrl(l.latitude,l.longitude)} target="_blank" rel="noopener noreferrer">{tr('Mapa')} ↗</a>}</td><td>{l.timezone}</td><td><Badge tone={l.active ? 'green' : 'neutral'}>{l.active ? tr('Aktivní') : tr('Neaktivní')}</Badge></td><td><div className="table-actions"><Button variant="ghost" onClick={() => setDetail(l)}><Settings2 size={16}/>{tr("Spravovat")}</Button><button className="icon-button" title={tr("Upravit")} onClick={() => open(l)}><Pencil size={17}/></button></div></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Upravit pobočku') : tr('Nová pobočka')} onClose={() => setEdit(undefined)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={error}/><Field label={tr("N\u00E1zev pobo\u010Dky")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("Adresa")}><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value, latitude: null, longitude: null }))}/></Field><AddressVerify org={orgId} address={form.address} latitude={form.latitude} longitude={form.longitude} onSelect={geo=>setForm(p=>({...p,address:geo.address,latitude:geo.latitude,longitude:geo.longitude}))}/><Field label={tr("\u010Casov\u00E9 p\u00E1smo")}><Input required value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} placeholder={tr("Europe/Prague")}/></Field>{edit && <Field label={tr("Stav")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Aktivn\u00ED")}</option><option value="false">{tr("Neaktivn\u00ED")}</option></Select></Field>}<SubmitRow busy={save.isPending} onCancel={() => setEdit(undefined)}/></form></Modal>}
    {detail && <Modal wide title={`${tr('Pobočka')} · ${detail.name}`} onClose={() => setDetail(null)}><LocationDetail org={orgId} location={detail}/></Modal>}
  </>;
}
function LocationDetail({ org, location }: {
    org: number;
    location: Location;
}) {
    const [tab, setTab] = useState<'hours' | 'exceptions' | 'services' | 'photos'>('hours');
    return <div><div className="tabs"><button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}><Clock3 size={16}/>{tr("Otev\u00EDrac\u00ED doba")}</button><button className={tab === 'exceptions' ? 'active' : ''} onClick={() => setTab('exceptions')}><CalendarOff size={16}/>{tr('Výjimky a svátky')}</button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}><Settings2 size={16}/>{tr("Nab\u00EDdka slu\u017Eeb")}</button><button className={tab === 'photos' ? 'active' : ''} onClick={() => setTab('photos')}><Camera size={16}/>{tr("Fotografie")}</button></div>{tab === 'hours' ? <WeekEditor org={org} location={location.id}/> : tab === 'exceptions' ? <DateExceptions org={org} location={location.id}/> : tab === 'services' ? <LocationServices org={org} location={location.id}/> : <MediaGallery org={org} kind="location" target={location.id}/>}</div>;
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
    const save = useMutation({ mutationFn: () => orgApi(org, `/locations/${location}/services`, json('PUT', { ids })), onSuccess: () => { setSelected(null); setMessage(tr('Nabídka služeb byla uložena.')); setFailure(''); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><p className="muted">{tr("Za\u0161krtn\u011Bte slu\u017Eby dostupn\u00E9 na t\u00E9to pobo\u010Dce. Bez p\u0159i\u0159azen\u00ED nelze slu\u017Ebu ve\u0159ejn\u011B rezervovat.")}</p><Notice message={failure}/><Notice message={message} kind="success"/>{isLoading ? <Loading /> : error ? <ErrorState error={error}/> : data?.length ? data.map(x => <label className="checkbox-row" key={x.service_id}><input type="checkbox" checked={ids.includes(x.service_id)} onChange={e => setSelected(p => e.target.checked ? [...(p ?? ids), x.service_id] : (p ?? ids).filter(id => id !== x.service_id))}/><span>{x.name}</span></label>) : <Empty title={tr("Zat\u00EDm nejsou vytvo\u0159en\u00E9 slu\u017Eby")}/>}<div className="form-actions"><Button loading={save.isPending} disabled={!data?.length} onClick={() => save.mutate()}>{tr("Ulo\u017Eit p\u0159i\u0159azen\u00ED")}</Button></div></div>;
}
