import { safeErrorMessage } from '../lib/errors';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { cancelReservation, publicReservation } from '../lib/api';
import { money, statusLabel } from '../lib/utils';
import { Badge, Button, Card, ErrorState, Loading, Notice } from '../components/UI';
export function ManageBookingPage() {
    const { token = '' } = useParams();
    const qc = useQueryClient();
    const [error, setError] = useState('');
    const { data, isLoading, error: queryError } = useQuery({ queryKey: ['manage', token], queryFn: () => publicReservation(token), retry: false });
    const cancel = useMutation({ mutationFn: () => cancelReservation(token), onSuccess: () => { setError(tr("")); qc.invalidateQueries({ queryKey: ['manage', token] }); }, onError: e => setError(safeErrorMessage(e)) });
    return <div className="manage-page"><header className="booking-header container"><BrandLogo/><Link to="/"><ArrowLeft size={16}/>{tr("Zp\u011Bt")}</Link><LanguageSelect compact/></header><main className="manage-main"><div className="manage-icon"><ShieldCheck size={30}/></div><h1>{tr("Spr\u00E1va rezervace")}</h1><p className="muted">{tr("Zde m\u016F\u017Eete zobrazit stav sv\u00E9 rezervace nebo ji zru\u0161it.")}</p><Card>{isLoading ? <Loading /> : queryError ? <ErrorState error={queryError}/> : data && <><div className="manage-heading"><span>{tr("Rezervace #")}{data.id}</span><Badge tone={data.status === 'confirmed' ? 'green' : data.status === 'cancelled' ? 'red' : 'orange'}>{statusLabel(data.status)}</Badge></div><div className="summary-row"><span>{tr("Jm\u00E9no")}</span><strong>{data.customerName}</strong></div><div className="summary-row"><span>{tr("Celkov\u00E1 cena")}</span><strong>{money(data.totalAmount, data.currency)}</strong></div>{data.status === 'cancelled' ? <Notice message={tr("Rezervace byla zru\u0161ena.")} kind="success"/> : <><Notice message={error}/><div className="manage-actions"><Button variant="danger" loading={cancel.isPending} onClick={() => { if (confirm(tr("Opravdu chcete rezervaci zru\u0161it?")))
        cancel.mutate(); }}><Trash2 size={17}/>{tr("Zru\u0161it rezervaci")}</Button></div></>}</>}</Card><div className="manage-help"><CheckCircle2 size={17}/>{tr("Odkaz na tuto str\u00E1nku uchov\u00E1vejte v soukrom\u00ED.")}</div></main></div>;
}
