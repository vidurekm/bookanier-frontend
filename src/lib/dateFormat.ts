/** Shared display preference. Persisted in the organization's setup settings, not in this browser. */
export const dateFormats = [
  {value:'DD.MM.YYYY',label:'31.12.2026'},
  {value:'DD/MM/YYYY',label:'31/12/2026'},
  {value:'MM/DD/YYYY',label:'12/31/2026'},
  {value:'YYYY-MM-DD',label:'2026-12-31'}
] as const;
export type DateFormat = typeof dateFormats[number]['value'];
let active:DateFormat = 'DD.MM.YYYY';
export function normalizeDateFormat(value:unknown):DateFormat {
  return dateFormats.find(x=>x.value===value)?.value || 'DD.MM.YYYY';
}
export function setActiveDateFormat(value:unknown) {active=normalizeDateFormat(value);}
export function currentDateFormat():DateFormat {return active;}

/** Date-only values are calendar dates, not instants: never shift them by browser timezone. */
export function formattedDate(value?:string, format=currentDateFormat()):string {
  if (!value) return '—';
  let y:string,m:string,d:string;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (dateOnly && value.length===10) [,y,m,d] = dateOnly;
  else {
    const parsed=new Date(value);
    if(Number.isNaN(parsed.getTime())) return value;
    y=String(parsed.getFullYear());m=String(parsed.getMonth()+1).padStart(2,'0');d=String(parsed.getDate()).padStart(2,'0');
  }
  if (format==='YYYY-MM-DD') return `${y}-${m}-${d}`;
  if (format==='MM/DD/YYYY') return `${m}/${d}/${y}`;
  if (format==='DD/MM/YYYY') return `${d}/${m}/${y}`;
  return `${d}.${m}.${y}`;
}
export function formattedDateTime(value?:string, format=currentDateFormat()):string {
  if (!value) return '—';
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return value;
  const hh=String(date.getHours()).padStart(2,'0');
  const mm=String(date.getMinutes()).padStart(2,'0');
  return `${formattedDate(value,format)} ${hh}:${mm}`;
}
export function formattedDateTimeRange(start:string, end:string, format=currentDateFormat()):string {
  const startDate=new Date(start);
  const endDate=new Date(end);
  const startText=formattedDateTime(start,format);
  const endText=formattedDateTime(end,format);
  if(Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return `${startText} – ${endText}`;
  const sameDay=startDate.getFullYear()===endDate.getFullYear()
    && startDate.getMonth()===endDate.getMonth()
    && startDate.getDate()===endDate.getDate();
  const endTime=`${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`;
  return `${startText} – ${sameDay ? endTime : endText}`;
}
