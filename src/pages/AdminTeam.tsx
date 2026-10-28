import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { st } from '../lib/setupTranslations';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, Layers3, MapPin, Pencil, UserRound, Mail, Trash2 } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { json, list, locations, orgApi, services } from '../lib/api';
import type { Member } from '../lib/types';
import { roleLabel } from '../lib/utils';
import { AddButton, Badge, Button, Card, Empty, ErrorState, Field, Input, Loading, Modal, PageTitle, Pager, SearchBox, Select, SortableHeader, SubmitRow } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { WeekEditor } from '../components/WeekEditor';
import { DateExceptions } from '../components/DateExceptions';
import { CalendarOff } from 'lucide-react';
import { myAccess } from '../lib/access';
import { singleActiveLocationId } from '../lib/locationSelection';
import { useConfirm } from '../contexts/ConfirmContext';
import { MemberDetailSaveProvider, useMemberDetailSave, type MemberDetailSave } from '../components/MemberDetailSaveContext';
import { useFormDraft } from '../lib/useFormDraft';
import { useToast } from '../contexts/ToastContext';
export function AdminTeam() {
    const confirm = useConfirm();
    const notify=useToast();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [edit, setEdit] = useState<Member | undefined>(undefined);
    const [editTab, setEditTab] = useState<'details' | 'photos'>('details');
    const [detail, setDetail] = useState<Member | null>(null);
    const [form, setForm, dirty, resetForm] = useFormDraft({ displayName: '', role: 'worker', active: true, providesServices: true, canManageBookings: false, canManageOwnBookings: false, canApproveOwnAbsence: false });
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteForm, setInviteForm, inviteDirty, resetInviteForm] = useFormDraft({ email: '', displayName: '', role: 'worker', canManageBookings: false, canManageOwnBookings: false, canApproveOwnAbsence: false, memberId: undefined as number | undefined });
    const {data:access}=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['members', orgId, page, q, sortField, sortDirection], queryFn: () => list<Member>(orgId, '/members', { page, size: 12, q, sort: `${sortField},${sortDirection}` }), retry: false });
    const changeSort = (field: string) => {
        setSortDirection(current => field === sortField ? current === 'asc' ? 'desc' : 'asc' : 'asc');
        setSortField(field);
        setPage(0);
    };
    const { data: invitations } = useQuery({ queryKey: ['invitations', orgId], queryFn: () => orgApi<{id:number;email:string;display_name:string;role:string}[]>(orgId, '/invitations'), enabled: !!access?.isOwner, retry: false });
    const open = (m: Member) => { setEditTab('details'); setEdit(m); resetForm({ displayName: m.display_name, role: m.role, active: m.active, providesServices: m.provides_services??true, canManageBookings: m.can_manage_bookings??false, canManageOwnBookings:m.can_manage_own_bookings??false, canApproveOwnAbsence:m.can_approve_own_absence??false }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, `/members/${edit!.id}`, json('PUT', form)), onSuccess: () => { notify(tr('Employee updated successfully.')); setEdit(undefined); qc.invalidateQueries({ queryKey: ['members', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const invite = useMutation({ mutationFn: () => orgApi(orgId, '/invitations', json('POST', inviteForm)), onSuccess: () => { notify(tr('Invitation sent successfully.')); setInviteOpen(false); resetInviteForm({email:'',displayName:'',role:'worker',canManageBookings:false,canManageOwnBookings:false,canApproveOwnAbsence:false,memberId:undefined}); qc.invalidateQueries({queryKey:['invitations',orgId]}); }, onError: e => notify(safeErrorMessage(e),'error') });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/members/${id}`, { method: 'DELETE' }), onSuccess: (_data, id) => { notify(tr('Employee removed successfully.')); setDetail(current => current?.id === id ? null : current); setPage(0); qc.invalidateQueries({ queryKey: ['members', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    return <>
      <PageTitle eyebrow={tr("TEAM AND WORKING HOURS")} title={tr("Your team")} description={tr("Employees may work across locations without overlapping working hours.")} action={access?.isOwner?<AddButton label={tr("Invite staff member")} onClick={() => {resetInviteForm({email:'',displayName:'',role:'worker',canManageBookings:false,canManageOwnBookings:false,canApproveOwnAbsence:false,memberId:undefined});setInviteOpen(true);}}/>:undefined}/>
      <Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search staff...")}/></div>
        {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? q.trim() ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No employees yet")} description={tr("Invite the first team member by email.")} action={access?.isOwner?<AddButton label={tr("Invite staff member")} onClick={() => {resetInviteForm({email:'',displayName:'',role:'worker',canManageBookings:false,canManageOwnBookings:false,canApproveOwnAbsence:false,memberId:undefined});setInviteOpen(true);}}/>:undefined}/> :
          <div className="table-scroll"><table className="data-table"><thead><tr><SortableHeader label={tr("Employee")} active={sortField === 'name'} direction={sortDirection} onClick={() => changeSort('name')}/><SortableHeader label={tr("Email")} active={sortField === 'email'} direction={sortDirection} onClick={() => changeSort('email')}/><SortableHeader label={tr("Role")} active={sortField === 'role'} direction={sortDirection} onClick={() => changeSort('role')}/><SortableHeader label={tr("Status")} active={sortField === 'active'} direction={sortDirection} onClick={() => changeSort('active')}/><th /></tr></thead><tbody>{data.items.map(m => <tr key={m.id}><td><div className="cell-name"><span className="cell-icon"><UserRound size={18}/></span><strong>{m.display_name}</strong></div></td><td>{m.email || '-'}</td><td>{roleLabel(m.role)}</td><td><Badge tone={m.active ? 'green' : 'neutral'}>{m.active ? tr('Active') : tr('Inactive')}</Badge></td><td><div className={`table-actions ${access?.isOwner ? 'team-table-actions' : ''}`}><Button variant="ghost" onClick={() => setDetail(m)}><CalendarClock size={16}/>{tr("Working hours and services")}</Button><span className="team-action-slot">{access?.isOwner&&!m.email&&<button className="icon-button" title={tr('Link account by email')} onClick={() => {resetInviteForm({email:'',displayName:m.display_name,role:m.role,canManageBookings:m.can_manage_bookings??false,canManageOwnBookings:m.can_manage_own_bookings??false,canApproveOwnAbsence:m.can_approve_own_absence??false,memberId:m.id});setInviteOpen(true);}}><Mail size={17}/></button>}</span><span className="team-action-slot">{access?.isOwner&&<button className="icon-button" title={tr("Edit")} onClick={() => open(m)}><Pencil size={17}/></button>}</span><span className="team-action-slot">{access?.isOwner&&m.role==='worker'&&<button className="icon-button" title={tr("Remove from team")} aria-label={tr("Remove from team")} disabled={remove.isPending} onClick={async () => { if (await confirm(tr("Remove this worker from the team? Their account and historical reservations will be kept."))) remove.mutate(m.id); }}><Trash2 size={17}/></button>}</span></div></td></tr>)}</tbody></table></div>}
        <Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/>
      </Card>
      {access?.isOwner && !!invitations?.length && <Card><h2>{tr('Pending invitations')}</h2><div className="stack">{invitations.map(i=><div key={i.id} className="table-toolbar"><span><Mail size={16}/> {i.display_name} - {i.email}</span><Badge tone="orange">{tr('Invitation sent')}</Badge></div>)}</div></Card>}
      {inviteOpen && <Modal title={tr(inviteForm.memberId ? 'Připojit účet e-mailem' : 'Pozvat zaměstnance')} onClose={() => setInviteOpen(false)}>
        <form className="stack" onSubmit={(e:FormEvent)=>{e.preventDefault();if(inviteDirty&&!invite.isPending)invite.mutate();}}>
          <p className="muted">{tr('The invitation is valid for 24 hours. If this email already has an account, that account will be linked.')}</p>
          <Field label={tr('Employee name')}><Input required maxLength={200} value={inviteForm.displayName} disabled={!!inviteForm.memberId} onChange={e=>setInviteForm(p=>({...p,displayName:e.target.value}))}/></Field>
          <Field label={tr('Email')}><Input type="email" required value={inviteForm.email} onChange={e=>setInviteForm(p=>({...p,email:e.target.value}))}/></Field>
          <Field label={tr('Role')}><Select disabled={!!inviteForm.memberId} value={inviteForm.role} onChange={e=>setInviteForm(p=>({...p,role:e.target.value}))}><option value="worker">{tr('Employee')}</option><option value="admin">{tr('Administrator')}</option><option value="owner">{tr('Owner')}</option></Select></Field>
          {!inviteForm.memberId&&<>
            <label className="setup-check"><input type="checkbox" checked={inviteForm.canManageBookings} onChange={e=>setInviteForm(p=>({...p,canManageBookings:e.target.checked,canManageOwnBookings:e.target.checked?false:p.canManageOwnBookings}))}/>{tr('Can create and manage team bookings')}</label>
            <label className="setup-check"><input type="checkbox" checked={inviteForm.canManageOwnBookings} onChange={e=>setInviteForm(p=>({...p,canManageOwnBookings:e.target.checked,canManageBookings:e.target.checked?false:p.canManageBookings}))}/>{tr('Can manage own bookings')}</label>
            <label className="setup-check"><input type="checkbox" checked={inviteForm.canApproveOwnAbsence} onChange={e=>setInviteForm(p=>({...p,canApproveOwnAbsence:e.target.checked}))}/>{tr('Can approve own time off and working hours changes')}</label>
          </>}
          <div className="form-actions"><Button type="submit" loading={invite.isPending} disabled={!inviteDirty}>{tr('Send invitation')}</Button></div>
        </form>
      </Modal>}
    {edit !== undefined && <Modal title={tr('Edit employee')} onClose={() => setEdit(undefined)} wide>
      <div className="tabs"><button className={editTab === 'details' ? 'active' : ''} onClick={() => setEditTab('details')}>{tr('Details')}</button><button className={editTab === 'photos' ? 'active' : ''} onClick={() => setEditTab('photos')}><Camera size={16}/>{tr('Photos')}</button></div>
      <div style={{display:editTab==='details'?undefined:'none'}}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}>
        <Field label={tr("Employee name")}><Input required value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}/></Field>
        <Field label={tr("Role")}><Select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}><option value="worker">{tr("Employee")}</option><option value="admin">{tr("Administrator")}</option><option value="owner">{tr("Owner")}</option></Select></Field>
        <Field label={tr("Status")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option></Select></Field>
        <div className="stack"><strong>{tr('Day-to-day permissions')}</strong><p className="muted small">{tr('Every signed-in employee sees their bookings. Booking permissions are either for colleagues’ bookings or only their own.')}</p>
          <label className="setup-check"><input type="checkbox" checked={form.providesServices} onChange={e=>setForm(x=>({...x,providesServices:e.target.checked}))}/>{st('Provides bookable services')}</label>
          <p className="muted small">{st('Turn this off for receptionists. Location, working hours, and service assignments are managed separately.')}</p>
          <label className="setup-check"><input type="checkbox" checked={form.canManageBookings} onChange={e=>setForm(x=>({...x,canManageBookings:e.target.checked,canManageOwnBookings:e.target.checked?false:x.canManageOwnBookings}))}/>{tr('Can create and manage team bookings')}</label>
          <label className="setup-check"><input type="checkbox" checked={form.canManageOwnBookings} onChange={e=>setForm(x=>({...x,canManageOwnBookings:e.target.checked,canManageBookings:e.target.checked?false:x.canManageBookings}))}/>{tr('Can manage own bookings')}</label>
          <label className="setup-check"><input type="checkbox" checked={form.canApproveOwnAbsence} onChange={e=>setForm(x=>({...x,canApproveOwnAbsence:e.target.checked}))}/>{tr('Can approve own time off and working hours changes')}</label>
          <p className="muted small">{tr('Staff login accounts are linked separately. Owners and admins have management access automatically.')}</p>
        </div><SubmitRow busy={save.isPending} dirty={dirty}/>
      </form></div>
      <div style={{display:editTab==='photos'?undefined:'none'}}><MediaGallery org={orgId} kind="member" target={edit.id} onSaved={() => setEdit(undefined)}/></div>
    </Modal>}
    {detail && <Modal wide title={`${tr('Your team')} · ${detail.display_name}`} onClose={() => setDetail(null)}><MemberDetail org={orgId} member={detail} onClose={() => setDetail(null)}/></Modal>}
  </>;
}
function MemberDetail({ org, member, onClose }: {
    org: number;
    member: Member;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<'locations' | 'services' | 'hours' | 'exceptions'>('locations');
    const [location, setLocation] = useState<number>(0);
    const [visitedLocations, setVisitedLocations] = useState<number[]>([]);
    const [pendingSaves, setPendingSaves] = useState<Record<string, { order: number; save: MemberDetailSave }>>({});
    const [saving, setSaving] = useState(false);
    const notify=useToast();
    const locs = useQuery({ queryKey: ['locations', org], queryFn: () => locations(org) });
    const activeLocations = locs.data?.items.filter(item => item.active) || [];
    const defaultLocation = singleActiveLocationId(activeLocations);
    const editorLocations = [...new Set([...visitedLocations, location].filter(id => id > 0))];
    const chooseLocation = (id: number) => {
        setLocation(id);
        if (id > 0) setVisitedLocations(current => current.includes(id) ? current : [...current, id]);
    };
    const registerSave = useCallback((key: string, order: number, save: MemberDetailSave | null) => {
        setPendingSaves(current => {
            if (!save) {
                if (!current[key]) return current;
                const next = { ...current };
                delete next[key];
                return next;
            }
            return { ...current, [key]: { order, save } };
        });
    }, []);
    useEffect(() => {
        if (!location && defaultLocation) setLocation(defaultLocation);
    }, [defaultLocation, location]);
    async function saveAll() {
        setSaving(true);
        try {
            const tasks = Object.values(pendingSaves).sort((a, b) => a.order - b.order);
            for (const task of tasks) await task.save();
            notify(tr('Changes saved successfully.'));
            onClose();
        } catch (e) {
            notify(safeErrorMessage(e),'error');
        } finally {
            setSaving(false);
        }
    }
    return <MemberDetailSaveProvider value={registerSave}>
      <div className="tabs"><button className={tab === 'locations' ? 'active' : ''} onClick={() => setTab('locations')}><MapPin size={16}/>{tr("Locations")}</button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}><Layers3 size={16}/>{tr("Services")}</button><button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}><CalendarClock size={16}/>{tr("Working hours")}</button><button className={tab === 'exceptions' ? 'active' : ''} onClick={() => setTab('exceptions')}><CalendarOff size={16}/>{tr('Time off and exceptions')}</button></div>
      <fieldset disabled={saving} style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}>
        <div style={{ display: tab === 'locations' ? undefined : 'none' }}><MemberLocations org={org} member={member.id}/></div>
        <div style={{ display: tab === 'services' ? undefined : 'none' }}><MemberServices org={org} member={member.id}/></div>
        <div className="stack" style={{ display: tab === 'hours' ? undefined : 'none' }}><Field label={tr("Schedule location")}><Select value={location} onChange={e => chooseLocation(Number(e.target.value))}><option value="0">{tr("Choose location")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>{editorLocations.map(id=><div key={id} style={{display:location===id?undefined:'none'}}><WeekEditor org={org} location={id} member={member.id}/></div>)}{location === 0 && <p className="muted">{tr("Choose a location. First assign it to the employee on the Locations tab.")}</p>}</div>
        <div className="stack" style={{ display: tab === 'exceptions' ? undefined : 'none' }}><Field label={tr('Location for exception')}><Select value={location} onChange={e=>chooseLocation(Number(e.target.value))}><option value="0">{tr('Choose location')}</option>{locs.data?.items.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>{editorLocations.map(id=><div key={id} style={{display:location===id?undefined:'none'}}><DateExceptions org={org} location={id} member={member.id}/></div>)}{location===0&&<p className="muted">{tr('Select a location to change a shift on a specific date.')}</p>}</div>
      </fieldset>
      <div className="form-actions"><Button loading={saving} disabled={!Object.keys(pendingSaves).length} onClick={saveAll}>{tr('Save all changes')}</Button></div>
    </MemberDetailSaveProvider>;
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
    const ids = selected ?? assigned.data ?? [];
    const dirty = selected !== null && (ids.length !== (assigned.data ?? []).length || ids.some(id => !(assigned.data ?? []).includes(id)));
    const save = useCallback(async () => {
        await orgApi(org, `/members/${member}/locations`, json('PUT', { ids }));
        setSelected(null);
        await qc.invalidateQueries({ queryKey: key });
    }, [ids, key, member, org, qc]);
    useMemberDetailSave(`locations-${member}`, 0, dirty, save);
    return <div className="stack"><p className="muted">{tr("An employee can be assigned to multiple locations. Past bookings may prevent removing an assignment.")}</p>{assigned.isLoading || locs.isLoading ? <Loading /> : assigned.error ? <ErrorState error={assigned.error}/> : locs.data?.items.map(l => <label key={l.id} className="checkbox-row"><input type="checkbox" checked={ids.includes(l.id)} onChange={e => setSelected(e.target.checked ? [...ids, l.id] : ids.filter(x => x !== l.id))}/><span>{l.name} <small className="muted">{l.address}</small></span></label>)}</div>;
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
    const [selected, setSelected] = useState<number[] | null>(null);
    const current = assigned.data?.filter(a => a.active).map(a => a.service_id) ?? [];
    const ids = selected ?? current;
    const changed = ids.length !== current.length || ids.some(id => !current.includes(id));
    const dirty = selected !== null && changed;
    const save = useCallback(async () => {
        await orgApi(org, `/members/${member}/services`, json('PUT', { ids }));
        setSelected(null);
        await qc.invalidateQueries({ queryKey: key });
    }, [ids, key, member, org, qc]);
    useMemberDetailSave(`services-${member}`, 1, dirty, save);
    return <div className="stack"><p className="muted">{tr("Choose the services this employee provides.")}</p>{assigned.isLoading || svcs.isLoading ? <Loading /> : assigned.error ? <ErrorState error={assigned.error}/> : svcs.data?.items.map(s => <label className="checkbox-row" key={s.id}><input type="checkbox" checked={ids.includes(s.id)} onChange={e => setSelected(e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id))}/><span>{s.name}</span></label>)}</div>;
}
