import { tr } from '../lib/translations';
import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import { safeErrorMessage } from '../lib/errors';
export function Button({ children, variant = 'primary', loading = false, ...props }: {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`btn btn-${variant} ${props.className || ''}`} disabled={loading || props.disabled}>{loading && <Loader2 size={16} className="spin"/>}{children}</button>; }
export function Card({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) { return <div className={`card ${className}`}>{children}</div>; }
export function Field({ label, children, hint }: {
    label: string;
    children: ReactNode;
    hint?: string;
}) { return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small className="muted">{hint}</small>}</label>; }
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`input ${props.className || ''}`}/>; }
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`input textarea ${props.className || ''}`}/>; }
export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`input select ${props.className || ''}`}>{children}</select>; }
export function Modal({ title, children, onClose, wide = false }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
}) {
    useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape')
        onClose(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
    return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget)
        onClose(); }}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label={tr("Zav\u0159\u00EDt")} onClick={onClose}><X size={19}/></button></header><div className="modal-body">{children}</div></section></div>;
}
export function Notice({ message, kind = 'error' }: {
    message?: string | null;
    kind?: 'error' | 'success' | 'info';
}) { if (!message)
    return null; return <div className={`notice notice-${kind}`}>{kind === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{message}</span></div>; }
export function Loading({ label = tr('Načítám data…') }: {
    label?: string;
}) { return <div className="loading"><Loader2 size={24} className="spin"/><span>{label}</span></div>; }
export function Empty({ title = tr('Zatím tu nic není'), description, action }: {
    title?: string;
    description?: string;
    action?: ReactNode;
}) { return <div className="empty"><div className="empty-graphic"><Search size={25}/></div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>; }
export function ErrorState({ error }: {
    error: unknown;
}) { return <Notice message={safeErrorMessage(error)}/>; }
export function Badge({ children, tone = 'neutral' }: {
    children: ReactNode;
    tone?: 'neutral' | 'green' | 'orange' | 'red' | 'blue';
}) { return <span className={`badge badge-${tone}`}>{children}</span>; }
export function PageTitle({ eyebrow, title, description, action }: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) { return <div className="page-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-heading-actions">{action}</div>}</div>; }
export function SearchBox({ value, onChange, placeholder = tr('Hledat…') }: {
    value: string;
    onChange: (s: string) => void;
    placeholder?: string;
}) { return <div className="search-box"><Search size={17}/><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>{value && <button aria-label={tr("Vymazat")} onClick={() => onChange('')}><X size={14}/></button>}</div>; }
export function Pager({ page, totalPages, onChange }: {
    page: number;
    totalPages: number;
    onChange: (n: number) => void;
}) { if (totalPages <= 1)
    return null; return <div className="pager"><Button variant="ghost" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={16}/>{tr("P\u0159edchoz\u00ED")}</Button><span>{tr("Strana ")}{page + 1}{tr("z ")}{totalPages}</span><Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>{tr("Dal\u0161\u00ED ")}<ChevronRight size={16}/></Button></div>; }
export function useFeedback() { const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const clear = () => { setError(tr("")); setSuccess(tr("")); }; return { error, success, setError, setSuccess, clear }; }
export function SubmitRow({ busy, onCancel, label = tr('Uložit změny') }: {
    busy: boolean;
    onCancel: () => void;
    label?: string;
}) { return <div className="form-actions"><Button type="button" variant="secondary" onClick={onCancel}>{tr("Zru\u0161it")}</Button><Button type="submit" loading={busy}>{label}</Button></div>; }
export function AddButton({ onClick, label = tr('Přidat') }: {
    onClick: () => void;
    label?: string;
}) { return <Button onClick={onClick}><Plus size={17}/>{label}</Button>; }
