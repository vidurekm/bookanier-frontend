import { DEFAULT_LANGUAGE, urlLocale, localizedPath } from './locale';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'cs' | 'sk' | 'pl' | 'en';
export type Appearance = 'light' | 'dark';
export type ColorTheme = 'brand' | 'emerald' | 'ocean' | 'violet' | 'amber' | 'slate';
export const languages: { value: Language; label: string }[] = [
  { value: 'cs', label: 'Čeština' }, { value: 'sk', label: 'Slovenčina' },
  { value: 'pl', label: 'Polski' }, { value: 'en', label: 'English' },
];
export const themes: { value: ColorTheme; label: string; color: string }[] = [
  { value: 'brand', label: 'Bookanear', color: '#089fb0' },
  { value: 'emerald', label: 'Emerald', color: '#168b75' },
  { value: 'ocean', label: 'Ocean', color: '#2563eb' },
  { value: 'violet', label: 'Violet', color: '#7c3aed' },
  { value: 'amber', label: 'Amber', color: '#b45309' },
  { value: 'slate', label: 'Slate', color: '#475569' },
];
const LANGUAGE_KEY = 'bookanear_language_v1';
const APPEARANCE_KEY = 'bookanear_appearance_v1';
const THEME_KEY = 'bookanear_backoffice_theme_v1';
const supported = (v: string | null): v is Language => languages.some(x => x.value === v);
const themeSupported = (v: string | null): v is ColorTheme => themes.some(x => x.value === v);
const initialLanguage = (): Language => {
  const fromUrl = urlLocale(window.location.pathname);
  if (fromUrl) return fromUrl;
  try { const stored = localStorage.getItem(LANGUAGE_KEY) ?? localStorage.getItem('rezervo_language_v1'); if (supported(stored)) return stored; } catch { /* storage disabled */ }
  const browser = navigator.language.toLowerCase().split('-')[0];
  return supported(browser) ? browser : DEFAULT_LANGUAGE;
};
const initialTheme = (): ColorTheme => {
  try { const stored = localStorage.getItem(THEME_KEY) ?? localStorage.getItem('rezervo_backoffice_theme_v1'); if (themeSupported(stored)) return stored; } catch { /* storage disabled */ }
  return 'brand';
};
let activeLanguage: Language = initialLanguage();
interface Preferences { appearance: Appearance; setAppearance: (appearance: Appearance) => void; language: Language; setLanguage: (language: Language) => void; theme: ColorTheme; setTheme: (theme: ColorTheme) => void; }
const PreferencesContext = createContext<Preferences | null>(null);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [appearance,setAppearance]=useState<Appearance>(()=>{try{return localStorage.getItem(APPEARANCE_KEY)==='dark'?'dark':'light';}catch{return 'light';}});
  const [language, setLanguage] = useState<Language>(() => {
    const initial = initialLanguage();
    activeLanguage = initial;
    return initial;
  });
  const [theme, setTheme] = useState<ColorTheme>(initialTheme);
  useEffect(() => {
    document.documentElement.lang = language === 'cs' ? 'cs' : language;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* storage disabled */ }
  }, [language]);
  useEffect(() => {
    document.documentElement.dataset.backofficeTheme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage disabled */ }
  }, [theme]);
  useEffect(()=>{document.documentElement.dataset.appearance=appearance;try{localStorage.setItem(APPEARANCE_KEY,appearance);}catch{/* storage disabled */}},[appearance]);
  const changeLanguage = (next: Language) => {
    if (next === language) return;
    activeLanguage = next;
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* disabled */ }
    // Changing the prefix requires a new Router basename. Preserve the page and query.
    window.location.assign(localizedPath(window.location.pathname, next) + window.location.search + window.location.hash);
    setLanguage(next);
  };
  const value = useMemo(() => ({ language, setLanguage: changeLanguage, theme, setTheme, appearance, setAppearance }), [language, theme, appearance]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('PreferencesProvider is missing');
  return value;
}
/** Non-React helpers (formatters and API errors) read the current preference without displaying server text. */
export function currentLanguage(): Language { return activeLanguage; }

export function localeTag(language = currentLanguage()) {
  return ({ cs: 'cs-CZ', sk: 'sk-SK', pl: 'pl-PL', en: 'en-GB' } as const)[language];
}
