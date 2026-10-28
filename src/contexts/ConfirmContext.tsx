import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { tr } from '../lib/translations';
import { Button, Modal } from '../components/UI';

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  variant?: 'primary' | 'danger';
};
type Confirmation = ConfirmOptions & {
  message: string;
  resolve: (confirmed: boolean) => void;
};
type ConfirmRequest = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmRequest | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const pending = useRef<Confirmation[]>([]);
  const [current, setCurrent] = useState<Confirmation | null>(null);

  const confirm = useCallback<ConfirmRequest>((message, options = {}) => new Promise(resolve => {
    const request = { ...options, message, resolve };
    pending.current.push(request);
    if (pending.current.length === 1) setCurrent(request);
  }), []);

  const finish = (confirmed: boolean) => {
    pending.current.shift()?.resolve(confirmed);
    setCurrent(pending.current[0] || null);
  };

  return <>
    <ConfirmContext.Provider value={confirm}>{children}</ConfirmContext.Provider>
    {current && <Modal
      themed
      onTop
      title={current.title || tr('Confirm action')}
      onClose={() => finish(false)}
      className="confirm-modal"
    >
      <p>{current.message}</p>
      <div className="form-actions">
        <Button variant="secondary" autoFocus onClick={() => finish(false)}>{tr('Cancel')}</Button>
        <Button variant={current.variant || 'danger'} onClick={() => finish(true)}>{current.confirmLabel || tr('Confirm')}</Button>
      </div>
    </Modal>}
  </>;
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
