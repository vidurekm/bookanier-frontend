import { tr } from './translations';
import { localeTag } from './preferences';
import { formattedDate, formattedDateTime } from './dateFormat';
export const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const addDays = (date:string,days:number) => { const d=new Date(date+'T12:00:00'); d.setDate(d.getDate()+days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const formatDate = formattedDate;
export const formatDateTime = formattedDateTime;
export const money = (value?:number,currency='CZK') => value==null?'—':new Intl.NumberFormat(localeTag(),{style:'currency',currency}).format(value);
export const roleLabel = (role:string) => ({owner:'Majitel',admin:'Administrátor',worker:'Zaměstnanec'} as Record<string,string>)[role] ? tr(({owner:'Majitel',admin:'Administrátor',worker:'Zaměstnanec'} as Record<string,string>)[role]) : role;
export const statusLabel = (status:string) => ({confirmed:'Potvrzeno',pending:'Čeká',completed:'Dokončeno',cancelled:'Zrušeno',no_show:'Nedostavil se',active:'Aktivní'} as Record<string,string>)[status] ? tr(({confirmed:'Potvrzeno',pending:'Čeká',completed:'Dokončeno',cancelled:'Zrušeno',no_show:'Nedostavil se',active:'Aktivní'} as Record<string,string>)[status]) : status;
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
