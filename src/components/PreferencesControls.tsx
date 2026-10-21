import { Globe2, Palette, Moon, Sun } from 'lucide-react';
import { languages, themes, usePreferences, type ColorTheme, type Language } from '../lib/preferences';
import { st } from '../lib/setupTranslations';
import { tr } from '../lib/translations';

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = usePreferences();
  return <label className={`pref-control ${compact ? 'pref-compact' : ''}`}>
    <Globe2 size={16} aria-hidden="true" />
    <span className="sr-only">{tr('Jazyk')}</span>
    <select aria-label={tr('Jazyk')} value={language} onChange={e => setLanguage(e.target.value as Language)}>
      {languages.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
  </label>;
}
export function ThemeSelect({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = usePreferences();
  return <label className={`pref-control ${compact ? 'pref-compact' : ''}`}>
    <Palette size={16} aria-hidden="true" />
    <span className="sr-only">{tr('Barevné schéma')}</span>
    <select aria-label={tr('Barevné schéma')} value={theme} onChange={e => setTheme(e.target.value as ColorTheme)}>
      {themes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
  </label>;
}

export function AppearanceSelect({compact=false}:{compact?:boolean}) {
 const {appearance,setAppearance}=usePreferences();
 return <label className={`pref-control ${compact?'pref-compact':''}`}>{appearance==='dark'?<Moon size={16}/>:<Sun size={16}/>}<span className="sr-only">{st('Vzhled')}</span><select aria-label={st('Vzhled')} value={appearance} onChange={e=>setAppearance(e.target.value as 'light'|'dark')}><option value="light">{st('Světlý vzhled')}</option><option value="dark">{st('Tmavý vzhled')}</option></select></label>;
}
