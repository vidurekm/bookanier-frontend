import { localeTag } from '../lib/preferences';
import { tr } from '../lib/translations';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock3, Eye, ListFilter, RefreshCw, UserX } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { list, locations, orgApi, resources } from '../lib/api';
import type { Member, Reservation, Resource } from '../lib/types';
import { addDays, formatDate, formatDateTime, money, statusLabel, today } from '../lib/utils';
import { Badge, Card, Empty, ErrorState, Loading, Modal, PageTitle, Pager, SearchBox, Select, Button } from '../components/UI';
import { CreateTeamBooking, BookingStatusActions, MoveTeamBooking } from '../components/BookingManagement';
import { myAccess } from '../lib/access';
import { useQueryClient } from '@tanstack/react-query';
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
export function AdminReservations() {
    const { orgId, org } = useAdmin();
    const access = useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
    const [creating,setCreating] = useState(false);
    const [view, setView] = useState<'calendar' | 'list' | 'statistics'>('calendar');
    const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
    const [calendarFiltersOpen, setCalendarFiltersOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [q, setQ] = useState('');
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
    const members = useQuery({ queryKey: ['reservation-filter-members', orgId], queryFn: async () => {
        const result: Member[] = [];
        let pageIndex = 0;
        let totalPages = 1;
        while (pageIndex < totalPages) {
            const pageResult = await list<Member>(orgId, '/members', { page: pageIndex, size: 100 });
            result.push(...pageResult.items);
            totalPages = pageResult.totalPages;
            pageIndex++;
        }
        return result.filter(member => member.active);
    }, enabled: (view === 'list' || view === 'calendar') && access.data?.canWrite === true });
    const trackResources = setup.data?.settings.trackResources === true;
    const resourceOptions = useQuery({ queryKey: ['reservation-filter-resources', orgId, selectedLocation], queryFn: async () => {
        const locationsToLoad = selectedLocation
            ? locs.data?.items.filter(item => item.id === selectedLocation) || []
            : locs.data?.items || [];
        const byLocation = await Promise.all(locationsToLoad.map(item => resources(orgId, item.id)));
        return byLocation.flat().filter(resource => resource.active && resource.category !== 'staff');
    }, enabled: (view === 'list' || view === 'calendar') && trackResources && !!locs.data });
    const bookings = useQuery({ queryKey: ['reservations', orgId, page, q, status, selectedLocation, memberId, resourceId], queryFn: () => list<Reservation & { appointment_at?: string; appointment_ends_at?: string }>(orgId, '/reservations', { page, size: 12, q, status, locationId: selectedLocation || undefined, memberId: memberId || undefined, resourceId: resourceId || undefined }), enabled: view === 'list' });
    const monthStart = `${start.slice(0, 7)}-01`;
    const nextMonth = (() => { const date = new Date(`${monthStart}T12:00:00`); date.setMonth(date.getMonth() + 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`; })();
    const calendarFrom = calendarView === 'month' ? monthStart : start;
    const calendarTo = calendarView === 'month' ? nextMonth : addDays(start, calendarView === 'day' ? 1 : 7);
    const calendar = useQuery({ queryKey: ['calendar', orgId, calendarFrom, calendarTo, selectedLocation, status, memberId, resourceId], queryFn: () => {
        const params = new URLSearchParams({ from: calendarFrom, to: calendarTo });
        if (selectedLocation) params.set('locationId', String(selectedLocation));
        if (status) params.set('status', status);
        if (memberId) params.set('memberId', String(memberId));
        if (resourceId) params.set('resourceId', String(resourceId));
        return orgApi<CalendarEvent[]>(orgId, `/calendar?${params.toString()}`);
    }, enabled: view === 'calendar' });
    const monthOffset = (new Date(`${monthStart}T12:00:00`).getDay() + 6) % 7;
    const daysInMonth = new Date(new Date(`${monthStart}T12:00:00`).getFullYear(), new Date(`${monthStart}T12:00:00`).getMonth() + 1, 0).getDate();
    const monthCells: (string | null)[] = [...Array(monthOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => addDays(monthStart, index))];
    while (monthCells.length % 7) monthCells.push(null);
    const calendarDates: (string | null)[] = calendarView === 'month' ? monthCells : Array.from({ length: calendarView === 'day' ? 1 : 7 }, (_, index) => addDays(start, index));
    const calendarHeading = calendarView === 'month'
        ? new Intl.DateTimeFormat(localeTag(), { month: 'long', year: 'numeric' }).format(new Date(`${monthStart}T12:00:00`))
        : calendarView === 'day' ? formatDate(start) : `${formatDate(start)} – ${formatDate(addDays(start, 6))}`;
    const shiftCalendar = (direction: number) => {
        if (calendarView === 'month') {
            const date = new Date(`${monthStart}T12:00:00`);
            date.setMonth(date.getMonth() + direction);
            setStart(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
        } else setStart(addDays(start, direction * (calendarView === 'day' ? 1 : 7)));
    };
    return <>
        <PageTitle eyebrow={tr("BOOKING CENTER")} title={tr("Bookings")} description={tr("Overview of appointments, customers, and booking statuses.")} action={<div style={{display:'flex',alignItems:'center',gap:12}}>{(access.data?.canManageBookings||access.data?.canManageOwnBookings)&&<Button onClick={()=>setCreating(true)}>{tr('New booking')}</Button>}<div className="view-switch"><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarDays size={16}/>{tr("Calendar")}</button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><ListFilter size={16}/>{tr("List")}</button><button className={view === 'statistics' ? 'active' : ''} onClick={() => setView('statistics')}><BarChart3 size={16}/>{tr("Statistics")}</button></div></div>}/>
        <Card>
            <div className="table-toolbar">
                <div className="filters-left">
                    {view === 'list' && <SearchBox value={q} onChange={value => { setQ(value); setPage(0); }} placeholder={tr("Customer name or email")}/>}
                    {activeLocations.length > 1 && <Select aria-label={tr("Filter location")} value={selectedLocation} onChange={e => { setLocation(Number(e.target.value)); setResourceId(null); setPage(0); }}><option value={0}>{tr("All locations")}</option>{locs.data?.items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>}
                    {view === 'list' && <Select aria-label={tr("Booking status")} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">{tr("All statuses")}</option><option value="confirmed">{tr("Confirmed")}</option><option value="pending">{tr("Pending")}</option><option value="completed">{tr("Completed")}</option><option value="cancelled">{tr("Cancelled")}</option><option value="no_show">{tr("No-show")}</option></Select>}
                    {view === 'list' && access.data?.canWrite && <Select aria-label={tr("Filter worker")} value={memberId ?? ''} onChange={e => { setMemberId(Number(e.target.value) || null); setPage(0); }}><option value="">{tr("All workers")}</option>{members.data?.map(member => <option key={member.id} value={member.id}>{member.display_name}</option>)}</Select>}
                    {view === 'list' && trackResources && <Select aria-label={tr("Filter resource")} value={resourceId ?? ''} onChange={e => { setResourceId(Number(e.target.value) || null); setPage(0); }}><option value="">{tr("All resources")}</option>{resourceOptions.data?.map((resource: Resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</Select>}
                </div>
                {view === 'calendar' && <div className="calendar-nav"><div className="view-switch calendar-period-switch"><button className={calendarView === 'day' ? 'active' : ''} onClick={() => setCalendarView('day')}>{tr("Day")}</button><button className={calendarView === 'week' ? 'active' : ''} onClick={() => setCalendarView('week')}>{tr("Week")}</button><button className={calendarView === 'month' ? 'active' : ''} onClick={() => setCalendarView('month')}>{tr("Month")}</button></div><button aria-label={tr("Previous period")} onClick={() => shiftCalendar(-1)}><ChevronLeft size={18}/></button><strong>{calendarHeading}</strong><button aria-label={tr("Next period")} onClick={() => shiftCalendar(1)}><ChevronRight size={18}/></button><button title={tr("Today")} aria-label={tr("Today")} onClick={() => setStart(today())}><RefreshCw size={16}/></button><button className={`calendar-filter-toggle ${calendarFiltersOpen ? 'active' : ''}`} title={tr("Filter reservations")} aria-label={tr("Filter reservations")} aria-expanded={calendarFiltersOpen} onClick={() => setCalendarFiltersOpen(open => !open)}><ListFilter size={17}/>{(status || memberId || resourceId) && <i/>}</button></div>}
            </div>
            {view === 'calendar' && calendarFiltersOpen && <div className="calendar-filter-panel">
                <Select aria-label={tr("Booking status")} value={status} onChange={e => setStatus(e.target.value)}><option value="">{tr("All statuses")}</option><option value="confirmed">{tr("Confirmed")}</option><option value="pending">{tr("Pending")}</option><option value="completed">{tr("Completed")}</option><option value="cancelled">{tr("Cancelled")}</option><option value="no_show">{tr("No-show")}</option></Select>
                {access.data?.canWrite && <Select aria-label={tr("Filter worker")} value={memberId ?? ''} onChange={e => setMemberId(Number(e.target.value) || null)}><option value="">{tr("All workers")}</option>{members.data?.map(member => <option key={member.id} value={member.id}>{member.display_name}</option>)}</Select>}
                {trackResources && <Select aria-label={tr("Filter resource")} value={resourceId ?? ''} onChange={e => setResourceId(Number(e.target.value) || null)}><option value="">{tr("All resources")}</option>{resourceOptions.data?.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</Select>}
            </div>}
            {view === 'list' && members.error && access.data?.canWrite && <ErrorState error={members.error}/>}
            {view === 'list' && resourceOptions.error && <ErrorState error={resourceOptions.error}/>}
            {view === 'calendar' && members.error && access.data?.canWrite && <ErrorState error={members.error}/>}
            {view === 'calendar' && resourceOptions.error && <ErrorState error={resourceOptions.error}/>}
            {view === 'list' ? bookings.isLoading ? <Loading /> : bookings.error ? <ErrorState error={bookings.error}/> : !bookings.data?.items.length ? q.trim() || status || memberId || resourceId || (activeLocations.length > 1 && selectedLocation > 0) ? <Empty title={tr("No records match the selected criteria.")}/> : <Empty title={tr("No bookings")} description={tr("Change the filters or wait for new bookings.")}/> : <><div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Date and time")}</th><th>{tr("Customer")}</th><th>{tr("Worker")}</th>{trackResources && <th>{tr("Resource")}</th>}<th>{tr("Status")}</th><th>{tr("Amount")}</th><th /></tr></thead><tbody>{bookings.data.items.map(booking => <tr key={booking.id}><td>{booking.appointment_at ? <>{formatDateTime(booking.appointment_at)}{booking.appointment_ends_at && <> – {formatDateTime(booking.appointment_ends_at)}</>}</> : '—'}</td><td>{booking.customer_name}</td><td>{booking.member_name || '—'}</td>{trackResources && <td>{booking.resource_name || '—'}</td>}<td><Badge tone={booking.status === 'confirmed' ? 'green' : booking.status === 'cancelled' ? 'red' : 'orange'}>{statusLabel(booking.status)}</Badge></td><td><strong>{money(booking.total_amount, booking.currency)}</strong></td><td><button className="icon-button" title={tr("Details")} onClick={() => setSelected(booking.id)}><Eye size={17}/></button></td></tr>)}</tbody></table></div><Pager page={page} totalPages={bookings.data.totalPages} onChange={setPage}/></> : view === 'calendar' ? calendar.isLoading ? <Loading /> : calendar.error ? <ErrorState error={calendar.error}/> : <ReservationCalendarGrid dates={calendarDates} events={calendar.data || []} mode={calendarView} showResources={trackResources} onSelect={setSelected}/> : <ReservationStatistics orgId={orgId} locationId={selectedLocation || undefined}/>}
        </Card>
        {selected !== null && <Modal title={tr("Booking details")} onClose={() => setSelected(null)}><ReservationDetail org={orgId} id={selected} canManage={access.data?.canManageBookings===true||access.data?.canManageOwnBookings===true}/></Modal>}
        {creating&&org?.public_id&&<Modal wide title={tr("New booking")} onClose={()=>setCreating(false)}><CreateTeamBooking org={orgId} publicId={org.public_id} ownMemberId={access.data?.canManageOwnBookings&&!access.data?.canManageBookings?access.data.ownMemberId??undefined:undefined} excludeMemberId={access.data?.canManageBookings&&!access.data?.canWrite?access.data.ownMemberId??undefined:undefined} onComplete={()=>setCreating(false)}/></Modal>}
    </>;
}
function ReservationCalendarGrid({ dates, events, mode, showResources, onSelect }: {
    dates: (string | null)[];
    events: CalendarEvent[];
    mode: 'day' | 'week' | 'month';
    showResources: boolean;
    onSelect: (reservationId: number) => void;
}) {
    const weekday = new Intl.DateTimeFormat(localeTag(), { weekday: 'short' });
    const weekdays = Array.from({ length: 7 }, (_, index) => weekday.format(new Date(addDays('2024-01-01', index) + 'T12:00:00')));
    return <div className={`week-calendar calendar-${mode}-view`}>
        {mode === 'month' && weekdays.map((name, index) => <div className="calendar-weekday" key={index}>{name}</div>)}
        {dates.map((date, index) => {
            if (!date) return <div className="calendar-day calendar-day-blank" key={`blank-${index}`} />;
            const dayEvents = events.filter(event => event.local_date === date);
            return <div key={date} className="calendar-day">
                <div className="calendar-day-heading">
                    {mode !== 'month' && <span>{weekday.format(new Date(`${date}T12:00:00`))}</span>}
                    <strong>{mode === 'month' ? Number(date.slice(-2)) : `${date.slice(-2)}.`}</strong>
                </div>
                {dayEvents.length ? dayEvents.map(event => <button className="calendar-event" key={event.item_id} title={event.customer_name} onClick={() => onSelect(event.reservation_id)}>
                    <span className="calendar-event-heading"><strong className="calendar-event-customer">{event.customer_name}</strong><span className={`calendar-event-status status-${event.status}`} title={statusLabel(event.status)} aria-label={statusLabel(event.status)}>{event.status === 'cancelled' ? <CircleX size={14}/> : event.status === 'no_show' ? <UserX size={14}/> : event.status === 'pending' ? <Clock3 size={14}/> : <CircleCheck size={14}/>}</span></span>
                    <span>{new Intl.DateTimeFormat(localeTag(), { hour: '2-digit', minute: '2-digit', timeZone: event.location_timezone }).format(new Date(event.starts_at))} – {new Intl.DateTimeFormat(localeTag(), { hour: '2-digit', minute: '2-digit', timeZone: event.location_timezone }).format(new Date(event.ends_at))}</span>
                    <small>{event.service_name}</small>
                    <small className="calendar-event-worker">{event.member_name || '—'}</small>
                    {showResources && event.resource_name && <small className="calendar-event-resource">{event.resource_name}</small>}
                </button>) : <div className="calendar-empty">—</div>}
            </div>;
        })}
    </div>;
}

function ReservationStatistics({ orgId, locationId }: { orgId: number; locationId?: number }) {
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
    const [customGroupBy, setCustomGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');
    const [metric, setMetric] = useState<'reservations' | 'capacity' | 'utilization' | 'revenue'>('reservations');
    const currentDate = today();
    const currentYear = Number(currentDate.slice(0, 4));
    const earliestYear = currentYear - 9;
    const [selectedDay, setSelectedDay] = useState(currentDate);
    const [selectedMonth, setSelectedMonth] = useState(currentDate.slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [yearFrom, setYearFrom] = useState(currentYear - 4);
    const [yearTo, setYearTo] = useState(currentYear);
    const [from, setFrom] = useState(() => addDays(currentDate, -29));
    const [to, setTo] = useState(currentDate);
    const [currency, setCurrency] = useState('');
    const apiGroupBy = groupBy === 'custom' ? customGroupBy : groupBy;
    const monthStart = `${selectedMonth}-01`;
    const monthEnd = `${selectedMonth}-${String(new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate()).padStart(2, '0')}`;
    const queryFrom = groupBy === 'day' ? selectedDay
        : groupBy === 'week' ? monthStart
        : groupBy === 'month' ? `${selectedYear}-01-01`
        : groupBy === 'year' ? `${yearFrom}-01-01` : from;
    const queryTo = groupBy === 'day' ? selectedDay
        : groupBy === 'week' ? monthEnd
        : groupBy === 'month' ? `${selectedYear}-12-31`
        : groupBy === 'year' ? `${yearTo}-12-31` : to;
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
        if (apiGroupBy === 'year') return new Intl.DateTimeFormat(localeTag(), { year: 'numeric' }).format(date);
        if (apiGroupBy === 'month') return new Intl.DateTimeFormat(localeTag(), { month: 'short', year: '2-digit' }).format(date);
        return new Intl.DateTimeFormat(localeTag(), { day: 'numeric', month: 'short', ...(apiGroupBy === 'week' ? { year: '2-digit' } : {}) }).format(date);
    };
    const metrics = [
        { key: 'reservations', label: tr("Completed bookings"), value: new Intl.NumberFormat(localeTag()).format(totalReservations) },
        { key: 'capacity', label: tr("Available work time"), value: formatHours(totalCapacityMinutes) },
        { key: 'utilization', label: tr("Capacity utilization"), value: `${utilization.toFixed(1)}%` },
        { key: 'revenue', label: tr("Revenue"), value: selectedCurrency ? money(totalRevenue, selectedCurrency) : '—' },
    ] as const;
    return <div className="statistics-panel">
        <div className="statistics-toolbar">
            <label>{tr("Statistics period")}<Select aria-label={tr("Statistics period")} value={groupBy} onChange={event => setGroupBy(event.target.value as typeof groupBy)}>
                <option value="day">{tr("Day")}</option><option value="week">{tr("Week")}</option><option value="month">{tr("Month")}</option><option value="year">{tr("Year")}</option><option value="custom">{tr("Custom period")}</option>
            </Select></label>
            {groupBy === 'day' && <label>{tr("Date")}<input type="date" value={selectedDay} onChange={event => setSelectedDay(event.target.value)}/></label>}
            {groupBy === 'week' && <label>{tr("Month")}<input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)}/></label>}
            {groupBy === 'month' && <label>{tr("Year")}<input type="number" min={earliestYear} max={currentYear} value={selectedYear} onChange={event => setSelectedYear(Number(event.target.value))}/></label>}
            {groupBy === 'year' && <>
                <label>{tr("From year")}<input type="number" min={earliestYear} max={yearTo} value={yearFrom} onChange={event => setYearFrom(Number(event.target.value))}/></label>
                <label>{tr("To year")}<input type="number" min={yearFrom} max={currentYear} value={yearTo} onChange={event => setYearTo(Number(event.target.value))}/></label>
            </>}
            {groupBy === 'custom' && <>
                <label>{tr("From")}<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label>
                <label>{tr("To")}<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label>
                <label>{tr("Group by")}<Select aria-label={tr("Group by")} value={customGroupBy} onChange={event => setCustomGroupBy(event.target.value as typeof customGroupBy)}>
                    <option value="day">{tr("Day")}</option><option value="week">{tr("Week")}</option><option value="month">{tr("Month")}</option><option value="year">{tr("Year")}</option>
                </Select></label>
            </>}
            {metric === 'revenue' && currencies.length > 1 && <label>{tr("Currency")}<Select aria-label={tr("Currency")} value={selectedCurrency} onChange={event => setCurrency(event.target.value)}>{currencies.map(value => <option key={value} value={value}>{value}</option>)}</Select></label>}
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

function ReservationDetail({ org, id, canManage }: {
    org: number;
    id: number;
    canManage: boolean;
}) {
    const qc=useQueryClient();
    const { data, isLoading, error } = useQuery({ queryKey: ['reservation', org, id], queryFn: () => orgApi<{
        reservation: Record<string, unknown>;
        items: Record<string, unknown>[];
        canManage?: boolean;
    }>(org, `/reservations/${id}`) });
    if (isLoading) return <Loading />;
    if (error) return <ErrorState error={error}/>;
    const r = data?.reservation;
    const canManageReservation = canManage && data?.canManage === true;
    const invalidateBooking = async () => {
        await Promise.all([
            qc.invalidateQueries({queryKey:['reservation',org,id], refetchType:'active'}),
            qc.invalidateQueries({queryKey:['reservations',org], refetchType:'active'}),
            qc.invalidateQueries({queryKey:['calendar',org], refetchType:'active'}),
        ]);
    };
    return <div className="stack">
        <div className="detail-summary">
            <div><small>{tr("Customer name")}</small><strong>{String(r?.customer_name || '—')}</strong></div>
            <div><small>{tr("Status")}</small><Badge tone={r?.status === 'confirmed' ? 'green' : 'orange'}>{statusLabel(String(r?.status || ''))}</Badge></div>
            <div><small>{tr("Email")}</small><strong>{String(r?.customer_email || '—')}</strong></div>
            <div><small>{tr("Phone")}</small><strong>{String(r?.customer_phone || '—')}</strong></div>
            <div><small>{tr("Amount")}</small><strong>{money(Number(r?.total_amount || 0), String(r?.currency || 'CZK'))}</strong></div>
            <div><small>{tr("Created")}</small><strong>{r?.created_at ? formatDateTime(String(r.created_at)) : '—'}</strong></div>
        </div>
        <h3>{tr("Booking items")}</h3>
        {data?.items.map((item, i) => <div key={i} className="detail-item">
            <strong>{String(item.service_name || '—')}</strong>
            <span>{formatDateTime(String(item.starts_at))} – {formatDateTime(String(item.ends_at))}</span>
        </div>)}
        {canManageReservation&&data?.items.length===1&&data.items[0]?.member_id!=null&&r?.status==='confirmed'&&
            <MoveTeamBooking org={org} id={id} item={data.items[0]} onChanged={invalidateBooking}/>}
        {canManageReservation&&<BookingStatusActions org={org} id={id} status={String(r?.status||'')} onChanged={invalidateBooking}/>}
    </div>;
}
