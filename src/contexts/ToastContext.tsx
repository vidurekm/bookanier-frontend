import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { tr } from '../lib/translations';
import { usePreferences } from '../lib/preferences';

type ToastKind = 'success' | 'error' | 'info';
type ToastMessage = { id: number; message: string; kind: ToastKind };
type ToastContextValue = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
    const [leaving, setLeaving] = useState(false);
    const dismiss = useCallback(() => {
        setLeaving(true);
        window.setTimeout(() => onDismiss(toast.id), 220);
    }, [onDismiss, toast.id]);

    useEffect(() => {
        const timer = window.setTimeout(dismiss, 6000);
        return () => window.clearTimeout(timer);
    }, [dismiss]);

    return <div className={`toast toast-${toast.kind}${leaving ? ' toast-leaving' : ''}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
        {toast.kind === 'success' && <CheckCircle2 size={19}/>}
        <span>{toast.message}</span>
        <button type="button" className="toast-dismiss" aria-label={tr('Close notification')} onClick={dismiss}><X size={17}/></button>
    </div>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const { appearance } = usePreferences();
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const nextId = useRef(0);
    const dismiss = useCallback((id: number) => setToasts(current => current.filter(toast => toast.id !== id)), []);
    const notify = useCallback<ToastContextValue>((message, kind = 'success') => {
        if (message) setToasts(current => [...current, { id: nextId.current++, message, kind }]);
    }, []);

    return <ToastContext.Provider value={notify}>
        {children}
        <div className="toast-container" data-appearance={appearance} aria-live="polite" aria-relevant="additions">
            {toasts.map(toast => <ToastItem key={toast.id} toast={toast} onDismiss={dismiss}/>)}
        </div>
    </ToastContext.Provider>;
}

export function useToast() {
    const notify = useContext(ToastContext);
    if (!notify) throw new Error('useToast must be used within ToastProvider');
    return notify;
}
