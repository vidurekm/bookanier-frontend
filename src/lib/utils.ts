import { tr } from './translations';
import { localeTag } from './preferences';
import { formattedDate, formattedDateTime, formattedDateTimeRange } from './dateFormat';
export const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const addDays = (date:string,days:number) => { const d=new Date(date+'T12:00:00'); d.setDate(d.getDate()+days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const formatDate = formattedDate;
export const formatDateTime = formattedDateTime;
export const formatDateTimeRange = formattedDateTimeRange;
export const sortByName = <T,>(items: readonly T[], getName: (item: T) => string): T[] =>
    [...items].sort((a, b) => getName(a).localeCompare(getName(b), localeTag(), { sensitivity: 'accent' }));
export const nameInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
};
export const money = (value?:number,currency='CZK') => value==null?'—':new Intl.NumberFormat(localeTag(),{style:'currency',currency}).format(value);
export const roleLabel = (role:string) => ({owner:'Majitel',admin:'Administrátor',worker:'Zaměstnanec'} as Record<string,string>)[role] ? tr(({owner:'Majitel',admin:'Administrátor',worker:'Zaměstnanec'} as Record<string,string>)[role]) : role;
export const statusLabel = (status:string) => ({confirmed:'Potvrzeno',pending:'Čeká',completed:'Dokončeno',cancelled:'Zrušeno',no_show:'Nedostavil se',active:'Aktivní'} as Record<string,string>)[status] ? tr(({confirmed:'Potvrzeno',pending:'Čeká',completed:'Dokončeno',cancelled:'Zrušeno',no_show:'Nedostavil se',active:'Aktivní'} as Record<string,string>)[status]) : status;
export const statusTone = (status:string):'green'|'red'|'blue'|'orange' => status==='confirmed'||status==='active' ? 'green' : status==='cancelled'||status==='no_show' ? 'red' : status==='completed' ? 'blue' : 'orange';
export const timeZoneOptions = (current?:string):string[] => {
  const zones:string[] = typeof Intl.supportedValuesOf==='function' ? Intl.supportedValuesOf('timeZone') : ['Europe/Prague','Europe/Bratislava','Europe/Warsaw','Europe/Berlin','Europe/Vienna','UTC'];
  const all = zones.includes('UTC') ? zones : [...zones,'UTC'];
  return current && !all.includes(current) ? [current,...all] : all;
};
export const timeZoneOffset = (zone:string):string => {
  try {
    const part = new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longOffset'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName')?.value||'';
    return part==='GMT' ? 'UTC+00:00' : part.replace('GMT','UTC');
  } catch { return ''; }
};
export const timeZoneLabel = (zone:string):string => `(${timeZoneOffset(zone)}) ${zone.replace(/_/g,' ')}`;
export const weekdayNames=['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];
export const dateWithZone = (date:string,time:string,zone:string):string => {
  // Browser Intl resolves IANA zone without assuming Europe/Prague. DST gaps are rejected server-side.
  const desired = new Date(`${date}T${time}:00Z`);
  const formatter = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const parts = formatter.formatToParts(desired);
  const map = Object.fromEntries(parts.map(p=>[p.type,p.value]));
  const localAsUTC = Date.UTC(+map.year,+map.month-1,+map.day,+map.hour,+map.minute);
  const offset = desired.getTime()-localAsUTC;
  return new Date(desired.getTime()+offset).toISOString();
};
