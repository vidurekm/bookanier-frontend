import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orgApi } from '../lib/api';
import { formatDateTime, formatDateTimeRange, money, statusLabel, statusTone } from '../lib/utils';
import { tr } from '../lib/translations';
import { Badge, ErrorState, Loading } from './UI';
import { BookingStatusActions } from './BookingManagement';
import { getSetup } from '../lib/setup';

export function ReservationDetail({ org, id, canManage, onClose }: {
    org: number;
    id: number;
    canManage: boolean;
    onClose: () => void;
}) {
    const qc = useQueryClient();
    const setup = useQuery({ queryKey: ['setup', org], queryFn: () => getSetup(org) });
    const { data, isLoading, error } = useQuery({ queryKey: ['reservation', org, id], queryFn: () => orgApi<{
        reservation: Record<string, unknown>;
        items: Record<string, unknown>[];
        canManage?: boolean;
        resourcesEnabled?: boolean;
    }>(org, `/reservations/${id}`) });
    if (isLoading) return <Loading />;
    if (error) return <ErrorState error={error}/>;
    const reservation = data?.reservation;
    const canManageReservation = canManage && data?.canManage === true;
    const first = data?.items[0];
    const assignedResources = (data?.items || []).flatMap(item =>
        Array.isArray(item.resources) ? item.resources.filter((name): name is string => typeof name === 'string') : []);
    const resourceNames = [...new Set(assignedResources)].join(', ');
    const invalidateBooking = async () => {
        await Promise.all([
            qc.invalidateQueries({ queryKey: ['reservation', org, id], refetchType: 'active' }),
            qc.invalidateQueries({ queryKey: ['reservations', org], refetchType: 'active' }),
            qc.invalidateQueries({ queryKey: ['calendar', org], refetchType: 'active' }),
        ]);
    };

    return <div className="stack">
        <div className="detail-summary">
            <div><small>{tr("Customer name")}</small><strong>{String(reservation?.customer_name || '—')}</strong></div>
            <div><small>{tr("Status")}</small><Badge tone={statusTone(String(reservation?.status || ''))}>{statusLabel(String(reservation?.status || ''))}</Badge></div>
            {first && <div><small>{tr("Service")}</small><strong>{String(first.service_name || '—')}</strong></div>}
            {first && <div><small>{tr("Location")}</small><strong>{String(first.location_name || '—')}</strong></div>}
            {first && <div><small>{tr("Date and time")}</small><strong>{formatDateTimeRange(String(first.starts_at), String(first.ends_at))}</strong></div>}
            {first && <div><small>{tr("Workers")}</small><strong>{String(first.member_name || '—')}</strong></div>}
            {first && setup.data?.settings.trackResources === true && first.can_assign_resource === true && <div><small>{tr("Resource")}</small><strong>{resourceNames || '—'}</strong></div>}
            <div><small>{tr("Email")}</small><strong>{String(reservation?.customer_email || '—')}</strong></div>
            <div><small>{tr("Phone")}</small><strong>{String(reservation?.customer_phone || '—')}</strong></div>
            <div><small>{tr("Amount")}</small><strong>{money(Number(reservation?.total_amount || 0), String(reservation?.currency || 'CZK'))}</strong></div>
            <div><small>{tr("Created")}</small><strong>{reservation?.created_at ? formatDateTime(String(reservation.created_at)) : '—'}</strong></div>
        </div>
        {canManageReservation && <BookingStatusActions org={org} id={id} status={String(reservation?.status || '')}
            item={data?.items.length === 1 ? data.items[0] : undefined}
            canMarkNoShow={data?.items.some(item => Date.parse(String(item.starts_at)) <= Date.now()) === true}
            onChanged={invalidateBooking} onActionComplete={onClose}/>}
    </div>;
}
