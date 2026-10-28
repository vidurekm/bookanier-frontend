import { localeTag } from '../lib/preferences';
import { tr } from '../lib/translations';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowDownUp, ArrowUp, BarChart3, CalendarDays, CheckCheck, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock3, Eye, ListFilter, Plus, RefreshCw, UserX } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { list, locations, orgApi, resources } from '../lib/api';
import type { Member, Reservation } from '../lib/types';
import { addDays, formatDate, formatDateTime, formatDateTimeRange, money, sortByName, statusLabel, statusTone, today } from '../lib/utils';
import { Badge, Card, Empty, ErrorState, Loading, Modal, PageTitle, Pager, SearchBox, Select, Button } from '../components/UI';
import { CreateTeamBooking } from '../components/BookingManagement';
import { PeriodPicker } from '../components/PeriodPicker';
import { ReservationDetail } from '../components/ReservationDetail';
import { myAccess } from '../lib/access';
import { singleActiveLocationId } from '../lib/locationSelection';
import { getSetup } from '../lib/setup';
interface CalendarEvent {
    reservation_id: number;
    customer_name: string;
    status: string;
    total_amount: number;
    currency: string;
    item_id: number;
    starts_at: string;
    ends_at: string;
    local_date: string;
    location_timezone: string;
    member_id?: number;
    location_id: number;
    location_name: string;
    service_name: string;
    member_name?: string;
    resource_name?: string | null;
}
interface ReservationStatistic {
    period_start: string;
    reservation_count: number;
    capacity: number;
    used_capacity: number;
    revenue: { currency: string; amount: number }[];
}
const reservationRefreshSetting = Number(import.meta.env.VITE_RESERVATIONS_REFRESH_INTERVAL_MS);
const reservationRefreshIntervalMs = Number.isFinite(reservationRefreshSetting) && reservationRefreshSetting > 0
    ? reservationRefreshSetting
    : 10_000;
export function AdminReservations() {
    const { orgId, org } = useAdmin();
    const access = useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
    const [creating,setCreating] = useState(false);
    const [view, setView] = useState<'calendar' | 'list' | 'statistics'>('calendar');
    const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
    const [calendarFiltersOpen, setCalendarFiltersOpen] = useState(false);
    const [listFiltersOpen, setListFiltersOpen] = useState(false);
    const [showCancelled, setShowCancelled] = useState(false);
    const [page, setPage] = useState(0);
    const [q, setQ] = useState('');
    const [listPeriod, setListPeriod] = useState<'all' | 'day' | 'month' | 'year'>('all');
    const [listStart, setListStart] = useState(today());
    const [sortField, setSortField] = useState('appointmentAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [status, setStatus] = useState('');
    const [location, setLocation] = useState<number | null>(null);
    const [memberId, setMemberId] = useState<number | null>(null);
    const [resourceId, setResourceId] = useState<number | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [start, setStart] = useState(today());
    const locs = useQuery({ queryKey: ['locations', orgId], queryFn: () => locations(orgId), retry: false });
    const setup = useQuery({ queryKey: ['setup', orgId], queryFn: () => getSetup(orgId), enabled: view === 'list' || view === 'calendar' });
    const activeLocations = locs.data?.items.filter(item => item.active) || [];
    const selectedLocation = location ?? singleActiveLocationId(activeLocations) ?? 0;
    const storedWeekStartsOn = Number(setup.data?.settings.weekStartsOn);
    const weekStartsOn = Number.isInteger(storedWeekStartsOn) && storedWeekStartsOn >= 1 && storedWeekStartsOn <= 7
        ? storedWeekStartsOn
        : 1;
    const weekStartDay = weekStartsOn % 7;
    const listMonthStart = `${listStart.slice(0, 7)}-01`;
    const listMonthEnd = `${listStart.slice(0, 7)}-${String(new Date(Number(listStart.slice(0, 4)), Number(listStart.slice(5, 7)), 0).getDate()).padStart(2, '0')}`;
    const listYearStart = `${listStart.slice(0, 4)}-01-01`;
    const listYearEnd = `${listStart.slice(0, 4)}-12-31`;
    const appointmentFrom = listPeriod === 'day' ? listStart
        : listPeriod === 'month' ? listMonthStart
        : listPeriod === 'year' ? listYearStart : '';
    const appointmentTo = listPeriod === 'day' ? listStart
        : listPeriod === 'month' ? listMonthEnd
        : listPeriod === 'year' ? listYearEnd : '';
    const members = useQuery({ queryKey: ['reservation-filter-members', orgId, selectedLocation], queryFn: async () => {
        const result: Member[] = [];
        let pageIndex = 0;
        let totalPages = 1;
        while (pageIndex < totalPages) {
            const pageResult = await list<Member>(orgId, '/members', {
                page: pageIndex,
                size: 100,
                locationId: selectedLocation || undefined,
                sort: 'name,asc'
            });
            result.push(...pageResult.items);
            totalPages = pageResult.totalPages;
            pageIndex++;
        }
        return result.filter(member => member.active);
    }, enabled: (view === 'list' || view === 'calendar') && access.data?.canWrite === true });
    const filterMembers = sortByName(members.data || [], member => member.display_name);
    const trackResources = setup.data?.settings.trackResources === true;
    const resourceOptions = useQuery({ queryKey: ['reservation-filter-resources', orgId, selectedLocation], queryFn: async () => {
        const locationsToLoad = selectedLocation
            ? locs.data?.items.filter(item => item.id === selectedLocation) || []
            : locs.data?.items || [];
        const byLocation = await Promise.all(locationsToLoad.map(item => resources(orgId, item.id)));
        return byLocation.flat().filter(resource => resource.active && resource.category !== 'staff');
    }, enabled: (view === 'list' || view === 'calendar') && trackResources && !!locs.data });
    const filterResources = sortByName(resourceOptions.data || [], resource => resource.name);
    const bookings = useQuery({ queryKey: ['reservations', orgId, page, q, status, selectedLocation, memberId, resourceId, appointmentFrom, appointmentTo, sortField, sortDirection], queryFn: () => list<Reservation & { appointment_at?: string; appointment_ends_at?: string }>(orgId, '/reservations', { page, size: 12, q, status, locationId: selectedLocation || undefined, memberId: memberId || undefined, resourceId: resourceId || undefined, appointmentFrom: appointmentFrom || undefined, appointmentTo: appointmentTo || undefined, sort: `${sortField},${sortDirection}` }), enabled: view === 'list', refetchInterval: reservationRefreshIntervalMs });
    const changeSort = (field: string) => {
        setSortDirection(current => field === sortField ? current === 'asc' ? 'desc' : 'asc' : 'asc');
        setSortField(field);
        setPage(0);
    };
    const sortHeader = (field: string, label: string) => <th aria-sort={sortField === field ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>
        <button className="table-sort" onClick={() => changeSort(field)}>{label}{sortField === field ? sortDirection === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/> : <ArrowDownUp size={14}/>}</button>
    </th>;
    const monthStart = `${start.slice(0, 7)}-01`;
    const monthOffset = (new Date(`${monthStart}T12:00:00`).getDay() - weekStartDay + 7) % 7;
    const daysInMonth = new Date(new Date(`${monthStart}T12:00:00`).getFullYear(), new Date(`${monthStart}T12:00:00`).getMonth() + 1, 0).getDate();
    const monthGridStart = addDays(monthStart, -monthOffset);
    const monthCellCount = Math.ceil((monthOffset + daysInMonth) / 7) * 7;
    const monthCells = Array.from({ length: monthCellCount }, (_, index) => addDays(monthGridStart, index));
    const displayedWeekStart = addDays(start, -((new Date(`${start}T12:00:00`).getDay() - weekStartDay + 7) % 7));
    const calendarFrom = calendarView === 'month' ? monthGridStart : calendarView === 'week' ? displayedWeekStart : start;
    const calendarTo = calendarView === 'month' ? addDays(monthGridStart, monthCellCount) : calendarView === 'week' ? addDays(displayedWeekStart, 7) : addDays(start, 1);
    const calendar = useQuery({ queryKey: ['calendar', orgId, calendarFrom, calendarTo, selectedLocation, status, memberId, resourceId, showCancelled], queryFn: () => {
        const params = new URLSearchParams({ from: calendarFrom, to: calendarTo });
        if (selectedLocation) params.set('locationId', String(selectedLocation));
        if (status) params.set('status', status);
        if (memberId) params.set('memberId', String(memberId));
        if (resourceId) params.set('resourceId', String(resourceId));
        if (showCancelled || status === 'cancelled') params.set('showCancelled', 'true');
        return orgApi<CalendarEvent[]>(orgId, `/calendar?${params.toString()}`);
    }, enabled: view === 'calendar', refetchInterval: reservationRefreshIntervalMs });
    const calendarDates: (string | null)[] = calendarView === 'month' ? monthCells
        : Array.from({ length: calendarView === 'day' ? 1 : 7 }, (_, index) => addDays(calendarView === 'day' ? start : displayedWeekStart, index));
    const calendarHeading = calendarView === 'month'
        ? new Intl.DateTimeFormat(localeTag(), { month: 'long', year: 'numeric' }).format(new Date(`${monthStart}T12:00:00`))
        : calendarView === 'day' ? formatDate(start) : `${formatDate(displayedWeekStart)} – ${formatDate(addDays(displayedWeekStart, 6))}`;
    const shiftCalendar = (direction: number) => {
        if (calendarView === 'month') {
            const date = new Date(`${monthStart}T12:00:00`);
            date.setMonth(date.getMonth() + direction);
            setStart(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
        } else setStart(addDays(start, direction * (calendarView === 'day' ? 1 : 7)));
    };
    const shiftListPeriod = (direction: number) => {
        if (listPeriod === 'day') setListStart(addDays(listStart, direction));
        else if (listPeriod === 'month') {
            const date = new Date(`${listMonthStart}T12:00:00`);
            date.setMonth(date.getMonth() + direction);
            setListStart(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
        } else if (listPeriod === 'year') {
            const nextYear = Number(listStart.slice(0, 4)) + direction;
            if (nextYear > currentYear + 1) return;
            setListStart(`${nextYear}-01-01`);
        }
        setPage(0);
    };
    const currentYear = Number(today().slice(0, 4));
    const selectedListYear = Number(listStart.slice(0, 4));
    const firstListYear = Math.min(currentYear - 20, selectedListYear);
    return <>
        <PageTitle eyebrow={tr("BOOKING CENTER")} title={tr("Bookings")} description={tr("Overview of appointments, customers, and booking statuses.")} action={<div style={{display:'flex',alignItems:'center',gap:12}}>{(access.data?.canManageBookings||access.data?.canManageOwnBookings)&&<Button onClick={()=>setCreating(true)}><Plus size={17}/>{tr('New booking')}</Button>}<div className="view-switch"><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays size={16}/>{tr("Calendar")}</button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><ListFilter size={16}/>{tr("List")}</button><button className={view === 'statistics' ? 'active' : ''} onClick={() => setView('statistics')}><BarChart3 size={16}/>{tr("Statistics")}</button></div></div>}/>
        <Card>
            {view !== 'statistics' && <div className={`table-toolbar calendar-toolbar${view === 'list' ? ' list-toolbar' : ''}`}>
                <div className="filters-left">
                    {activeLocations.length > 1 && <label className="filter-field"><span>{tr("Location")}</span><Select allOption className="calendar-location-filter" aria-label={tr("Filter location")} value={selectedLocation} onChange={e => { setLocation(Number(e.target.value)); setMemberId(null); setResourceId(null); setPage(0); }}><option value={0}>{tr("All locations")}</option>{locs.data?.items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>}
                                        {view === 'list' && <label className="filter-field filter-field-search"><span>{tr("Search")}</span><SearchBox value={q} onChange={value => { setQ(value); setPage(0); }} placeholder={tr("Customer name or email")}/></label>}
                </div>
                {view === 'calendar' && <div className="calendar-nav"><div className="view-switch calendar-period-switch"><button className={calendarView === 'day' ? 'active' : ''} onClick={() => setCalendarView('day')}>{tr("Day")}</button><button className={calendarView === 'week' ? 'active' : ''} onClick={() => setCalendarView('week')}>{tr("Week")}</button><button className={calendarView === 'month' ? 'active' : ''} onClick={() => setCalendarView('month')}>{tr("Month")}</button></div><button aria-label={tr("Previous period")} onClick={() => shiftCalendar(-1)}><ChevronLeft size={18}/></button>{calendarView === 'month' ? <PeriodPicker mode="month" label={tr("Select month")} value={monthStart} minYear={Math.min(firstListYear, Number(start.slice(0, 4)))} maxYear={Math.max(currentYear + 1, Number(start.slice(0, 4)))} onChange={setStart}/> : <strong>{calendarHeading}</strong>}<button aria-label={tr("Next period")} onClick={() => shiftCalendar(1)}><ChevronRight size={18}/></button><button title={tr("Today")} aria-label={tr("Today")} onClick={() => setStart(today())}><CalendarDays size={16}/></button><button type="button" className="reservation-refresh" title={tr("Refresh reservations")} aria-label={tr("Refresh reservations")} disabled={calendar.isFetching} onClick={() => void calendar.refetch()}><RefreshCw size={16} className={calendar.isFetching ? 'spin' : ''}/>{tr("Refresh")}</button><button className={`calendar-filter-toggle ${calendarFiltersOpen ? 'active' : ''}`} title={tr("Filter reservations")} aria-label={tr("Filter reservations")} aria-expanded={calendarFiltersOpen} onClick={() => setCalendarFiltersOpen(open => !open)}><ListFilter size={17}/>{(status || memberId || resourceId || showCancelled) && <i/>}</button></div>}
                {view === 'list' && <div className="calendar-nav list-period-nav">
                    <div className="view-switch calendar-period-switch">
                        <button className={listPeriod === 'day' ? 'active' : ''} onClick={() => { setListPeriod('day'); setPage(0); }}>{tr("Day")}</button>
                        <button className={listPeriod === 'month' ? 'active' : ''} onClick={() => { setListPeriod('month'); setPage(0); }}>{tr("Month")}</button>
                        <button className={listPeriod === 'year' ? 'active' : ''} onClick={() => { setListPeriod('year'); setPage(0); }}>{tr("Year")}</button>
                        <button className={listPeriod === 'all' ? 'active' : ''} onClick={() => { setListPeriod('all'); setPage(0); }}>{tr("All dates")}</button>
                    </div>
                    {listPeriod !== 'all' && <>
                        <button aria-label={tr("Previous period")} onClick={() => shiftListPeriod(-1)}><ChevronLeft size={18}/></button>
                        {listPeriod === 'day' && <PeriodPicker mode="day" label={tr("Select date")} value={listStart} weekStartDay={weekStartDay} minYear={firstListYear} maxYear={currentYear + 1} onChange={value => { setListStart(value); setPage(0); }}/>}
                        {listPeriod === 'month' && <PeriodPicker mode="month" label={tr("Select month")} value={listStart} minYear={firstListYear} maxYear={currentYear + 1} onChange={value => { setListStart(value); setPage(0); }}/>}
                        {listPeriod === 'year' && <PeriodPicker mode="year" label={tr("Select year")} value={listStart} minYear={firstListYear} maxYear={currentYear + 1} onChange={value => { setListStart(value); setPage(0); }}/>}
                        <button aria-label={tr("Next period")} disabled={listPeriod === 'year' && selectedListYear >= currentYear + 1} onClick={() => shiftListPeriod(1)}><ChevronRight size={18}/></button>
                    </>}
                    <button title={tr("Today")} aria-label={tr("Today")} onClick={() => { setListStart(today()); setListPeriod('day'); setPage(0); }}><CalendarDays size={16}/></button>
                    <button type="button" className="reservation-refresh" title={tr("Refresh reservations")} aria-label={tr("Refresh reservations")} disabled={bookings.isFetching} onClick={() => void bookings.refetch()}><RefreshCw size={16} className={bookings.isFetching ? 'spin' : ''}/>{tr("Refresh")}</button>
                    <button className={`calendar-filter-toggle ${listFiltersOpen ? 'active' : ''}`} title={tr("Filter reservations")} aria-label={tr("Filter reservations")} aria-expanded={listFiltersOpen} onClick={() => setListFiltersOpen(open => !open)}><ListFilter size={17}/>{(status || memberId || resourceId) && <i/>}</button>
                </div>}
            </div>}
            {view === 'list' && listFiltersOpen && <div className="calendar-filter-panel list-filter-panel">
                <div className="filter-field"><span>{tr("Status")}</span><StatusFilter value={status} onChange={value => { setStatus(value); setPage(0); }}/></div>
                {access.data?.canWrite && (
                    <label className="filter-field"><span>{tr("Worker")}</span><Select allOption aria-label={tr("Filter worker")} value={memberId ?? ''}
                        onChange={e => { setMemberId(Number(e.target.value) || null); setPage(0); }}>
                        <option value="">{tr("All workers")}</option>
                        {filterMembers.map(member => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                    </Select></label>
                )}
                {trackResources && (
                    <label className="filter-field"><span>{tr("Resource")}</span><Select allOption aria-label={tr("Filter resource")} value={resourceId ?? ''}
                        onChange={e => { setResourceId(Number(e.target.value) || null); setPage(0); }}>
                        <option value="">{tr("All resources")}</option>
                        {filterResources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
                    </Select></label>
                )}
            </div>}
            {view === 'calendar' && calendarFiltersOpen && <div className="calendar-filter-panel">
                <div className="filter-field"><span>{tr("Status")}</span><StatusFilter value={status} onChange={value => { setStatus(value); setPage(0); }}/></div>
                {access.data?.canWrite && <label className="filter-field"><span>{tr("Worker")}</span><Select allOption aria-label={tr("Filter worker")} value={memberId ?? ''} onChange={e => setMemberId(Number(e.target.value) || null)}><option value="">{tr("All workers")}</option>{filterMembers.map(member => <option key={member.id} value={member.id}>{member.display_name}</option>)}</Select></label>}
                {trackResources && <label className="filter-field"><span>{tr("Resource")}</span><Select allOption aria-label={tr("Filter resource")} value={resourceId ?? ''} onChange={e => setResourceId(Number(e.target.value) || null)}><option value="">{tr("All resources")}</option>{filterResources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</Select></label>}
                <label className="calendar-cancelled-toggle"><input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)}/>{tr("Show cancelled bookings")}</label>
            </div>}
            {view === 'list' && members.error && access.data?.canWrite && <ErrorState error={members.error}/>}
            {view === 'list' && resourceOptions.error && <ErrorState error={resourceOptions.error}/>}
            {view === 'calendar' && members.error && access.data?.canWrite && <ErrorState error={members.error}/>}
            {view === 'calendar' && resourceOptions.error && <ErrorState error={resourceOptions.error}/>}
            {view === 'list' ? bookings.isLoading ? <Loading /> : bookings.error ? <ErrorState error={bookings.error}/> : !bookings.data?.items.length ? q.trim() || status || memberId || resourceId || appointmentFrom || appointmentTo || (activeLocations.length > 1 && selectedLocation > 0) ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No bookings")} description={tr("Change the filters or wait for new bookings.")}/> : <><div className="table-scroll"><table className="data-table"><thead><tr>{sortHeader('appointmentAt', tr("Date and time"))}{sortHeader('customerName', tr("Customer"))}{sortHeader('memberName', tr("Workers"))}{trackResources && sortHeader('resourceName', tr("Resource"))}{sortHeader('status', tr("Status"))}{sortHeader('amount', tr("Amount"))}<th /></tr></thead><tbody>{bookings.data.items.map(booking => <tr key={booking.id}><td><div className="cell-name"><span className="cell-icon" aria-hidden="true"><CalendarDays size={18}/></span><span>{booking.appointment_at ? <>{booking.appointment_ends_at ? formatDateTimeRange(booking.appointment_at, booking.appointment_ends_at) : formatDateTime(booking.appointment_at)}</> : '—'}</span></div></td><td>{booking.customer_name}</td><td>{booking.member_name || '—'}</td>{trackResources && <td>{booking.resource_name || '—'}</td>}<td><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>{booking.appointment_at && booking.appointment_ends_at && booking.status !== 'cancelled' && booking.status !== 'no_show' && (() => { const s = Date.parse(booking.appointment_at), e = Date.parse(booking.appointment_ends_at), n = Date.now(); return s <= n && e > n ? <ProgressPie className="status-progress" progress={(n - s) / (e - s)} label={`${Math.round((n - s) / (e - s) * 100)} %`}/> : null; })()}</td><td><strong>{money(booking.total_amount, booking.currency)}</strong></td><td><button className="icon-button" title={tr("Details")} onClick={() => setSelected(booking.id)}><Eye size={17}/></button></td></tr>)}</tbody></table></div><Pager page={page} totalPages={bookings.data.totalPages} onChange={setPage}/></> : view === 'calendar' ? calendar.isLoading ? <Loading /> : calendar.error ? <ErrorState error={calendar.error}/> : <ReservationCalendarGrid dates={calendarDates} events={calendar.data || []} mode={calendarView} month={monthStart.slice(0, 7)} weekStartsOn={weekStartsOn} showResources={trackResources} showLocations={activeLocations.length > 1} onSelect={setSelected}/> : <ReservationStatistics orgId={orgId} locationId={selectedLocation || undefined} locationFilter={activeLocations.length > 1 && <label className="filter-field"><span>{tr("Location")}</span><Select allOption aria-label={tr("Filter location")} value={selectedLocation} onChange={e => { setLocation(Number(e.target.value)); setMemberId(null); setResourceId(null); setPage(0); }}><option value={0}>{tr("All locations")}</option>{locs.data?.items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>}/>}
        </Card>
        {selected !== null && <Modal wide className="booking-detail-modal" title={tr("Booking details")} onClose={() => setSelected(null)}><ReservationDetail org={orgId} id={selected} canManage={access.data?.canManageBookings===true||access.data?.canManageOwnBookings===true} onClose={() => setSelected(null)}/></Modal>}
        {creating&&org?.public_id&&<Modal wide title={tr("New booking")} onClose={()=>setCreating(false)}><CreateTeamBooking org={orgId} publicId={org.public_id} ownMemberId={access.data?.canManageOwnBookings&&!access.data?.canManageBookings?access.data.ownMemberId??undefined:undefined} excludeMemberId={access.data?.canManageBookings&&!access.data?.canWrite?access.data.ownMemberId??undefined:undefined} onComplete={()=>setCreating(false)}/></Modal>}
    </>;
}
function StatusFilter({ value, onChange, hideCancelled }: { value: string; onChange: (value: string) => void; hideCancelled?: boolean }) {
    const options: Array<[string, string]> = [['', 'All statuses'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['completed', 'Completed'], ...(hideCancelled ? [] : [['cancelled', 'Cancelled'] as [string, string]]), ['no_show', 'No-show']];
    const renderStatus = (key: string, label: ReactNode) => <>{key && <span className={`calendar-event-status status-${key}`}><StatusIcon status={key}/></span>}<span>{label}</span></>;
    return <div className="status-filter"><Select aria-label={tr("Booking status")} value={value} onChange={event => onChange(event.target.value)} renderOption={renderStatus} renderValue={renderStatus}>
        {options.map(([key, label]) => <option value={key} key={key || 'all'}>{tr(label)}</option>)}
    </Select></div>;
}
function StatusIcon({ status, size = 14 }: { status: string; size?: number }) {
    return status === 'cancelled' ? <CircleX size={size}/> : status === 'no_show' ? <UserX size={size}/> : status === 'pending' ? <Clock3 size={size}/> : status === 'completed' ? <CheckCheck size={size}/> : <CircleCheck size={size}/>;
}
function ProgressPie({ progress, label, className = 'calendar-event-progress' }: { progress: number; label: string; className?: string }) {
    const ratio = Math.min(Math.max(progress, 0), 1);
    const angle = ratio * 2 * Math.PI;
    const x = 9 + 7 * Math.sin(angle);
    const y = 9 - 7 * Math.cos(angle);
    return <svg className={className} width="18" height="18" viewBox="0 0 18 18" role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.3"/>
        {ratio > 0 && <path d={`M9 9 L9 2 A7 7 0 ${ratio > 0.5 ? 1 : 0} 1 ${x} ${y} Z`} fill="currentColor"/>}
    </svg>;
}
function ReservationCalendarGrid({ dates, events, mode, month, weekStartsOn, showResources, showLocations, onSelect }: {
    dates: (string | null)[];
    events: CalendarEvent[];
    mode: 'day' | 'week' | 'month';
    month: string;
    weekStartsOn: number;
    showResources: boolean;
    showLocations: boolean;
    onSelect: (reservationId: number) => void;
}) {
    const now = Date.now();
    const weekday = new Intl.DateTimeFormat(localeTag(), { weekday: 'short' });
    const weekdayStart = weekStartsOn % 7;
    const weekdays = Array.from({ length: 7 }, (_, index) => weekday.format(new Date(addDays('2024-01-01', (weekdayStart + 6) % 7 + index) + 'T12:00:00')));
    return <div className={`week-calendar calendar-${mode}-view`}>
        {mode === 'month' && weekdays.map((name, index) => <div className="calendar-weekday" key={index}>{name}</div>)}
        {dates.map((date, index) => {
            if (!date) return <div className="calendar-day calendar-day-blank" key={`blank-${index}`} />;
            const dayEvents = events.filter(event => event.local_date === date);
            const outsideMonth = mode === 'month' && date.slice(0, 7) !== month;
            return <div key={date} className={`calendar-day${outsideMonth ? ' calendar-day-outside-month' : ''}`}>
                <div className="calendar-day-heading">
                    {mode !== 'month' && <span>{weekday.format(new Date(`${date}T12:00:00`))}</span>}
                    <strong>{mode === 'month' ? Number(date.slice(-2)) : `${date.slice(-2)}.`}</strong>
                </div>
                {dayEvents.length ? dayEvents.map(event => {
                    const startsAt = new Date(event.starts_at).getTime();
                    const endsAt = new Date(event.ends_at).getTime();
                    const timing = startsAt <= now && endsAt > now ? 'ongoing' : endsAt <= now ? 'past' : 'upcoming';
                    return <button className={`calendar-event calendar-event-${timing}${event.status === 'cancelled' ? ' calendar-event-cancelled' : ''}${event.status === 'no_show' ? ' calendar-event-no_show' : ''}${event.status === 'completed' ? ' calendar-event-completed' : ''}`} key={event.item_id} title={event.customer_name} onClick={() => onSelect(event.reservation_id)}>
                    <span className="calendar-event-heading"><strong className="calendar-event-customer">{event.customer_name}</strong><span className={`calendar-event-status status-${event.status}`} title={statusLabel(event.status)} aria-label={statusLabel(event.status)}>{timing === 'ongoing' && event.status !== 'cancelled' && event.status !== 'no_show' && <ProgressPie progress={(now - startsAt) / (endsAt - startsAt)} label={`${Math.round((now - startsAt) / (endsAt - startsAt) * 100)} %`}/>}<span className="calendar-event-status-icon">{event.status === 'cancelled' ? <CircleX size={14}/> : event.status === 'no_show' ? <UserX size={14}/> : event.status === 'pending' ? <Clock3 size={14}/> : event.status === 'completed' ? <CheckCheck size={14}/> : <CircleCheck size={14}/>}</span></span></span>
                    <span>{new Intl.DateTimeFormat(localeTag(), { hour: '2-digit', minute: '2-digit', timeZone: event.location_timezone }).format(new Date(event.starts_at))} – {new Intl.DateTimeFormat(localeTag(), { hour: '2-digit', minute: '2-digit', timeZone: event.location_timezone }).format(new Date(event.ends_at))}</span>
                    <small>{event.service_name}</small>
                    <small className="calendar-event-worker">{event.member_name || '—'}</small>
                    {showLocations && <small className="calendar-event-location">{event.location_name}</small>}
                    {showResources && event.resource_name && <small className="calendar-event-resource">{event.resource_name}</small>}
                </button>;
                }) : <div className="calendar-empty">—</div>}
            </div>;
        })}
    </div>;
}

function ReservationStatistics({ orgId, locationId, locationFilter }: { orgId: number; locationId?: number; locationFilter?: ReactNode }) {
    const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month');
    const [metric, setMetric] = useState<'reservations' | 'capacity' | 'utilization' | 'revenue'>('reservations');
    const currentDate = today();
    const currentYear = Number(currentDate.slice(0, 4));
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [currency, setCurrency] = useState('');
    const apiGroupBy = groupBy === 'year' ? 'month' : 'day';
    const selectedMonth = selectedDate.slice(0, 7);
    const selectedYear = Number(selectedDate.slice(0, 4));
    const monthEnd = `${selectedMonth}-${String(new Date(selectedYear, Number(selectedMonth.slice(5, 7)), 0).getDate()).padStart(2, '0')}`;
    const queryFrom = groupBy === 'day' ? selectedDate
        : groupBy === 'month' ? `${selectedMonth}-01` : `${selectedYear}-01-01`;
    const queryTo = groupBy === 'day' ? selectedDate
        : groupBy === 'month' ? monthEnd : `${selectedYear}-12-31`;
    const shiftPeriod = (direction: number) => {
        if (groupBy === 'day') setSelectedDate(addDays(selectedDate, direction));
        else if (groupBy === 'month') {
            const date = new Date(`${selectedMonth}-01T12:00:00`);
            date.setMonth(date.getMonth() + direction);
            setSelectedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
        } else setSelectedDate(`${selectedYear + direction}-01-01`);
    };
    const pickerMinYear = Math.min(currentYear - 20, selectedYear);
    const pickerMaxYear = Math.max(currentYear + 1, selectedYear);
    const query = useQuery({
        queryKey: ['reservation-statistics', orgId, locationId, apiGroupBy, queryFrom, queryTo],
        queryFn: () => orgApi<ReservationStatistic[]>(orgId,
            `/reservation-statistics?from=${encodeURIComponent(queryFrom)}&to=${encodeURIComponent(queryTo)}&groupBy=${apiGroupBy}${locationId ? `&locationId=${locationId}` : ''}`),
    });
    const points = query.data || [];
    const currencies = [...new Set(points.flatMap(point => point.revenue.map(entry => entry.currency.trim())))];
    const selectedCurrency = currency && currencies.includes(currency) ? currency : currencies[0] || '';
    const totalReservations = points.reduce((total, point) => total + point.reservation_count, 0);
    const totalCapacityMinutes = points.reduce((total, point) => total + point.capacity, 0);
    const usedCapacityMinutes = points.reduce((total, point) => total + point.used_capacity, 0);
    const utilization = totalCapacityMinutes ? usedCapacityMinutes / totalCapacityMinutes * 100 : 0;
    const totalRevenue = points.reduce((total, point) => total + (point.revenue.find(entry => entry.currency.trim() === selectedCurrency)?.amount || 0), 0);
    const formatHours = (minutes: number) => `${new Intl.NumberFormat(localeTag(), { maximumFractionDigits: 1 }).format(minutes / 60)} h`;
    const metricValues = points.map(point => {
        if (metric === 'reservations') return point.reservation_count;
        if (metric === 'capacity') return Math.max(point.capacity, point.used_capacity);
        if (metric === 'utilization') return point.capacity ? point.used_capacity / point.capacity * 100 : 0;
        return point.revenue.find(entry => entry.currency.trim() === selectedCurrency)?.amount || 0;
    });
    const rawMaxValue = Math.max(1, ...metricValues);
    const maxValue = metric === 'utilization' ? 100
        : metric === 'reservations' ? Math.ceil(rawMaxValue / 4) * 4 : rawMaxValue;
    const axisValues = Array.from({ length: 5 }, (_, index) => maxValue * (4 - index) / 4);
    const formatAxisValue = (value: number) => metric === 'capacity' ? formatHours(value)
        : metric === 'utilization' ? `${value.toFixed(0)}%`
        : metric === 'revenue' && selectedCurrency
            ? new Intl.NumberFormat(localeTag(), { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: selectedCurrency }).format(value)
            : new Intl.NumberFormat(localeTag(), { maximumFractionDigits: 1 }).format(value);
    const formatPeriod = (value: string) => {
        const date = new Date(`${value}T12:00:00`);
        if (apiGroupBy === 'month') return new Intl.DateTimeFormat(localeTag(), { month: 'short', year: '2-digit' }).format(date);
        return new Intl.DateTimeFormat(localeTag(), { day: 'numeric', month: 'short' }).format(date);
    };
    const metrics = [
        { key: 'reservations', label: tr("Completed bookings"), value: new Intl.NumberFormat(localeTag()).format(totalReservations) },
        { key: 'capacity', label: tr("Available work time"), value: formatHours(totalCapacityMinutes) },
        { key: 'utilization', label: tr("Capacity utilization"), value: `${utilization.toFixed(1)}%` },
        { key: 'revenue', label: tr("Revenue"), value: selectedCurrency ? money(totalRevenue, selectedCurrency) : '—' },
    ] as const;
    return <div className="statistics-panel">
        <div className="statistics-toolbar">
            {locationFilter}
            <div className="calendar-nav list-period-nav">
                <div className="view-switch calendar-period-switch">
                    {(['day', 'month', 'year'] as const).map(item => <button key={item} className={groupBy === item ? 'active' : ''} onClick={() => setGroupBy(item)}>{item === 'day' ? tr("Day") : item === 'month' ? tr("Month") : tr("Year")}</button>)}
                </div>
                <button aria-label={tr("Previous period")} onClick={() => shiftPeriod(-1)}><ChevronLeft size={18}/></button>
                <PeriodPicker mode={groupBy} label={groupBy === 'day' ? tr("Select date") : groupBy === 'month' ? tr("Select month") : tr("Select year")} value={selectedDate} minYear={pickerMinYear} maxYear={pickerMaxYear} onChange={setSelectedDate}/>
                <button aria-label={tr("Next period")} onClick={() => shiftPeriod(1)}><ChevronRight size={18}/></button>
                <button title={tr("Today")} aria-label={tr("Today")} onClick={() => setSelectedDate(currentDate)}><CalendarDays size={16}/></button>
            </div>
            {metric === 'revenue' && currencies.length > 1 && <label className="filter-field"><span>{tr("Currency")}</span><Select aria-label={tr("Currency")} value={selectedCurrency} onChange={event => setCurrency(event.target.value)}>{currencies.map(value => <option key={value} value={value}>{value}</option>)}</Select></label>}
        </div>
        <p className="statistics-note">{tr("Capacity is scheduled service-provider work time during opening hours. Used capacity is the duration of completed services; past periods use today's schedule.")}</p>
        {query.isLoading ? <Loading/> : query.error ? <ErrorState error={query.error}/> : <>
            <div className="statistics-cards">{metrics.map(item => <button key={item.key} className={`statistics-card ${metric === item.key ? 'active' : ''}`} onClick={() => setMetric(item.key)}><span>{item.label}</span><strong>{item.value}</strong></button>)}</div>
            {metric === 'revenue' && currencies.length > 1 && <div className="statistics-currency-note">{tr("Revenue is shown separately by currency.")}</div>}
            <div className="statistics-chart-scroll"><div className="statistics-chart">
                <div className="statistics-y-axis" aria-hidden="true">{axisValues.map((value, index) => <span key={index}>{formatAxisValue(value)}</span>)}</div>
                <div className="statistics-columns" style={{minWidth: `${Math.max(100, points.length * 58)}px`}}>
                {points.map((point, index) => {
                    const value = metricValues[index];
                    const height = Math.max(value > 0 ? 3 : 0, Math.min(value, maxValue) / maxValue * 100);
                    return <div className="statistics-column" key={point.period_start} title={`${formatPeriod(point.period_start)}: ${metric === 'revenue' && selectedCurrency ? money(value, selectedCurrency) : metric === 'utilization' ? `${value.toFixed(1)}%` : metric === 'capacity' ? formatHours(value) : new Intl.NumberFormat(localeTag()).format(value)}`}>
                        <div className="statistics-bar-area">
                            {metric === 'capacity' ? <>
                                <span className="statistics-bar capacity" title={`${formatPeriod(point.period_start)} — ${tr("Available capacity")}: ${formatHours(point.capacity)}`} style={{height: `${Math.max(point.capacity > 0 ? 3 : 0, Math.min(point.capacity, maxValue) / maxValue * 100)}%`}}/>
                                <span className="statistics-bar used" title={`${formatPeriod(point.period_start)} — ${tr("Used capacity")}: ${formatHours(point.used_capacity)}`} style={{height: `${Math.max(point.used_capacity > 0 ? 3 : 0, Math.min(point.used_capacity, maxValue) / maxValue * 100)}%`}}/>
                            </> : <span className={`statistics-bar ${metric}`} style={{height: `${height}%`}}/>}
                        </div>
                        <small>{formatPeriod(point.period_start)}</small>
                    </div>;
                })}
                {!points.length && <Empty title={tr("No records match the selected criteria.")}/>}
                </div>
            </div></div>
            {metric === 'capacity' && <div className="statistics-legend"><span><i className="capacity"/> {tr("Available capacity")}</span><span><i className="used"/> {tr("Used capacity")}</span></div>}
        </>}
    </div>;
}
