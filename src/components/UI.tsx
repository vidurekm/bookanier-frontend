import { tr } from '../lib/translations';
import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AlertCircle, ArrowDown, ArrowDownUp, ArrowUp, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import { safeErrorMessage } from '../lib/errors';
import { usePreferences } from '../lib/preferences';
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
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props}
        pattern={props.pattern ?? (props.type === 'email' ? EMAIL_PATTERN : undefined)}
        title={props.title ?? (props.type === 'email' ? tr('Enter an email address like name@example.com.') : undefined)}
        className={`input ${props.className || ''}${isEmptyPicker(props) ? ' is-empty' : ''}`}/>;
}
function isEmptyPicker(props: InputHTMLAttributes<HTMLInputElement>) {
    return ['date', 'time', 'datetime-local', 'month'].includes(props.type || '') && props.value === '';
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`input textarea ${props.className || ''}`}/>; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & {
    allOption?: boolean;
    renderOption?: (value: string, label: ReactNode) => ReactNode;
    renderValue?: (value: string, label: ReactNode) => ReactNode;
}) {
    const {
        children, allOption, className = '', value, defaultValue, onChange, multiple = false, disabled,
        required, id, title, renderOption, renderValue, ...nativeProps
    } = props;
    const nativeRef = useRef<HTMLSelectElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [, setRenderVersion] = useState(0);
    const options = Children.toArray(children).filter(isValidElement).map((child, index) => {
        const option = child as React.ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
        const optionValue = option.props.value ?? (typeof option.props.children === 'string' ? option.props.children : '');
        return { key: option.key ?? `${optionValue}-${index}`, value: String(optionValue), label: option.props.children, disabled: option.props.disabled ?? false };
    });
    const currentValue = value !== undefined ? value : nativeRef.current
        ? multiple ? Array.from(nativeRef.current.selectedOptions, option => option.value) : nativeRef.current.value
        : defaultValue ?? (multiple ? [] : options.find(option => !option.disabled)?.value ?? '');
    const selectedValues = multiple
        ? Array.isArray(currentValue) ? currentValue.map(String) : currentValue == null ? [] : [String(currentValue)]
        : [currentValue == null ? '' : String(currentValue)];
    const selectedLabels = options.filter(option => selectedValues.includes(option.value)).map(option => option.label);
    const display = multiple ? selectedLabels.length ? selectedLabels.map(String).join(', ') : '' : String(selectedLabels[0] ?? '');
    const empty = !display || (allOption && (value === '' || value === 0));

    useEffect(() => {
        if (!open) return;
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!event.target || !(event.target instanceof Node) || !triggerRef.current?.parentElement?.contains(event.target)) setOpen(false);
        };
        window.addEventListener('mousedown', closeOnOutsideClick);
        return () => window.removeEventListener('mousedown', closeOnOutsideClick);
    }, [open]);
    useEffect(() => {
        if (!open) return;
        const selectedOption = menuRef.current?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]');
        (selectedOption ?? menuRef.current?.querySelector<HTMLButtonElement>('[role="option"]'))?.focus();
    }, [open]);

    const dispatchChange = (nextValues: string[]) => {
        const select = nativeRef.current;
        if (!select) return;
        for (const option of Array.from(select.options)) option.selected = nextValues.includes(option.value);
        setRenderVersion(version => version + 1);
        select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
        }
    };
    const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)'));
        if (!choices.length) return;
        event.preventDefault();
        const currentIndex = choices.indexOf(document.activeElement as HTMLButtonElement);
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
        choices[nextIndex].focus();
    };

    return <div className={`combo-box${className ? ` ${className}` : ''}${multiple ? ' combo-box-multiple' : ''}`} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
        <button
            ref={triggerRef}
            id={id}
            type="button"
            title={title}
            className={`input select combo-trigger${empty ? ' is-empty' : ''}`}
            aria-label={props['aria-label'] ?? title}
            aria-labelledby={props['aria-labelledby']}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-required={required || undefined}
            disabled={disabled}
            onClick={() => setOpen(current => !current)}
            onKeyDown={onTriggerKeyDown}
        >
            <span className="combo-value">{renderValue && !multiple ? renderValue(selectedValues[0] ?? '', selectedLabels[0] ?? '') : display}</span><ChevronDown size={16} aria-hidden="true"/>
        </button>
        <select
            {...nativeProps}
            ref={nativeRef}
            id={id ? `${id}-native` : undefined}
            title={title}
            value={value}
            defaultValue={defaultValue}
            multiple={multiple}
            disabled={disabled}
            required={required}
            onChange={onChange}
            onInvalid={event => { event.preventDefault(); triggerRef.current?.focus(); setOpen(true); }}
            tabIndex={-1}
            aria-hidden="true"
            className="combo-native"
        >{children}</select>
        {open && <div ref={menuRef} className="combo-menu" role="listbox" aria-multiselectable={multiple || undefined} onKeyDown={onMenuKeyDown}>
            {options.map(option => {
                const selected = selectedValues.includes(option.value);
                return <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    disabled={option.disabled}
                    key={option.key}
                    className={`combo-option${selected ? ' active' : ''}`}
                    onClick={() => {
                        if (multiple) {
                            const next = selected ? selectedValues.filter(item => item !== option.value) : [...selectedValues, option.value];
                            dispatchChange(next);
                        } else {
                            dispatchChange([option.value]);
                            setOpen(false);
                        }
                    }}
                >{renderOption ? renderOption(option.value, option.label) : option.label}</button>;
            })}
        </div>}
    </div>;
}
function ThemeScope({ children }: { children: ReactNode }) {
    const { theme, appearance } = usePreferences();
    return <div className="admin-layout modal-theme-scope" data-theme={theme} data-appearance={appearance}>{children}</div>;
}
export function Modal({ title, children, onClose, wide = false, className = '', themed = false, onTop = false }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
    className?: string;
    themed?: boolean;
    onTop?: boolean;
}) {
    const dialogRef = useRef<HTMLElement>(null);
    useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape')
        onClose(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || dialog.contains(document.activeElement)) return;
        const editableFields = dialog.querySelectorAll<HTMLElement>(
            'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly]), select:not(:disabled), [contenteditable="true"]'
        );
        Array.from(editableFields).find(field => field.getClientRects().length > 0)?.focus();
    }, []);
    const dialog = <div className={`modal-backdrop${onTop ? ' modal-backdrop-top' : ''}`} onMouseDown={e => { if (e.target === e.currentTarget)
        onClose(); }}><section ref={dialogRef} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label={tr("Close")} onClick={onClose}><X size={19}/></button></header><div className="modal-body">{children}</div></section></div>;
    return themed ? <ThemeScope>{dialog}</ThemeScope> : dialog;
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
    return null; return <div className="pager"><Button variant="ghost" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={16}/>{tr("Previous")}</Button><span>{tr("Page")} {page + 1} {tr("of")} {totalPages}</span><Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>{tr("Next ")}<ChevronRight size={16}/></Button></div>; }
export function SortableHeader({ label, active, direction, onClick }: {
    label: string;
    active: boolean;
    direction: 'asc' | 'desc';
    onClick: () => void;
}) {
    return <th aria-sort={active ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
        <button className="table-sort" onClick={onClick}>{label}{active ? direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/> : <ArrowDownUp size={14}/>}</button>
    </th>;
}
export function useFeedback() { const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const clear = () => { setError(tr("")); setSuccess(tr("")); }; return { error, success, setError, setSuccess, clear }; }
export function SubmitRow({ busy, dirty, label = tr('Save changes') }: {
    busy: boolean;
    dirty: boolean;
    label?: string;
}) { return <div className="form-actions"><Button type="submit" loading={busy} disabled={!dirty}>{label}</Button></div>; }
export function AddButton({ onClick, label = tr('Add') }: {
    onClick: () => void;
    label?: string;
}) { return <Button onClick={onClick}><Plus size={17}/>{label}</Button>; }
