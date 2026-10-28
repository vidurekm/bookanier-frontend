import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Bot, LoaderCircle, Send, Sparkles, Trash2, X } from 'lucide-react';
import { api, json } from '../lib/api';
import { tr } from '../lib/translations';

type Message = { role: 'user' | 'assistant'; content: string };
type ChatStatus = { enabled: boolean };

export function HelpChat({ onClose }: { onClose: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api<ChatStatus>('/help/status')
      .then(result => { if (active) setEnabled(result.enabled); })
      .catch(() => { if (active) setStatusError(true); });
    api<Message[]>('/help/history')
      .then(result => { if (active) setMessages(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setHistoryLoading(false); });
    inputRef.current?.focus();
    return () => { active = false; };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || sending || !enabled || historyLoading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setDraft('');
    setError(false);
    setSending(true);
    try {
      const result = await api<{ content: string }>('/help/chat', json('POST', {
        messages: [{ role: 'user', content }]
      }));
      setMessages(current => [...current, { role: 'assistant', content: result.content }]);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    if (sending) return;
    setError(false);
    try {
      await api<void>('/help/history', { method: 'DELETE' });
      setMessages([]);
    } catch {
      setError(true);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const ask = (question: string) => {
    setDraft(question);
    inputRef.current?.focus();
  };

  return <section className="help-chat" role="region" aria-labelledby="help-chat-title">
      <header className="help-chat-header">
        <span className="help-chat-avatar"><Sparkles size={19}/></span>
        <div><strong id="help-chat-title">{tr('Bookanear assistant')}</strong><small>{tr('Help with using the app')}</small></div>
        <button className="icon-button" type="button" onClick={clearHistory} disabled={historyLoading || sending} aria-label={tr('Delete chat history')} title={tr('Delete chat history')}><Trash2 size={18}/></button>
        <button className="icon-button" type="button" onClick={onClose} aria-label={tr('Close')}><X size={20}/></button>
      </header>
      <div className="help-chat-messages" aria-live="polite">
        <div className="help-chat-message assistant"><Bot size={17}/><p>{tr('Hi! I can guide you through Bookanear. What would you like to do?')}</p></div>
        {historyLoading && <p className="help-chat-notice">{tr('Loading conversation...')}</p>}
        {messages.length === 0 && !historyLoading && enabled && <div className="help-chat-prompts">
          <button type="button" onClick={() => ask(tr('How do I add a service?'))}>{tr('How do I add a service?')}</button>
          <button type="button" onClick={() => ask(tr('How do I add a team member?'))}>{tr('How do I add a team member?')}</button>
          <button type="button" onClick={() => ask(tr('How do I manage reservations?'))}>{tr('How do I manage reservations?')}</button>
        </div>}
        {statusError && <p className="help-chat-notice error-text">{tr('The assistant is unavailable right now. Please try again later.')}</p>}
        {enabled === false && <p className="help-chat-notice">{tr('The AI assistant is not configured yet. Ask your administrator to enable it.')}</p>}
        {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`help-chat-message ${message.role}`}>
          {message.role === 'assistant' && <Bot size={17}/>}<p>{message.content}</p>
        </div>)}
        {sending && <div className="help-chat-message assistant"><Bot size={17}/><p className="help-chat-thinking"><LoaderCircle size={15} className="spin"/>{tr('Thinking...')}</p></div>}
        {error && <p className="help-chat-notice error-text">{tr('Your message could not be sent. Please try again.')}</p>}
        <div ref={bottomRef}/>
      </div>
      <div className="help-chat-footer">
        <p>{tr('Your conversation is saved to your account so you can continue later. You can delete its history at any time. Messages are sent to the configured AI provider; do not share sensitive information.')}</p>
        <form onSubmit={send} className="help-chat-form">
          <textarea ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown} maxLength={1500} rows={2}
            placeholder={tr('Ask about using Bookanear...')} aria-label={tr('Ask about using Bookanear...')}
            disabled={!enabled || sending || historyLoading}/>
          <button type="submit" className="help-chat-send" disabled={!draft.trim() || !enabled || sending || historyLoading}
            aria-label={tr('Send message')}><Send size={18}/></button>
        </form>
      </div>
  </section>;
}
