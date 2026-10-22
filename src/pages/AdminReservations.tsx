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
import { singleActiveLocationId } from '../lib/locationSelection';
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
    const [location, setLocation] = useState<number | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [start, setStart] = useState(today());
    const locs = useQuery({ queryKey: ['locations', orgId], queryFn: () => locations(orgId), retry: false });
    const activeLocations = locs.data?.items.filter(item => item.active) || [];
    const selectedLocation = location ?? singleActiveLocationId(activeLocations) ?? 0;
    const bookings = useQuery({ queryKey: ['reservations', orgId, page, q, status, selectedLocation], queryFn: () => list<Reservation>(orgId, '/reservations', { page, size: 12, q, status, locationId: selectedLocation || undefined }), enabled: view === 'list' });
    const end = addDays(start, 7);
    const calendar = useQuery({ queryKey: ['calendar', orgId, start, selectedLocation], queryFn: () => orgApi<CalendarEvent[]>(orgId, `/calendar?from=${start}&to=${end}${selectedLocation ? `&locationId=${selectedLocation}` : ''}`), enabled: view === 'calendar' });
    return <><PageTitle eyebrow={tr("BOOKING CENTER")} title={tr("Bookings")} description={tr("Overview of appointments, customers, and booking statuses.")} action={<div style={{display:'flex',alignItems:'center',gap:12}}>{access.data?.canManageBookings&&<Button onClick={()=>setCreating(true)}>{tr('New booking')}</Button>}<div className="view-switch"><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays size={16}/>{tr("Calendar")}</button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><ListFilter size={16}/>{tr("List")}</button></div></div>}/><Card><div className="table-toolbar"><div className="filters-left">{view === 'list' && <SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Name or email…")}/>}{activeLocations.length>1 && <Select aria-label={tr("Filter location")} value={selectedLocation} onChange={e => { setLocation(Number(e.target.value)); setPage(0); }}><option value={0}>{tr("All locations")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>}{view === 'list' && <Select aria-label={tr("Booking status")} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">{tr("All statuses")}</option><option value="confirmed">{tr("Confirmed")}</option><option value="pending">{tr("Pending")}</option><option value="completed">{tr("Completed")}</option><option value="cancelled">{tr("Cancelled")}</option><option value="no_show">{tr("No-show")}</option></Select>}</div>{view === 'calendar' && <div className="calendar-nav"><button onClick={() => setStart(addDays(start, -7))}><ChevronLeft size={18}/></button><strong>{formatDate(start)} – {formatDate(addDays(start, 6))}</strong><button onClick={() => setStart(addDays(start, 7))}><ChevronRight size={18}/></button><button title={tr("Today")} onClick={() => setStart(today())}><RefreshCw size={16}/></button></div>}</div>
    {view === 'list' ? bookings.isLoading ? <Loading /> : bookings.error ? <ErrorState error={bookings.error}/> : !bookings.data?.items.length ? q.trim() || status || (activeLocations.length > 1 && selectedLocation > 0) ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No bookings")} description={tr("Change the filters or wait for new bookings.")}/> : <><div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Bookings")}</th><th>{tr("Customer")}</th><th>{tr("Created")}</th><th>{tr("Status")}</th><th>{tr("Amount")}</th><th /></tr></thead><tbody>{bookings.data.items.map(b => <tr key={b.id}><td><strong>#{b.id}</strong></td><td>{b.customer_name}</td><td>{formatDateTime(b.created_at)}</td><td><Badge tone={b.status === 'confirmed' ? 'green' : b.status === 'cancelled' ? 'red' : 'orange'}>{statusLabel(b.status)}</Badge></td><td><strong>{money(b.total_amount, b.currency)}</strong></td><td><button className="icon-button" title={tr("Details")} onClick={() => setSelected(b.id)}><Eye size={17}/></button></td></tr>)}</tbody></table></div><Pager page={page} totalPages={bookings.data.totalPages} onChange={setPage}/></> : calendar.isLoading ? <Loading /> : calendar.error ? <ErrorState error={calendar.error}/> : <div className="week-calendar">{Array.from({ length: 7 }, (_, i) => { const date = addDays(start, i); const items = calendar.data?.filter(e => { const d = new Date(e.starts_at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === date; }) || []; return <div key={date} className="calendar-day"><div className="calendar-day-heading"><span>{new Intl.DateTimeFormat(localeTag(), { weekday: 'short' }).format(new Date(date + 'T12:00:00'))}</span><strong>{date.slice(-2)}.</strong></div>{items.length ? items.map(e => <button className="calendar-event" key={e.item_id} onClick={() => setSelected(e.reservation_id)}><span>{formatDateTime(e.starts_at).split(' ').slice(-1)[0]}</span><strong>{e.customer_name}</strong><small>{e.service_name}</small></button>) : <div className="calendar-empty">—</div>}</div>; })}</div>}
  </Card>{selected !== null && <Modal title={`${tr('Booking #')}${selected}`} onClose={() => setSelected(null)}><ReservationDetail org={orgId} id={selected} canManage={access.data?.canManageBookings===true}/></Modal>}{creating&&org?.public_id&&<Modal wide title={tr("New booking")} onClose={()=>setCreating(false)}><CreateTeamBooking org={orgId} publicId={org.public_id} onComplete={()=>setCreating(false)}/></Modal>}</>;
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
    return <ErrorState error={error}/>; const r = data?.reservation; return <div className="stack"><div className="detail-summary"><div><small>{tr("Customer name")}</small><strong>{String(r?.customer_name || '—')}</strong></div><div><small>{tr("Status")}</small><Badge tone={r?.status === 'confirmed' ? 'green' : 'orange'}>{statusLabel(String(r?.status || ''))}</Badge></div><div><small>{tr("Email")}</small><strong>{String(r?.customer_email || '—')}</strong></div><div><small>{tr("Phone")}</small><strong>{String(r?.customer_phone || '—')}</strong></div><div><small>{tr("Amount")}</small><strong>{money(Number(r?.total_amount || 0), String(r?.currency || 'CZK'))}</strong></div></div><h3>{tr("Booking items")}</h3>{data?.items.map((item, i) => <div key={i} className="detail-item"><strong>{tr("Service #")}{String(item.service_id)}</strong><span>{formatDateTime(String(item.starts_at))} – {formatDateTime(String(item.ends_at))}</span></div>)}{canManage&&data?.items.length===1&&data.items[0]?.member_id!=null&&r?.status==='confirmed'&&<MoveTeamBooking org={org} id={id} item={data.items[0]} onChanged={()=>{void qc.invalidateQueries({queryKey:['reservation',org,id]});void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});}}/>}{canManage&&<BookingStatusActions org={org} id={id} status={String(r?.status||'')} onChanged={()=>{void qc.invalidateQueries({queryKey:['reservation',org,id]});void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});}}/>}</div>; }
