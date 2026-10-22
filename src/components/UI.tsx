import { tr, translateWith } from '../lib/translations';
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
// Native type="email" accepts addresses like "df@s". Require a dotted domain as well.
// The escaped hyphen keeps the pattern compatible with HTML's Unicode-sets ('v') regex mode.
export const EMAIL_PATTERN = String.raw`[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}`;
type Validatable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
function validationMessage(field: Validatable) {
    const { validity } = field;
    if (validity.valueMissing) return tr('Please fill out this field.');
    if ('type' in field && field.type === 'email' && (validity.typeMismatch || validity.patternMismatch))
        return tr('Enter an email address like name@example.com.');
    if (validity.patternMismatch) return tr('Please match the requested format.');
    if (validity.tooShort && 'minLength' in field)
        return translateWith('Please enter at least {count} characters.', { count: field.minLength });
    if (validity.rangeUnderflow)
        return translateWith('Please enter a value greater than or equal to {value}.', { value: field.getAttribute('min') || '' });
    if (validity.rangeOverflow)
        return translateWith('Please enter a value less than or equal to {value}.', { value: field.getAttribute('max') || '' });
    if (validity.typeMismatch || validity.badInput || validity.stepMismatch)
        return tr('Please enter a valid value.');
    return '';
}
function validationHandlers<T extends Validatable>(
    onInvalid: React.FormEventHandler<T> | undefined,
    onInput: React.FormEventHandler<T> | undefined,
) {
    return {
        onInvalid: (event: React.FormEvent<T>) => {
            onInvalid?.(event);
            if (!event.defaultPrevented) event.currentTarget.setCustomValidity(validationMessage(event.currentTarget));
        },
        onInput: (event: React.FormEvent<T>) => {
            event.currentTarget.setCustomValidity('');
            onInput?.(event);
        },
    };
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} {...validationHandlers(props.onInvalid, props.onInput)}
        pattern={props.pattern ?? (props.type === 'email' ? EMAIL_PATTERN : undefined)}
        title={props.title ?? (props.type === 'email' ? tr('Enter an email address like name@example.com.') : undefined)}
        className={`input ${props.className || ''}`}/>;
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} {...validationHandlers(props.onInvalid, props.onInput)} className={`input textarea ${props.className || ''}`}/>; }
export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} {...validationHandlers(props.onInvalid, props.onInput)} className={`input select ${props.className || ''}`}>{children}</select>; }
export function Modal({ title, children, onClose, wide = false, className = '' }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
    className?: string;
}) {
    useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape')
        onClose(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
    return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget)
        onClose(); }}><section className={`modal ${wide ? 'modal-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label={tr("Close")} onClick={onClose}><X size={19}/></button></header><div className="modal-body">{children}</div></section></div>;
}
export function Notice({ message, kind = 'error' }: {
    message?: string | null;
    kind?: 'error' | 'success' | 'info';
}) { if (!message)
    return null; return <div className={`notice notice-${kind}`}>{kind === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{message}</span></div>; }
export function Loading({ label = tr('Loading data…') }: {
    label?: string;
}) { return <div className="loading"><Loader2 size={24} className="spin"/><span>{label}</span></div>; }
export function Empty({ title = tr('Nothing here yet'), description, action }: {
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
export function SearchBox({ value, onChange, placeholder = tr('Search…') }: {
    value: string;
    onChange: (s: string) => void;
    placeholder?: string;
}) { return <div className="search-box"><Search size={17}/><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>{value && <button aria-label={tr("Clear")} onClick={() => onChange('')}><X size={14}/></button>}</div>; }
export function Pager({ page, totalPages, onChange }: {
    page: number;
    totalPages: number;
    onChange: (n: number) => void;
}) { if (totalPages <= 1)
    return null; return <div className="pager"><Button variant="ghost" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={16}/>{tr("Previous")}</Button><span>{tr("Page ")}{page + 1}{tr("of ")}{totalPages}</span><Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>{tr("Next ")}<ChevronRight size={16}/></Button></div>; }
export function useFeedback() { const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const clear = () => { setError(tr("")); setSuccess(tr("")); }; return { error, success, setError, setSuccess, clear }; }
export function SubmitRow({ busy, onCancel, label = tr('Save changes') }: {
    busy: boolean;
    onCancel: () => void;
    label?: string;
}) { return <div className="form-actions"><Button type="button" variant="secondary" onClick={onCancel}>{tr("Cancel")}</Button><Button type="submit" loading={busy}>{label}</Button></div>; }
export function AddButton({ onClick, label = tr('Add') }: {
    onClick: () => void;
    label?: string;
}) { return <Button onClick={onClick}><Plus size={17}/>{label}</Button>; }
