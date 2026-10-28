import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Eye, Mail, Phone } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { list, orgApi } from '../lib/api';
import type { BookingCustomer, BookingCustomerReservation } from '../lib/types';
import { Card, Empty, ErrorState, Loading, Modal, PageTitle, Pager, SearchBox, SortableHeader } from '../components/UI';
import { tr } from '../lib/translations';
import { formatDateTime, formatDateTimeRange, nameInitials, statusLabel } from '../lib/utils';

export function AdminBookingCustomers() {
    const { orgId } = useAdmin();
    const [page, setPage] = useState(0);
    const [q, setQ] = useState('');
    const [sortField, setSortField] = useState('lastReservationAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const changeSort = (field: string) => {
        setSortDirection(current => field === sortField ? (current === 'asc' ? 'desc' : 'asc') : (field === 'name' || field === 'email' ? 'asc' : 'desc'));
        setSortField(field);
        setPage(0);
    };
    const [selectedCustomer, setSelectedCustomer] = useState<BookingCustomer | null>(null);
    const { data, isLoading, error } = useQuery({
        queryKey: ['booking-customers', orgId, page, q, sortField, sortDirection],
        queryFn: () => list<BookingCustomer>(orgId, '/booking-customers', {
            page, size: 12, q, sort: `${sortField},${sortDirection}`
        })
    });
    const { data: history, isLoading: historyLoading, error: historyError } = useQuery({
        queryKey: ['booking-customer-reservations', orgId, selectedCustomer?.id],
        queryFn: () => orgApi<BookingCustomerReservation[]>(
            orgId, `/booking-customers/${selectedCustomer?.id}/reservations`
        ),
        enabled: selectedCustomer !== null
    });

    return <>
        <PageTitle eyebrow={tr('CUSTOMER DATABASE')} title={tr('Reservation customers')}
            description={tr('Customers are grouped by normalized email. Reservations without an email remain separate.')} />
        <Card>
            <div className="table-toolbar">
                <SearchBox value={q} onChange={value => { setQ(value); setPage(0); }}
                    placeholder={tr('Search name, email or phone')}/>

            </div>
            {isLoading ? <Loading/> : error ? <ErrorState error={error}/> : !data?.items.length
                ? q.trim()
                    ? <Empty title={tr('No records match the selected criteria.')}/>
                    : <Empty title={tr('No reservation customers yet')}
                        description={tr('Customers with reservations will appear here.')}/>
                : <div className="table-scroll"><table className="data-table">
                    <thead><tr>
                        <SortableHeader label={tr('Customer')} active={sortField === 'name'} direction={sortDirection} onClick={() => changeSort('name')}/>
                        <SortableHeader label={tr('Email')} active={sortField === 'email'} direction={sortDirection} onClick={() => changeSort('email')}/>
                        <SortableHeader label={tr('Phone')} active={sortField === 'phone'} direction={sortDirection} onClick={() => changeSort('phone')}/>
                        <SortableHeader label={tr('Reservations')} active={sortField === 'reservationCount'} direction={sortDirection} onClick={() => changeSort('reservationCount')}/>
                        <SortableHeader label={tr('Last reservation')} active={sortField === 'lastReservationAt'} direction={sortDirection} onClick={() => changeSort('lastReservationAt')}/>
                        <th/>
                    </tr></thead>
                    <tbody>{data.items.map(customer => <tr key={customer.id}>
                        <td><div className="cell-name"><span className="cell-icon" aria-hidden="true">{nameInitials(customer.name)}</span>
                            <strong>{customer.name}</strong></div></td>
                        <td>{customer.email ? <span className="cell-inline"><Mail size={14}/>{customer.email}</span> : '—'}</td>
                        <td>{customer.phone ? <span className="cell-inline"><Phone size={14}/>{customer.phone}</span> : '—'}</td>
                        <td>{customer.reservation_count}</td>
                        <td>{new Date(customer.last_reservation_at).toLocaleDateString()}</td>
                        <td><button className="icon-button" title={tr('View reservations')}
                            aria-label={tr('View reservations')} onClick={() => setSelectedCustomer(customer)}>
                            <Eye size={17}/></button></td>
                    </tr>)}</tbody>
                </table></div>}
            <Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/>
        </Card>
        {selectedCustomer && <Modal title={selectedCustomer.name} onClose={() => setSelectedCustomer(null)}>
            <div className="stack">
                <div className="cell-inline"><Mail size={14}/>{selectedCustomer.email || tr('No email')}</div>
                {selectedCustomer.phone && <div className="cell-inline"><Phone size={14}/>{selectedCustomer.phone}</div>}
                <h3 className="cell-inline"><CalendarDays size={18}/>{tr('Reservations')}</h3>
                {historyLoading ? <Loading/> : historyError ? <ErrorState error={historyError}/> : !history?.length
                    ? <Empty title={tr('No reservations')}/>
                    : <div className="table-scroll"><table className="data-table">
                        <thead><tr><th>{tr('Date')}</th><th>{tr('Status')}</th><th>{tr('Amount')}</th></tr></thead>
                        <tbody>{history.map(reservation => <tr key={reservation.id}>
                            <td>{reservation.appointment_at
                                ? reservation.appointment_ends_at
                                    ? formatDateTimeRange(reservation.appointment_at, reservation.appointment_ends_at)
                                    : formatDateTime(reservation.appointment_at)
                                : formatDateTime(reservation.created_at)}</td>
                            <td>{statusLabel(reservation.status)}</td>
                            <td>{reservation.total_amount} {reservation.currency}</td>
                        </tr>)}</tbody>
                    </table></div>}
            </div>
        </Modal>}
    </>;
}
