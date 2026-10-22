import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Camera, Layers3, MapPin, Pencil, UserRound, Mail, Trash2 } from 'lucide-react';
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
import { singleActiveLocationId } from '../lib/locationSelection';
import { useConfirm } from '../contexts/ConfirmContext';
export function AdminTeam() {
    const confirm = useConfirm();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [q, setQ] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Member | undefined>(undefined);
    const [editTab, setEditTab] = useState<'details' | 'photos'>('details');
    const [detail, setDetail] = useState<Member | null>(null);
    const [error, setError] = useState('');
    const [removeError, setRemoveError] = useState('');
    const [form, setForm] = useState({ displayName: '', role: 'worker', active: true, canManageBookings: false, canApproveOwnAbsence: false });
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', displayName: '', role: 'worker', canManageBookings: false, canApproveOwnAbsence: false, memberId: undefined as number | undefined });
    const {data:access}=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['members', orgId, page, q], queryFn: () => list<Member>(orgId, '/members', { page, size: 12, q }), retry: false });
    const { data: invitations } = useQuery({ queryKey: ['invitations', orgId], queryFn: () => orgApi<{id:number;email:string;display_name:string;role:string}[]>(orgId, '/invitations'), enabled: !!access?.isOwner, retry: false });
    const open = (m: Member) => { setError(tr("")); setEditTab('details'); setEdit(m); setForm({ displayName: m.display_name, role: m.role, active: m.active, canManageBookings: m.can_manage_bookings??false, canApproveOwnAbsence:m.can_approve_own_absence??false }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, `/members/${edit!.id}`, json('PUT', form)), onSuccess: () => { setEdit(undefined); qc.invalidateQueries({ queryKey: ['members', orgId] }); }, onError: e => setError(safeErrorMessage(e)) });
    const invite = useMutation({ mutationFn: () => orgApi(orgId, '/invitations', json('POST', inviteForm)), onSuccess: () => { setInviteOpen(false); setInviteForm({email:'',displayName:'',role:'worker',canManageBookings:false,canApproveOwnAbsence:false,memberId:undefined}); qc.invalidateQueries({queryKey:['invitations',orgId]}); }, onError: e => setError(safeErrorMessage(e)) });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/members/${id}`, { method: 'DELETE' }), onSuccess: (_data, id) => { setRemoveError(''); setDetail(current => current?.id === id ? null : current); setPage(0); qc.invalidateQueries({ queryKey: ['members', orgId] }); }, onError: e => setRemoveError(safeErrorMessage(e)) });
    return <>
      <PageTitle eyebrow={tr("TEAM AND WORKING HOURS")} title={tr("Your team")} description={tr("Employees may work across locations without overlapping working hours.")} action={access?.isOwner?<AddButton label={tr("Invite staff member")} onClick={() => {setInviteForm({email:'',displayName:'',role:'worker',canManageBookings:false,canApproveOwnAbsence:false,memberId:undefined});setError('');setInviteOpen(true);}}/>:undefined}/>
      <Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search staff...")}/>      <span className="muted small">{tr('Team member count')}: {data?.totalElements || 0}</span></div><Notice message={removeError}/>
        {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? q.trim() ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No employees yet")} description={tr("Invite the first team member by email.")} action={access?.isOwner?<AddButton label={tr("Invite staff member")} onClick={() => setInviteOpen(true)}/>:undefined}/> :
          <div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Employee")}</th><th>{tr("Email")}</th><th>{tr("Role")}</th><th>{tr("Status")}</th><th /></tr></thead><tbody>{data.items.map(m => <tr key={m.id}><td><div className="cell-name"><span className="cell-icon"><UserRound size={18}/></span><strong>{m.display_name}</strong></div></td><td>{m.email || '-'}</td><td>{roleLabel(m.role)}</td><td><Badge tone={m.active ? 'green' : 'neutral'}>{m.active ? tr('Active') : tr('Inactive')}</Badge></td><td><div className={`table-actions ${access?.isOwner ? 'team-table-actions' : ''}`}><Button variant="ghost" onClick={() => setDetail(m)}><CalendarClock size={16}/>{tr("Working hours and services")}</Button><span className="team-action-slot">{access?.isOwner&&!m.email&&<button className="icon-button" title={tr('Link account by email')} onClick={() => {setInviteForm({email:'',displayName:m.display_name,role:m.role,canManageBookings:m.can_manage_bookings??false,canApproveOwnAbsence:m.can_approve_own_absence??false,memberId:m.id});setError('');setInviteOpen(true);}}><Mail size={17}/></button>}</span><span className="team-action-slot">{access?.isOwner&&<button className="icon-button" title={tr("Edit")} onClick={() => open(m)}><Pencil size={17}/></button>}</span><span className="team-action-slot">{access?.isOwner&&m.role==='worker'&&<button className="icon-button" title={tr("Remove from team")} aria-label={tr("Remove from team")} disabled={remove.isPending} onClick={async () => { if (await confirm(tr("Remove this worker from the team? Their account and historical reservations will be kept."))) remove.mutate(m.id); }}><Trash2 size={17}/></button>}</span></div></td></tr>)}</tbody></table></div>}
        <Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/>
      </Card>
      {access?.isOwner && !!invitations?.length && <Card><h2>{tr('Pending invitations')}</h2><div className="stack">{invitations.map(i=><div key={i.id} className="table-toolbar"><span><Mail size={16}/> {i.display_name} - {i.email}</span><Badge tone="orange">{tr('Invitation sent')}</Badge></div>)}</div></Card>}
      {inviteOpen && <Modal title={tr(inviteForm.memberId ? 'Připojit účet e-mailem' : 'Pozvat zaměstnance')} onClose={() => setInviteOpen(false)}><form className="stack" onSubmit={(e:FormEvent)=>{e.preventDefault();invite.mutate();}}><Notice message={error}/><p className="muted">{tr('The invitation is valid for 24 hours. If this email already has an account, that account will be linked.')}</p><Field label={tr('Employee name')}><Input required maxLength={200} value={inviteForm.displayName} disabled={!!inviteForm.memberId} onChange={e=>setInviteForm(p=>({...p,displayName:e.target.value}))}/></Field><Field label={tr('Email')}><Input type="email" required value={inviteForm.email} onChange={e=>setInviteForm(p=>({...p,email:e.target.value}))}/></Field><Field label={tr('Role')}><Select disabled={!!inviteForm.memberId} value={inviteForm.role} onChange={e=>setInviteForm(p=>({...p,role:e.target.value}))}><option value="worker">{tr('Employee')}</option><option value="admin">{tr('Administrator')}</option><option value="owner">{tr('Owner')}</option></Select></Field>{!inviteForm.memberId&&<><label className="setup-check"><input type="checkbox" checked={inviteForm.canManageBookings} onChange={e=>setInviteForm(p=>({...p,canManageBookings:e.target.checked}))}/>{tr('Can create and manage team bookings')}</label><label className="setup-check"><input type="checkbox" checked={inviteForm.canApproveOwnAbsence} onChange={e=>setInviteForm(p=>({...p,canApproveOwnAbsence:e.target.checked}))}/>{tr('Can approve own time off and working hours changes')}</label></>}<div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setInviteOpen(false)}>{tr('Cancel')}</Button><Button type="submit" loading={invite.isPending}>{tr('Send invitation')}</Button></div></form></Modal>}
    {edit !== undefined && <Modal title={tr('Edit employee')} onClose={() => setEdit(undefined)} wide><div className="tabs"><button className={editTab === 'details' ? 'active' : ''} onClick={() => setEditTab('details')}>{tr('Details')}</button><button className={editTab === 'photos' ? 'active' : ''} onClick={() => setEditTab('photos')}><Camera size={16}/>{tr('Photos')}</button></div>{editTab === 'details' ? <form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={error}/><Field label={tr("Employee name")}><Input required value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}/></Field><Field label={tr("Role")}><Select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}><option value="worker">{tr("Employee")}</option><option value="admin">{tr("Administrator")}</option><option value="owner">{tr("Owner")}</option></Select></Field><Field label={tr("Status")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}><option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option></Select></Field><div className="stack"><strong>{tr('Day-to-day permissions')}</strong><p className="muted small">{tr('Every signed-in employee sees their bookings. These permissions allow helping colleagues without full admin access.')}</p><label className="setup-check"><input type="checkbox" checked={form.canManageBookings} onChange={e=>setForm(x=>({...x,canManageBookings:e.target.checked}))}/>{tr('Can create and manage team bookings')}</label><label className="setup-check"><input type="checkbox" checked={form.canApproveOwnAbsence} onChange={e=>setForm(x=>({...x,canApproveOwnAbsence:e.target.checked}))}/>{tr('Can approve own time off and working hours changes')}</label><p className="muted small">{tr('Staff login accounts are linked separately. Owners and admins have management access automatically.')}</p></div><SubmitRow busy={save.isPending} onCancel={() => setEdit(undefined)}/></form> : <MediaGallery org={orgId} kind="member" target={edit.id}/>}</Modal>}
    {detail && <Modal wide title={`${tr('Your team')} · ${detail.display_name}`} onClose={() => setDetail(null)}><MemberDetail org={orgId} member={detail}/></Modal>}
  </>;
}
function MemberDetail({ org, member }: {
    org: number;
    member: Member;
}) {
    const [tab, setTab] = useState<'locations' | 'services' | 'hours' | 'exceptions'>('locations');
    const [location, setLocation] = useState<number>(0);
    const locs = useQuery({ queryKey: ['locations', org], queryFn: () => locations(org) });
    const activeLocations = locs.data?.items.filter(item => item.active) || [];
    const defaultLocation = singleActiveLocationId(activeLocations);
    useEffect(() => {
        if (!location && defaultLocation) setLocation(defaultLocation);
    }, [defaultLocation, location]);
    return <><div className="tabs"><button className={tab === 'locations' ? 'active' : ''} onClick={() => setTab('locations')}><MapPin size={16}/>{tr("Locations")}</button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}><Layers3 size={16}/>{tr("Services")}</button><button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}><CalendarClock size={16}/>{tr("Working hours")}</button><button className={tab === 'exceptions' ? 'active' : ''} onClick={() => setTab('exceptions')}><CalendarOff size={16}/>{tr('Time off and exceptions')}</button></div>{tab === 'locations' ? <MemberLocations org={org} member={member.id}/> : tab === 'services' ? <MemberServices org={org} member={member.id}/> : tab === 'hours' ? <div className="stack"><Field label={tr("Schedule location")}><Select value={location} onChange={e => setLocation(Number(e.target.value))}><option value="0">{tr("Choose location")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>{location > 0 ? <WeekEditor key={location} org={org} location={location} member={member.id}/> : <p className="muted">{tr("Choose a location. First assign it to the employee on the Locations tab.")}</p>}</div> : <div className="stack"><Field label={tr('Location for exception')}><Select value={location} onChange={e=>setLocation(Number(e.target.value))}><option value={0}>Vyberte pobočku</option>{locs.data?.items.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>{location>0?<DateExceptions key={location} org={org} location={location} member={member.id}/>:<p className="muted">{tr('Select a location to change a shift on a specific date.')}</p>}</div>}</>;
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
    const save = useMutation({ mutationFn: () => orgApi(org, `/members/${member}/locations`, json('PUT', { ids })), onSuccess: () => { setSelected(null); setFailure(''); setMessage(tr('Location assignments saved.')); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><p className="muted">{tr("An employee can be assigned to multiple locations. Past bookings may prevent removing an assignment.")}</p><Notice message={failure}/><Notice message={message} kind="success"/>{assigned.isLoading || locs.isLoading ? <Loading /> : assigned.error ? <ErrorState error={assigned.error}/> : locs.data?.items.map(l => <label key={l.id} className="checkbox-row"><input type="checkbox" checked={ids.includes(l.id)} onChange={e => setSelected(e.target.checked ? [...ids, l.id] : ids.filter(x => x !== l.id))}/><span>{l.name} <small className="muted">{l.address}</small></span></label>)}<div className="form-actions"><Button loading={save.isPending} onClick={() => save.mutate()}>{tr("Save locations")}</Button></div></div>;
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
    const [failure, setFailure] = useState('');
    const [success, setSuccess] = useState('');
    const current = assigned.data?.filter(a => a.active).map(a => a.service_id) ?? [];
    const ids = selected ?? current;
    const changed = ids.length !== current.length || ids.some(id => !current.includes(id));
    const save = useMutation({ mutationFn: (serviceIds: number[]) => orgApi(org, `/members/${member}/services`, json('PUT', { ids: serviceIds })), onSuccess: () => { setSelected(null); setFailure(''); setSuccess(tr("Service assignments saved.")); qc.invalidateQueries({ queryKey: key }); }, onError: e => setFailure(safeErrorMessage(e)) });
    return <div className="stack"><p className="muted">{tr("Choose the services this employee provides.")}</p><Notice message={failure}/><Notice message={success} kind="success"/>{assigned.isLoading || svcs.isLoading ? <Loading /> : assigned.error ? <ErrorState error={assigned.error}/> : svcs.data?.items.map(s => <label className="checkbox-row" key={s.id}><input type="checkbox" disabled={save.isPending} checked={ids.includes(s.id)} onChange={e => { setFailure(''); setSuccess(''); setSelected(e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id)); }}/><span>{s.name}</span></label>)}<div className="form-actions"><Button loading={save.isPending} disabled={!changed} onClick={() => save.mutate(ids)}>{tr("Save services")}</Button></div></div>;
}
