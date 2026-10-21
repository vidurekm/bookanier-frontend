import { localeTag } from '../lib/preferences';
import { tr } from '../lib/translations';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Eye, ListFilter, RefreshCw } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { list, locations, orgApi } from '../lib/api';
import type { Reservation } from '../lib/types';
import { addDays, formatDate, formatDateTime, money, statusLabel, today } from '../lib/utils';
import { Badge, Card, Empty, ErrorState, Loading, Modal, PageTitle, Pager, SearchBox, Select, Button } from '../components/UI';
import { CreateTeamBooking, BookingStatusActions, MoveTeamBooking } from '../components/BookingManagement';
import { myAccess } from '../lib/access';
import { useQueryClient } from '@tanstack/react-query';
interface CalendarEvent {
    reservation_id: number;
    customer_name: string;
    status: string;
    total_amount: number;
    currency: string;
    item_id: number;
    starts_at: string;
    ends_at: string;
    member_id?: number;
    location_id: number;
    location_name: string;
    service_name: string;
    member_name?: string;
}
export function AdminReservations() {
    const { orgId, org } = useAdmin();
    const access = useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
    const [creating,setCreating] = useState(false);
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [page, setPage] = useState(0);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [location, setLocation] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [start, setStart] = useState(today());
    const locs = useQuery({ queryKey: ['locations', orgId], queryFn: () => locations(orgId), retry: false });
    const bookings = useQuery({ queryKey: ['reservations', orgId, page, q, status, location], queryFn: () => list<Reservation>(orgId, '/reservations', { page, size: 12, q, status, locationId: location || undefined }), enabled: view === 'list' });
    const end = addDays(start, 7);
    const calendar = useQuery({ queryKey: ['calendar', orgId, start, location], queryFn: () => orgApi<CalendarEvent[]>(orgId, `/calendar?from=${start}&to=${end}${location ? `&locationId=${location}` : ''}`), enabled: view === 'calendar' });
    return <><PageTitle eyebrow={tr("REZERVA\u010CN\u00CD CENTRUM")} title={tr("Rezervace")} description={tr("P\u0159ehled term\u00EDn\u016F, z\u00E1kazn\u00EDk\u016F a stavu v\u0161ech rezervac\u00ED.")} action={<div style={{display:'flex',alignItems:'center',gap:12}}>{access.data?.canManageBookings&&<Button onClick={()=>setCreating(true)}>{tr('Nová rezervace')}</Button>}<div className="view-switch"><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays size={16}/>{tr("Kalend\u00E1\u0159")}</button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><ListFilter size={16}/>{tr("Seznam")}</button></div></div>}/><Card><div className="table-toolbar"><div className="filters-left">{view === 'list' && <SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Jm\u00E9no nebo e-mail\u2026")}/>}{(locs.data?.items.length||0)>1 && <Select aria-label={tr("Filtrovat pobo\u010Dku")} value={location} onChange={e => { setLocation(Number(e.target.value)); setPage(0); }}><option value={0}>{tr("V\u0161echny pobo\u010Dky")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>}{view === 'list' && <Select aria-label={tr("Stav rezervace")} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">{tr("V\u0161echny stavy")}</option><option value="confirmed">{tr("Potvrzen\u00E9")}</option><option value="pending">{tr("\u010Cekaj\u00EDc\u00ED")}</option><option value="completed">{tr("Dokon\u010Den\u00E9")}</option><option value="cancelled">{tr("Zru\u0161en\u00E9")}</option><option value="no_show">{tr("Nedostavil se")}</option></Select>}</div>{view === 'calendar' && <div className="calendar-nav"><button onClick={() => setStart(addDays(start, -7))}><ChevronLeft size={18}/></button><strong>{formatDate(start)} – {formatDate(addDays(start, 6))}</strong><button onClick={() => setStart(addDays(start, 7))}><ChevronRight size={18}/></button><button title={tr("Dnes")} onClick={() => setStart(today())}><RefreshCw size={16}/></button></div>}</div>
    {view === 'list' ? bookings.isLoading ? <Loading /> : bookings.error ? <ErrorState error={bookings.error}/> : !bookings.data?.items.length ? <Empty title={tr("\u017D\u00E1dn\u00E9 rezervace")} description={tr("Zm\u011B\u0148te filtry nebo po\u010Dkejte na nov\u00E9 rezervace.")}/> : <><div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Rezervace")}</th><th>{tr("Z\u00E1kazn\u00EDk")}</th><th>{tr("Vytvo\u0159eno")}</th><th>{tr("Stav")}</th><th>{tr("\u010C\u00E1stka")}</th><th /></tr></thead><tbody>{bookings.data.items.map(b => <tr key={b.id}><td><strong>#{b.id}</strong></td><td>{b.customer_name}</td><td>{formatDateTime(b.created_at)}</td><td><Badge tone={b.status === 'confirmed' ? 'green' : b.status === 'cancelled' ? 'red' : 'orange'}>{statusLabel(b.status)}</Badge></td><td><strong>{money(b.total_amount, b.currency)}</strong></td><td><button className="icon-button" title={tr("Detail")} onClick={() => setSelected(b.id)}><Eye size={17}/></button></td></tr>)}</tbody></table></div><Pager page={page} totalPages={bookings.data.totalPages} onChange={setPage}/></> : calendar.isLoading ? <Loading /> : calendar.error ? <ErrorState error={calendar.error}/> : <div className="week-calendar">{Array.from({ length: 7 }, (_, i) => { const date = addDays(start, i); const items = calendar.data?.filter(e => { const d = new Date(e.starts_at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === date; }) || []; return <div key={date} className="calendar-day"><div className="calendar-day-heading"><span>{new Intl.DateTimeFormat(localeTag(), { weekday: 'short' }).format(new Date(date + 'T12:00:00'))}</span><strong>{date.slice(-2)}.</strong></div>{items.length ? items.map(e => <button className="calendar-event" key={e.item_id} onClick={() => setSelected(e.reservation_id)}><span>{formatDateTime(e.starts_at).split(' ').slice(-1)[0]}</span><strong>{e.customer_name}</strong><small>{e.service_name}</small></button>) : <div className="calendar-empty">—</div>}</div>; })}</div>}
  </Card>{selected !== null && <Modal title={`${tr('Rezervace #')}${selected}`} onClose={() => setSelected(null)}><ReservationDetail org={orgId} id={selected} canManage={access.data?.canManageBookings===true}/></Modal>}{creating&&org?.public_id&&<Modal wide title={tr("Nová rezervace")} onClose={()=>setCreating(false)}><CreateTeamBooking org={orgId} publicId={org.public_id} onComplete={()=>setCreating(false)}/></Modal>}</>;
}
function ReservationDetail({ org, id, canManage }: {
    org: number;
    id: number;
    canManage: boolean;
}) { const qc=useQueryClient(); const { data, isLoading, error } = useQuery({ queryKey: ['reservation', org, id], queryFn: () => orgApi<{
        reservation: Record<string, unknown>;
        items: Record<string, unknown>[];
    }>(org, `/reservations/${id}`) }); if (isLoading)
    return <Loading />; if (error)
    return <ErrorState error={error}/>; const r = data?.reservation; return <div className="stack"><div className="detail-summary"><div><small>{tr("Jm\u00E9no z\u00E1kazn\u00EDka")}</small><strong>{String(r?.customer_name || '—')}</strong></div><div><small>{tr("Stav")}</small><Badge tone={r?.status === 'confirmed' ? 'green' : 'orange'}>{statusLabel(String(r?.status || ''))}</Badge></div><div><small>{tr("E-mail")}</small><strong>{String(r?.customer_email || '—')}</strong></div><div><small>{tr("Telefon")}</small><strong>{String(r?.customer_phone || '—')}</strong></div><div><small>{tr("\u010C\u00E1stka")}</small><strong>{money(Number(r?.total_amount || 0), String(r?.currency || 'CZK'))}</strong></div></div><h3>{tr("Polo\u017Eky rezervace")}</h3>{data?.items.map((item, i) => <div key={i} className="detail-item"><strong>{tr("Slu\u017Eba #")}{String(item.service_id)}</strong><span>{formatDateTime(String(item.starts_at))} – {formatDateTime(String(item.ends_at))}</span></div>)}{canManage&&data?.items.length===1&&data.items[0]?.member_id!=null&&r?.status==='confirmed'&&<MoveTeamBooking org={org} id={id} item={data.items[0]} onChanged={()=>{void qc.invalidateQueries({queryKey:['reservation',org,id]});void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});}}/>}{canManage&&<BookingStatusActions org={org} id={id} status={String(r?.status||'')} onChanged={()=>{void qc.invalidateQueries({queryKey:['reservation',org,id]});void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});}}/>}</div>; }
