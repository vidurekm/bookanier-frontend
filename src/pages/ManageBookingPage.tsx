import { safeErrorMessage } from '../lib/errors';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { cancelReservation, publicReservation } from '../lib/api';
import { money, statusLabel, statusTone } from '../lib/utils';
import { Badge, Button, Card, ErrorState, Loading, Notice } from '../components/UI';
import { useConfirm } from '../contexts/ConfirmContext';
export function ManageBookingPage() {
    const confirm = useConfirm();
    const { token = '' } = useParams();
    const qc = useQueryClient();
    const [error, setError] = useState('');
    const { data, isLoading, error: queryError } = useQuery({ queryKey: ['manage', token], queryFn: () => publicReservation(token), retry: false });
    const cancel = useMutation({ mutationFn: () => cancelReservation(token), onSuccess: () => { setError(tr("")); qc.invalidateQueries({ queryKey: ['manage', token] }); }, onError: e => setError(safeErrorMessage(e)) });
    return <div className="manage-page"><header className="booking-header container"><BrandLogo/><Link to="/"><ArrowLeft size={16}/>{tr("Back")}</Link><LanguageSelect compact/></header><main className="manage-main"><div className="manage-icon"><ShieldCheck size={30}/></div><h1>{tr("Manage booking")}</h1><p className="muted">{tr("View your booking status or cancel your reservation here.")}</p><Card>{isLoading ? <Loading /> : queryError ? <ErrorState error={queryError}/> : data && <><div className="manage-heading"><span>{tr("Booking #")}{data.id}</span><Badge tone={statusTone(data.status)}>{statusLabel(data.status)}</Badge></div><div className="summary-row"><span>{tr("Name")}</span><strong>{data.customerName}</strong></div><div className="summary-row"><span>{tr("Total price")}</span><strong>{money(data.totalAmount, data.currency)}</strong></div>{data.status === 'cancelled' ? <Notice message={tr("Booking cancelled.")} kind="success"/> : <><Notice message={error}/><div className="manage-actions"><Button variant="danger" loading={cancel.isPending} onClick={async () => { if (await confirm(tr("Are you sure you want to cancel this booking?")))
        cancel.mutate(); }}><Trash2 size={17}/>{tr("Cancel booking")}</Button></div></>}</>}</Card><div className="manage-help"><CheckCircle2 size={17}/>{tr("Keep the link to this page private.")}</div></main></div>;
}
