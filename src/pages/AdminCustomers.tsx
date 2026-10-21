import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Pencil, Phone, UserRound } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { json, list, orgApi } from '../lib/api';
import type { Customer } from '../lib/types';
import { AddButton, Card, Empty, ErrorState, Field, Input, Loading, Modal, Notice, PageTitle, Pager, SearchBox, SubmitRow, TextArea } from '../components/UI';
export function AdminCustomers() {
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [page, setPage] = useState(0);
    const [q, setQ] = useState('');
    const [edit, setEdit] = useState<Customer | null | undefined>(undefined);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['customers', orgId, page, q], queryFn: () => list<Customer>(orgId, '/customers', { page, size: 12, q }) });
    const open = (c: Customer | null) => { setError(tr("")); setEdit(c); setForm({ name: c?.name || '', email: c?.email || '', phone: c?.phone || '', notes: c?.notes || '' }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/customers/${edit.id}` : '/customers', json(edit ? 'PUT' : 'POST', edit ? form : { name: form.name, email: form.email || null, phone: form.phone || null })), onSuccess: () => { setEdit(undefined); qc.invalidateQueries({ queryKey: ['customers', orgId] }); }, onError: e => setError(safeErrorMessage(e)) });
    return <><PageTitle eyebrow={tr("Z\u00C1KAZNICK\u00C1 DATAB\u00C1ZE")} title={tr("Z\u00E1kazn\u00EDci")} description={tr("Kontakty a pozn\u00E1mky pro lep\u0161\u00ED p\u00E9\u010Di o z\u00E1kazn\u00EDky.")} action={<AddButton label={tr("Nov\u00FD z\u00E1kazn\u00EDk")} onClick={() => open(null)}/>}/><Card><div className="table-toolbar"><SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Hledat jm\u00E9no, e-mail\u2026")}/><span className="muted small">{data?.totalElements || 0}{tr("z\u00E1kazn\u00EDk\u016F")}</span></div>{isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length ? <Empty title={tr("Zat\u00EDm \u017E\u00E1dn\u00ED z\u00E1kazn\u00EDci")} description={tr("P\u0159idejte z\u00E1kazn\u00EDka nebo vytvo\u0159te prvn\u00ED rezervaci.")} action={<AddButton onClick={() => open(null)}/>}/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>{tr("Z\u00E1kazn\u00EDk")}</th><th>{tr("E-mail")}</th><th>{tr("Telefon")}</th><th /></tr></thead><tbody>{data.items.map(c => <tr key={c.id}><td><div className="cell-name"><span className="cell-icon"><UserRound size={18}/></span><strong>{c.name}</strong></div></td><td>{c.email ? <span className="cell-inline"><Mail size={14}/>{c.email}</span> : '—'}</td><td>{c.phone ? <span className="cell-inline"><Phone size={14}/>{c.phone}</span> : '—'}</td><td><button className="icon-button" title={tr("Upravit")} onClick={() => open(c)}><Pencil size={17}/></button></td></tr>)}</tbody></table></div>}<Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/></Card>
    {edit !== undefined && <Modal title={edit ? tr('Upravit zákazníka') : tr('Nový zákazník')} onClose={() => setEdit(undefined)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}><Notice message={error}/><Field label={tr("Jm\u00E9no")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("E-mail")}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/></Field><Field label={tr("Telefon")}><Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}/></Field>{edit && <Field label={tr("Intern\u00ED pozn\u00E1mka")}><TextArea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}/></Field>}<SubmitRow busy={save.isPending} onCancel={() => setEdit(undefined)}/></form></Modal>}
  </>;
}
