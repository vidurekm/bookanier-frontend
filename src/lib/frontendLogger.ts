/**
 * Best-effort, privacy-conscious browser diagnostics. No auth headers,
 * request bodies, query strings, stack traces, email addresses or tokens.
 */
export type FrontendDiagnostic = {
  type: string;
  message: string;
  status?: number;
  requestId?: string;
};
const ENDPOINT = '/api/v1/frontend-errors';
const MAX_PER_MINUTE = 20;
let start = 0;
let count = 0;

function safeText(value: string, max: number): string {
  return value
    .replace(/https?:\/\/[^\s?#]+[?#][^\s]*/gi, '[URL]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+={0,2}/gi, 'Bearer [REDACTED]')
    .replace(/(token|password|secret|api[_-]?key|authorization)\s*[:=]\s*[^\s&;,]+/gi, '$1=[REDACTED]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL]')
    .replace(/\/[A-Za-z0-9_-]{24,}(?=\/|\s|$)/g, '/[ID]')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, max);
}

function safePath(path: string): string {
  return path.split(/[?#]/, 1)[0].replace(/\/[A-Za-z0-9_-]{24,}(?=\/|$)/g, '/[ID]').slice(0, 300) || '/';
}

export function reportFrontendError(event: FrontendDiagnostic): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - start >= 60_000) { start = now; count = 0; }
  if (++count > MAX_PER_MINUTE) return;
  // This request must not go through api(), otherwise an error could recurse.
  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    keepalive: true,
    body: JSON.stringify({
      type: safeText(event.type, 60),
      path: safePath(window.location.pathname),
      message: safeText(event.message, 500),
      status: event.status,
      requestId: event.requestId?.slice(0, 100),
    }),
  }).catch(() => { /* Logging must never break the application. */ });
}

export function installFrontendErrorHandlers(): void {
  window.addEventListener('error', (event: ErrorEvent) => {
    reportFrontendError({
      type: 'javascript-error',
      message: `${event.error?.name || 'Error'}: ${event.message || 'Unknown error'} at line ${event.lineno || 0}`,
    });
  });
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    reportFrontendError({
      type: 'unhandled-rejection',
      message: reason && typeof reason === 'object' && 'name' in reason
        ? `Unhandled ${String(reason.name)}` : 'Unhandled promise rejection',
    });
  });
}
