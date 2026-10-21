import { currentLanguage } from './preferences';
import { translate } from './translations';

/** Stable machine codes only. Never trust the API's error/message/detail/title text for UI. */
export type ErrorCode =
  | 'NETWORK_ERROR' | 'AUTH_REQUIRED' | 'ACCESS_DENIED' | 'NOT_FOUND'
  | 'VALIDATION_ERROR' | 'CONFLICT' | 'RATE_LIMITED' | 'FILE_TOO_LARGE'
  | 'SERVICE_UNAVAILABLE' | 'SERVER_ERROR' | 'UNKNOWN_ERROR'
  | 'SLOT_UNAVAILABLE' | 'INSUFFICIENT_RESOURCES' | 'SCHEDULE_CONFLICT'
  | 'INVALID_BOOKING_DURATION' | 'INVALID_BOOKING_LINK' | 'UNSUPPORTED_IMAGE'
  | 'EVENT_FULL' | 'SETUP_LOCKED'
  | 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'RESOURCE_NOT_FOUND' | 'INVALID_RESET_TOKEN';

const supported = new Set<ErrorCode>([
  'NETWORK_ERROR', 'AUTH_REQUIRED', 'ACCESS_DENIED', 'NOT_FOUND', 'VALIDATION_ERROR',
  'CONFLICT', 'RATE_LIMITED', 'FILE_TOO_LARGE', 'SERVICE_UNAVAILABLE', 'SERVER_ERROR',
  'UNKNOWN_ERROR', 'SLOT_UNAVAILABLE', 'INSUFFICIENT_RESOURCES', 'SCHEDULE_CONFLICT',
  'INVALID_BOOKING_DURATION', 'INVALID_BOOKING_LINK', 'UNSUPPORTED_IMAGE',
  'EVENT_FULL', 'SETUP_LOCKED', 'INVALID_CREDENTIALS', 'EMAIL_NOT_VERIFIED', 'RESOURCE_NOT_FOUND', 'INVALID_RESET_TOKEN',
]);
export function knownErrorCode(value: unknown): ErrorCode | undefined {
  return typeof value === 'string' && supported.has(value as ErrorCode) ? value as ErrorCode : undefined;
}
export function statusErrorCode(status: number): ErrorCode {
  switch (status) {
    case 0: return 'NETWORK_ERROR';
    case 400: case 422: return 'VALIDATION_ERROR';
    case 401: return 'AUTH_REQUIRED';
    case 403: return 'ACCESS_DENIED';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 413: return 'FILE_TOO_LARGE';
    case 429: return 'RATE_LIMITED';
    case 502: case 503: case 504: return 'SERVICE_UNAVAILABLE';
    default: return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
  }
}
export function errorMessage(code: ErrorCode, language = currentLanguage()): string {
  return translate(`errors.${code}`, language);
}
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: ErrorCode, public readonly requestId?: string) {
    super(errorMessage(code));
    this.name = 'ApiError';
  }
}
export class UiError extends Error {
  constructor(public readonly translationKey: string) { super(translationKey); this.name = 'UiError'; }
}
export function safeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return errorMessage(error.code);
  if (error instanceof UiError) return translate(error.translationKey);
  // Unknown Error.message can contain arbitrary untrusted server or library text.
  return errorMessage('UNKNOWN_ERROR');
}
