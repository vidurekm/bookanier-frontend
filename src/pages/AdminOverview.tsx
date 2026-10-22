import { tr, translateWith } from '../lib/translations';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, Plus, TrendingUp, UsersRound } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { locations, reservations, members } from '../lib/api';
import { getSetup } from '../lib/setup';
import { eventOccurrences } from '../lib/events';
import { st } from '../lib/setupTranslations';
import { myAccess } from '../lib/access';
import { formatDateTime, money, statusLabel } from '../lib/utils';
import { Badge, Card, Empty, ErrorState, Loading, PageTitle } from '../components/UI';

export function AdminOverview() {
    const { orgId, org } = useAdmin();
    const access = useQuery({ queryKey: ['access', orgId], queryFn: () => myAccess(orgId), retry: false });
    const canWrite = access.data?.canWrite === true;
    const hasMember = access.data?.ownMemberId != null;
    const setupQuery = useQuery({ queryKey: ['setup', orgId], queryFn: () => getSetup(orgId) });
    const model = setupQuery.data?.booking_model;
    const bookings = useQuery({ queryKey: ['reservations', orgId, 'overview'], queryFn: () => reservations(orgId, { size: 8 }) });
    const locs = useQuery({ queryKey: ['locations', orgId], queryFn: () => locations(orgId), enabled: canWrite });
    const team = useQuery({ queryKey: ['members', orgId], queryFn: () => members(orgId), retry: false, enabled: canWrite });
    const events = useQuery({
        queryKey: ['event-occurrences', orgId],
        queryFn: () => eventOccurrences(orgId),
        enabled: canWrite && model === 'EVENT'
    });
    const total = bookings.data?.totalElements || 0;
    const confirmed = bookings.data?.items.filter(b => b.status === 'confirmed').length || 0;

    if (model === 'EVENT') {
        return <>
            <PageTitle eyebrow="BOOKANEAR" title={tr('Hello 👋')} description={org?.name}
                action={canWrite ? <Link className="btn btn-primary" to="/admin/events"><CalendarDays size={17}/>{st('Classes and sessions')}</Link> : undefined}/>
            {access.error && <ErrorState error={access.error}/>}
            {canWrite && <div className="stats-grid">
                <Stat icon={CalendarDays} label={st('Classes and sessions')} value={events.data?.length || 0} sub={st('Group events')} color="mint" to="/admin/events"/>
                <Stat icon={UsersRound} label={st('Registered attendees')} value={events.data?.reduce((sum, e) => sum + Number(e.reserved), 0) || 0} sub={st('Obsazenost')} color="blue" to="/admin/events"/>
                <Stat icon={MapPin} label={st('Locations')} value={locs.data?.totalElements || 0} sub={st('Locations')} color="sand" to="/admin/locations"/>
                <Stat icon={UsersRound} label={st('Team')} value={team.data?.totalElements || 0} sub={st('Team')} color="lavender" to="/admin/team"/>
            </div>}
            <div className="overview-grid">
                {canWrite && <Card><h3>{st('Classes and sessions')}</h3>{events.data?.slice(0, 8).map(e => <p key={e.id}><strong>{e.title}</strong> · {formatDateTime(e.starts_at)} · {e.reserved}/{e.capacity}</p>)}<Link to="/admin/events">{st('Continue')} →</Link></Card>}
                <QuickStart canWrite={canWrite} canManageBookings={access.data?.canManageBookings === true} hasMember={hasMember} model={model}/>
            </div>
        </>;
    }

    return <>
        <PageTitle eyebrow={tr("YOUR WORKSPACE")} title={tr("Hello 👋")} description={translateWith('Welcome to {organization}\'s admin area. Here\'s an overview of what matters most.', { organization: org?.name || tr('your organization') })} action={<Link className="btn btn-primary" to="/admin/reservations"><CalendarDays size={17}/>{tr("Bookings ")}<ArrowRight size={16}/></Link>}/>
        {access.error && <ErrorState error={access.error}/>}
        <div className="stats-grid">
            <Stat icon={CalendarDays} label={tr("Total bookings")} value={total} sub={tr("Based on available records")} color="mint" to="/admin/reservations"/>
            <Stat icon={CheckCircle2} label={tr("Confirmed (on page)")} value={confirmed} sub={tr("From recently loaded bookings")} color="blue" to="/admin/reservations"/>
            {canWrite && <>
                <Stat icon={MapPin} label={tr("Locations")} value={locs.data?.totalElements || 0} sub={tr("In organization")} color="sand" to="/admin/locations"/>
                <Stat icon={UsersRound} label={tr("Team members")} value={team.data?.totalElements || 0} sub={tr("In organization")} color="lavender" to="/admin/team"/>
            </>}
        </div>
        <div className="overview-grid">
            <Card><div className="card-heading"><div><span className="eyebrow">{tr("ACTIVITY")}</span><h2>{tr("Recent bookings")}</h2></div><Link to="/admin/reservations" className="text-link">{tr("View all ")}<ArrowRight size={15}/></Link></div>{bookings.isLoading ? <Loading /> : bookings.error ? <ErrorState error={bookings.error}/> : bookings.data?.items.length ? <div className="overview-bookings">{bookings.data.items.map(b => <div className="overview-booking" key={b.id}><div className="booking-avatar">{b.customer_name.charAt(0).toUpperCase()}</div><div className="overview-booking-name"><strong>{b.customer_name}</strong><small>#{b.id} · {formatDateTime(b.created_at)}</small></div><Badge tone={b.status === 'confirmed' ? 'green' : b.status === 'cancelled' ? 'red' : 'orange'}>{statusLabel(b.status)}</Badge><strong>{money(b.total_amount, b.currency)}</strong></div>)}</div> : <Empty title={tr("No bookings yet")} description={tr("New bookings will appear here.")}/>}</Card>
            <div className="overview-side">
                <QuickStart canWrite={canWrite} canManageBookings={access.data?.canManageBookings === true} hasMember={hasMember} model={model}/>
                <Card className="public-link-card"><div className="public-link-icon"><CalendarDays size={22}/></div><h3>{tr("Public booking page")}</h3><p>{tr("Share the link so customers can book themselves.")}</p>{org?.public_id ? <Link className="btn btn-secondary btn-full" to={`/reservations/${org.public_id}`} target="_blank">{tr("Open booking website ")}<ArrowRight size={16}/></Link> : <span className="muted small">{tr("Find the public UUID in organization settings.")}</span>}</Card>
            </div>
        </div>
    </>;
}

function QuickStart({ canWrite, canManageBookings, hasMember, model }: {
    canWrite: boolean;
    canManageBookings: boolean;
    hasMember: boolean;
    model: string | null | undefined;
}) {
    const actions = canWrite
        ? model === 'EVENT'
            ? [
                { to: '/admin/events', icon: CalendarDays, title: st('Classes and sessions'), description: tr('Manage group events') },
                { to: '/admin/locations', icon: MapPin, title: tr('Add location'), description: tr('Addresses and opening hours') },
                { to: '/admin/team', icon: Clock3, title: tr('Plan shifts'), description: tr('Employee working hours') }
            ]
            : [
                { to: '/admin/locations', icon: MapPin, title: tr('Add location'), description: tr('Addresses and opening hours') },
                { to: '/admin/services', icon: Plus, title: tr('Set up services'), description: tr('Prices and booking duration') },
                ...(model === 'APPOINTMENT' ? [{ to: '/admin/team', icon: Clock3, title: tr('Plan shifts'), description: tr('Employee working hours') }] : [])
            ]
        : [
            ...(canManageBookings && model !== 'EVENT'
                ? [{ to: '/admin/reservations', icon: CalendarDays, title: tr('Manage bookings'), description: tr('Customer booking overview') }]
                : []),
            ...(hasMember
                ? [{ to: '/admin/absence-requests', icon: Clock3, title: tr('Request time off'), description: tr('Submit time off or change working hours') }]
                : [])
        ];

    if (!actions.length) return null;
    return <Card><div className="card-heading"><div><span className="eyebrow">{tr("QUICK START")}</span><h2>{tr("Start here")}</h2></div><TrendingUp size={19}/></div><div className="quick-links">{actions.map(action => <Link to={action.to} key={action.to}><span><action.icon size={19}/></span><div><strong>{action.title}</strong><small>{action.description}</small></div><ArrowRight size={17}/></Link>)}</div></Card>;
}

function Stat({ icon: Icon, label, value, sub, color, to }: {
    icon: typeof CalendarDays;
    label: string;
    value: number;
    sub: string;
    color: string;
    to: string;
}) { return <Link className="stat-card-link" to={to} aria-label={`${label} – otevřít přehled`}><Card className="stat-card"><div className={`stat-icon stat-${color}`}><Icon size={21}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></Card></Link>; }
