import { Globe2, Palette, Moon, Sun } from 'lucide-react';
import { languages, themes, usePreferences, type ColorTheme, type Language } from '../lib/preferences';
import { st } from '../lib/setupTranslations';
import { tr } from '../lib/translations';
import { Select } from './UI';

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = usePreferences();
  return <div className={`pref-control ${compact ? 'pref-compact' : ''}`}>
    <Globe2 size={16} aria-hidden="true" />
    <Select className="pref-select" aria-label={tr('Language')} value={language} onChange={e => setLanguage(e.target.value as Language)}>
      {languages.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </Select>
  </div>;
}
export function ThemeSelect({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = usePreferences();
  return <div className={`pref-control ${compact ? 'pref-compact' : ''}`}>
    <Palette size={16} aria-hidden="true" />
    <Select className="pref-select" aria-label={tr('Color theme')} value={theme} onChange={e => setTheme(e.target.value as ColorTheme)}>
      {themes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </Select>
  </div>;
}

export function AppearanceSelect({compact=false}:{compact?:boolean}) {
 const {appearance,setAppearance}=usePreferences();
 return <div className={`pref-control ${compact?'pref-compact':''}`}>{appearance==='dark'?<Moon size={16}/>:<Sun size={16}/>}<Select className="pref-select" aria-label={st('Vzhled')} value={appearance} onChange={e=>setAppearance(e.target.value as 'light'|'dark')}><option value="light">{st('Light appearance')}</option><option value="dark">{st('Dark appearance')}</option></Select></div>;
}
