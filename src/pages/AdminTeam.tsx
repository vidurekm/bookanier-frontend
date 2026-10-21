import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, Layers3, MapPin, Pencil, UserRound } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { json, list, locations, orgApi, services } from '../lib/api';
import type { Member } from '../lib/types';
import { roleLabel } from '../lib/utils';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, Notice, PageTitle, Pager, SearchBox, Select, SubmitRow } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { WeekEditor } from '../components/WeekEditor';
import { DateExceptions } from '../components/DateExceptions';
import { CalendarOff } from 'lucide-react';
import { myAccess } from '../lib/access';
export function AdminTeam() {
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Member | null | undefined>(undefined);
    const [detail, setDetail] = useState<Member | null>(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ displayName: '', role: 'worker', active: true, canManageBookings: false, canApproveOwnAbsence: false });
    const {data:access}=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['members', orgId, page, q], queryFn: () => list<Member>(orgId, '/members', { page, size: 12, q }), retry: false });
    const open = (m: Member | null) => { setError(tr("")); setEdit(m); setForm({ displayName: m?.display_name || '', role: m?.role || 'worker', active: m?.active ?? true, canManageBookings: m?.can_manage_bookings??false, canApproveOwnAbsence:m?.can_approve_own_absence??false }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/members/${edit.id}` : '/members', json(edit ? 'PUT' : 'POST', form)), onSuccess: () => { setEdit(undefined); qc.invalidateQueries({ queryKey: ['members', orgId] }); }, onError: e => setError(safeErrorMessage(e)) });
    return <><PageTitle eyebrow={tr("LIDÉ A PRACOVNÍ DOBA")} title={tr("V\u00E1\u0161 t\u00FDm")} description={tr("Zaměstnanci mohou pracovat na více pobočkách. Jejich pracovní doba se nesmí překrývat.")} action={access?.isOwner?<AddButton label={tr("P\u0159idat zam\u011Bstnance")} onClick={() => open(null)}/>:undefined}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Hledat zam\u011Bstnance\u2026")}/><span className="muted small">{data?.totalElements || 0}{tr("\u010Dlen\u016F t\u00FDmu")}</span></div>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? <Empty title={tr("\u017D\u00E1dn\u00ED zam\u011Bstnanci")} description={tr("P\u0159idejte prvn\u00ED \u010Dlena t\u00FDmu.")} action={access?.isOwner?<AddButton onClick={() => open(null)}/>:undefined}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Zam\u011Bstnanec")}</th><th>{tr("Role")}</th><th>{tr("Stav")}</th><th /></tr></thead><tbody>{data.items.map(m => <tr key={m.id}><td><div className="cell-name"><span className="cell-icon"><UserRound size={18}/></span><strong>{m.display_name}</strong></div></td><td>{roleLabel(m.role)}</td><td><Badge tone={m.active ? 'green' : 'neutral'}>{m.active ? tr('Aktivní') : tr('Neaktivní')}</Badge></td><td><div className="table-actions"><Button variant="ghost" onClick={() => setDetail(m)}><CalendarClock size={16}/>{tr("Pracovní doba a služby")}</Button>{access?.isOwner&&<button className="icon-button" title={tr("Upravit")} onClick={() => open(m)}><Pencil size={17}/></button>}</div></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Upravit zaměstnance') : tr('Nový zaměstnanec')} onClose={() => setEdit(undefined)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={error}/><Field label={tr("Jm\u00E9no zam\u011Bstnance")}><Input required value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}/></Field><Field label={tr("Role")}><Select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}><option value="worker">{tr("Zam\u011Bstnanec")}</option><option value="admin">{tr("Administr\u00E1tor")}</option><option value="owner">{tr("Majitel")}</option></Select></Field><Field label={tr("Stav")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Aktivn\u00ED")}</option><option value="false">{tr("Neaktivn\u00ED")}</option></Select></Field><div className="stack"><strong>{tr('Oprávnění pro každodenní provoz')}</strong><p className="muted small">{tr('Každý přihlášený pracovník vidí své rezervace. Oprávnění níže mu umožní pomáhat kolegům bez přístupu do veškerého nastavení.')}</p><label className="setup-check"><input type="checkbox" checked={form.canManageBookings} onChange={e=>setForm(x=>({...x,canManageBookings:e.target.checked}))}/>{tr('Může vytvářet rezervace a spravovat rezervace kolegů')}</label><label className="setup-check"><input type="checkbox" checked={form.canApproveOwnAbsence} onChange={e=>setForm(x=>({...x,canApproveOwnAbsence:e.target.checked}))}/>{tr('Může si sám schvalovat volno a změny pracovní doby')}</label><p className="muted small">{tr('Přihlašovací účet pracovníka se připojuje samostatně. Vlastník a administrátor mají oprávnění ke správě automaticky.')}</p></div><SubmitRow busy={save.isPending} onCancel={() => setEdit(undefined)}/></form></Modal>}
    {detail && <Modal wide title={`${tr('Váš tým')} · ${detail.display_name}`} onClose={() => setDetail(null)}><MemberDetail org={orgId} member={detail}/></Modal>}
  </>;
}
function MemberDetail({ org, member }: {
    org: number;
    member: Member;
}) {
    const [tab, setTab] = useState<'locations' | 'services' | 'hours' | 'exceptions' | 'photos'>('locations');
    const [location, setLocation] = useState<number>(0);
    const locs = useQuery({ queryKey: ['locations', org], queryFn: () => locations(org) });
    return <><div className="tabs"><button className={tab === 'locations' ? 'active' : ''} onClick={() => setTab('locations')}><MapPin size={16}/>{tr("Pobo\u010Dky")}</button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}><Layers3 size={16}/>{tr("Slu\u017Eby")}</button><button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}><CalendarClock size={16}/>{tr("Pracovní doba")}</button><button className={tab === 'exceptions' ? 'active' : ''} onClick={() => setTab('exceptions')}><CalendarOff size={16}/>{tr('Volno a výjimky')}</button><button className={tab === 'photos' ? 'active' : ''} onClick={() => setTab('photos')}><Camera size={16}/>{tr("Fotografie")}</button></div>{tab === 'locations' ? <MemberLocations org={org} member={member.id}/> : tab === 'services' ? <MemberServices org={org} member={member.id}/> : tab === 'hours' ? <div className="stack"><Field label={tr("Pobo\u010Dka pro rozvrh")}><Select value={location} onChange={e => setLocation(Number(e.target.value))}><option value="0">{tr("Vyberte pobo\u010Dku")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>{location > 0 ? <WeekEditor key={location} org={org} location={location} member={member.id}/> : <p className="muted">{tr("Vyberte pobo\u010Dku. Nejd\u0159\u00EDve ji p\u0159i\u0159a\u010Fte zam\u011Bstnanci v z\u00E1lo\u017Ece Pobo\u010Dky.")}</p>}</div> : tab === 'exceptions' ? <div className="stack"><Field label={tr('Pobočka pro výjimku')}><Select value={location} onChange={e=>setLocation(Number(e.target.value))}><option value={0}>Vyberte pobočku</option>{locs.data?.items.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>{location>0?<DateExceptions key={location} org={org} location={location} member={member.id}/>:<p className="muted">{tr('Zvolte pobočku, ve které chcete změnit směnu v konkrétní den.')}</p>}</div> : <MediaGallery org={org} kind="member" target={member.id}/>}</>;
}
function MemberLocations({ org, member }: {
    org: number;
    member: number;
}) {
    const qc = useQueryClient();
    const key = ['member-locations', org, member];
    const assigned = useQuery({ queryKey: key, queryFn: () => orgApi<number[]>(org, `/members/${member}/locations`) });
    const locs = useQuery({ queryKey: ['locations', org], queryFn: () => locations(org) });
    const [selected, setSelected] = useState<number[] | null>(null);
    const [message, setMessage] = useState('');
    const [failure, setFailure] = useState('');
    const ids = selected ?? assigned.data ?? [];
    const save = useMutation({ mutationFn: () => orgApi(org, `/members/${member}/locations`, json('PUT', { ids })), onSuccess: () => { setSelected(null); setFailure(''); setMessage(tr('Přiřazení poboček uloženo.')); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><p className="muted">{tr("Zam\u011Bstnanec m\u016F\u017Ee b\u00FDt p\u0159i\u0159azen v\u00EDce pobo\u010Dk\u00E1m. Historick\u00E9 rezervace mohou zabr\u00E1nit odebr\u00E1n\u00ED pobo\u010Dky.")}</p><Notice message={failure}/><Notice message={message} kind="success"/>{assigned.isLoading || locs.isLoading ? <Loading /> : assigned.error ? <ErrorState error={assigned.error}/> : locs.data?.items.map(l => <label key={l.id} className="checkbox-row"><input type="checkbox" checked={ids.includes(l.id)} onChange={e => setSelected(e.target.checked ? [...ids, l.id] : ids.filter(x => x !== l.id))}/><span>{l.name} <small className="muted">{l.address}</small></span></label>)}<div className="form-actions"><Button loading={save.isPending} onClick={() => save.mutate()}>{tr("Ulo\u017Eit pobo\u010Dky")}</Button></div></div>;
}
function MemberServices({ org, member }: {
    org: number;
    member: number;
}) {
    const qc = useQueryClient();
    const key = ['member-services', org, member];
    const assigned = useQuery({ queryKey: key, queryFn: () => orgApi<{
            service_id: number;
            active: boolean;
        }[]>(org, `/members/${member}/services`) });
    const svcs = useQuery({ queryKey: ['services', org], queryFn: () => services(org) });
    const [busy, setBusy] = useState<number | null>(null);
    const [failure, setFailure] = useState('');
    const [success, setSuccess] = useState('');
    async function toggle(id: number, active: boolean) { setBusy(id); setFailure(''); try {
        await orgApi(org, `/members/${member}/services/${id}`, json('PUT', { active }));
        setSuccess(tr("P\u0159i\u0159azen\u00ED slu\u017Eby bylo zm\u011Bn\u011Bno."));
        qc.invalidateQueries({ queryKey: key });
    }
    catch (e) {
        setFailure(safeErrorMessage(e));
    }
    finally {
        setBusy(null);
    } }
    return <div className="stack"><p className="muted">{tr("Zvolte slu\u017Eby, kter\u00E9 tento pracovn\u00EDk poskytuje.")}</p><Notice message={failure}/><Notice message={success} kind="success"/>{assigned.isLoading || svcs.isLoading ? <Loading /> : assigned.error ? <ErrorState error={assigned.error}/> : svcs.data?.items.map(s => <label className="checkbox-row" key={s.id}><input type="checkbox" disabled={busy !== null} checked={assigned.data?.some(a => a.service_id === s.id && a.active) || false} onChange={e => toggle(s.id, e.target.checked)}/><span>{s.name}</span></label>)}</div>;
}
