import { tr } from './translations';

/** Translate only known SYSTEM types; organization-defined names are literal user data. */
const builtIn: Record<string, { key: string; aliases: string[] }> = {
  staff: { key: 'Pracovník', aliases: ['Pracovník', 'Zaměstnanec', 'Staff', 'Staff member', 'Pracownik'] },
  table: { key: 'Stůl', aliases: ['Stůl', 'Stôl', 'Stół', 'Table'] },
  chair: { key: 'Křeslo', aliases: ['Křeslo', 'Kreslo', 'Fotel', 'Chair'] },
  equipment: { key: 'Vybavení', aliases: ['Vybavení', 'Vybavenie', 'Sprzęt', 'Equipment'] },
  tools: { key: 'Nářadí', aliases: ['Nářadí', 'Náradie', 'Narzędzia', 'Tools'] },
};
export function resourceTypeLabel(type: { code?: string; name: string }): string {
  const system = type.code ? builtIn[type.code] : undefined;
  return system && system.aliases.includes(type.name) ? tr(system.key) : type.name;
}
