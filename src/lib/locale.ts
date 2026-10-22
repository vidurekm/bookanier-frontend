import type { Language } from './preferences';
export const DEFAULT_LANGUAGE: Language = 'en';
export const supportedLocales = ['cs', 'sk', 'pl', 'en'] as const;
export function urlLocale(pathname: string): Language | null {
  const first = pathname.split('/')[1];
  return supportedLocales.includes(first as Language) ? first as Language : null;
}
export function localizedPath(pathname: string, language: Language): string {
  const parts = pathname.split('/');
  if (urlLocale(pathname)) parts.splice(1, 1);
  const suffix = parts.join('/') || '/';
  return `/${language}${suffix === '/' ? '' : suffix.startsWith('/') ? suffix : '/' + suffix}`;
}
export function currentUrlLanguage(): Language {
  return urlLocale(window.location.pathname) || DEFAULT_LANGUAGE;
}
