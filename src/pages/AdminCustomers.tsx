import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { json, list, orgApi } from '../lib/api';
import type { Customer } from '../lib/types';
import { AddButton, Card, Empty, ErrorState, Field, Input, Loading, Modal, PageTitle, Pager, SearchBox, SortableHeader, SubmitRow, TextArea } from '../components/UI';
import { useConfirm } from '../contexts/ConfirmContext';
import { nameInitials } from '../lib/utils';
import { useFormDraft } from '../lib/useFormDraft';
import { useToast } from '../contexts/ToastContext';
export function AdminCustomers() {
    const confirm = useConfirm();
    const notify = useToast();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [page, setPage] = useState(0);
    const [q, setQ] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [edit, setEdit] = useState<Customer | null | undefined>(undefined);
    const [form, setForm, dirty, resetForm] = useFormDraft({ name: '', email: '', phone: '', notes: '' });
    const { data, isLoading, error: loadError } = useQuery({ queryKey: ['customers', orgId, page, q, sortField, sortDirection], queryFn: () => list<Customer>(orgId, '/customers', { page, size: 12, q, sort: `${sortField},${sortDirection}` }) });
    const changeSort = (field: string) => {
        setSortDirection(current => field === sortField ? current === 'asc' ? 'desc' : 'asc' : 'asc');
        setSortField(field);
        setPage(0);
    };
    const open = (c: Customer | null) => { setEdit(c); resetForm({ name: c?.name || '', email: c?.email || '', phone: c?.phone || '', notes: c?.notes || '' }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/customers/${edit.id}` : '/customers', json(edit ? 'PUT' : 'POST', form)), onSuccess: () => { notify(tr(edit ? 'Customer updated successfully.' : 'Customer created successfully.')); setEdit(undefined); qc.invalidateQueries({ queryKey: ['customers', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const remove = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/customers/${id}`, { method: 'DELETE' }), onSuccess: () => { notify(tr('Customer deleted successfully.')); setPage(0); qc.invalidateQueries({ queryKey: ['customers', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    return <>
      <PageTitle eyebrow={tr("CUSTOMER DATABASE")} title={tr("Customers")} description={tr("Contacts and notes to help you care for customers.")} action={<AddButton label={tr("New customer")} onClick={() => open(null)}/>} />
      <Card>
        <div className="table-toolbar">
          <SearchBox value={q} onChange={v => { setQ(v); setPage(0); }} placeholder={tr("Search name, email…")}/>

        </div>
        {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError}/> : !data?.items.length
          ? q.trim()
            ? <Empty title={tr("No records match the selected criteria.")}/>
            : <Empty title={tr("No customers yet")} description={tr("Customers will appear here when added.")} action={<AddButton onClick={() => open(null)}/>} />
          : <div className="table-scroll"><table className="data-table"><thead><tr><SortableHeader label={tr("Customer")} active={sortField === 'name'} direction={sortDirection} onClick={() => changeSort('name')}/><SortableHeader label={tr("Email")} active={sortField === 'email'} direction={sortDirection} onClick={() => changeSort('email')}/><SortableHeader label={tr("Phone")} active={sortField === 'phone'} direction={sortDirection} onClick={() => changeSort('phone')}/><th /></tr></thead><tbody>{data.items.map(c => <tr key={c.id}><td><div className="cell-name"><span className="cell-icon" aria-hidden="true">{nameInitials(c.name)}</span><strong>{c.name}</strong></div></td><td>{c.email ? <span className="cell-inline"><Mail size={14}/>{c.email}</span> : '—'}</td><td>{c.phone ? <span className="cell-inline"><Phone size={14}/>{c.phone}</span> : '—'}</td><td><div className="table-actions"><button className="icon-button" title={tr("Edit")} onClick={() => open(c)}><Pencil size={17}/></button><button className="icon-button" title={tr("Delete customer")} aria-label={tr("Delete customer")} disabled={remove.isPending} onClick={async () => { if (await confirm(tr("Delete this customer? Past reservations will be kept and waitlist entries cancelled."))) remove.mutate(c.id); }}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
        <Pager page={page} totalPages={data?.totalPages || 0} onChange={setPage}/>
      </Card>
      {edit !== undefined && <Modal title={edit ? tr('Edit customer') : tr('New customer')} onClose={() => setEdit(undefined)}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}><Field label={tr("Name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field><Field label={tr("Email")}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/></Field><Field label={tr("Phone")}><Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}/></Field><Field label={tr("Internal note")}><TextArea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}/></Field><SubmitRow busy={save.isPending} dirty={dirty}/></form></Modal>}
    </>;
}
