import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarOff, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { json, orgApi } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { tr, translateWith } from '../lib/translations';
import { Button, ErrorState, Loading, Notice } from './UI';
import { formattedDate } from '../lib/dateFormat';

type TimeInterval = { from: string; to: string };
type ApiRow = { id: number; work_date: string; start_time: string|null; end_time: string|null };
type Preview = { dryRun: boolean; conflictCount: number; conflicts?: Array<{ reservationId: number; startsAt: string }> };
function localDate(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dayGroups(rows: ApiRow[]) {
  const grouped = new Map<string, TimeInterval[]>();
  for (const row of rows) {
    const key = row.work_date.slice(0,10);
    if (!grouped.has(key)) grouped.set(key, []);
    if (row.start_time && row.end_time) grouped.get(key)!.push({from:row.start_time.slice(0,5),to:row.end_time.slice(0,5)});
  }
  return [...grouped].map(([date, intervals])=>({date, intervals})).sort((a,b)=>a.date.localeCompare(b.date));
}
export function DateExceptions({org,location,member}:{org:number;location:number;member?:number}) {
  const path = member ? `/locations/${location}/members/${member}/working-hours/dates` : `/locations/${location}/opening-hours/dates`;
  const qc = useQueryClient();
  const [date,setDate] = useState(localDate());
  const [mode,setMode] = useState<'closed'|'custom'>('closed');
  const [intervals,setIntervals] = useState<TimeInterval[]>([{from:'09:00',to:'17:00'}]);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const [busy,setBusy] = useState(false);
  const from=localDate(), to=localDate(365);
  const key=['date-exceptions',org,path,from,to];
  const query=useQuery({queryKey:key,queryFn:()=>orgApi<ApiRow[]>(org,`${path}?from=${from}&to=${to}`)});
  const entries=useMemo(()=>dayGroups(query.data||[]),[query.data]);
  function editDay(day:{date:string;intervals:TimeInterval[]}) {
    setDate(day.date); setMode(day.intervals.length?'custom':'closed');
    setIntervals(day.intervals.length?day.intervals:[{from:'09:00',to:'17:00'}]);setError('');setSuccess('');
  }
  function validateIntervals():TimeInterval[]|null {
    if (date < from) {setError(tr('Datum nemůže být v minulosti.'));return null;}
    const actual=mode==='closed'?[]:[...intervals].sort((a,b)=>a.from.localeCompare(b.from));
    if (mode==='custom' && (!actual.length||actual.some((x,i)=>!x.from||!x.to||x.from>=x.to||(i>0&&x.from<actual[i-1].to)))) {
      setError(tr('Zkontrolujte časy. Intervaly se nesmějí překrývat a konec musí být později než začátek.'));return null;
    }
    return actual;
  }
  async function save() {
    const actual=validateIntervals();if(!actual)return;
    setBusy(true);setError('');setSuccess('');
    try {
      const url=`${path}?dryRun=true`;
      const body={days:[{date,intervals:actual}]};
      const preview=await orgApi<Preview>(org,url,json('PUT',body));
      if(preview.conflictCount>0){setError(`${translateWith('Změna by zasáhla {count} existujících rezervací.',{count:preview.conflictCount})} ${tr('Neuloženo.')} ${tr('Nejprve rezervace upravte nebo zrušte ručně.')}`);return;}
      await orgApi(org,path,json('PUT',body));
      setSuccess(`${translateWith('Výjimka pro {date} byla uložena.',{date:formattedDate(date)})} ${tr('Ostatní dny beze změny.')}`);
      await qc.invalidateQueries({queryKey:['date-exceptions',org,path]});
    }catch(e){setError(safeErrorMessage(e));}finally{setBusy(false);}
  }
  async function resetDay(resetDate:string) {
    if(!window.confirm(translateWith('Vrátit {date} k běžnému týdennímu rozvrhu?',{date:formattedDate(resetDate)})))return;
    setBusy(true);setError('');setSuccess('');
    try {
      const preview=await orgApi<Preview>(org,`${path}/${resetDate}?dryRun=true`,{method:'DELETE'});
      if(preview.conflictCount>0) {setError(`${translateWith('Vrácení rozvrhu by zasáhlo {count} rezervací.',{count:preview.conflictCount})} ${tr('Neuloženo.')}`);return;}
      await orgApi(org,`${path}/${resetDate}`,{method:'DELETE'});
      setSuccess(translateWith('Pro {date} opět platí běžný rozvrh.',{date:formattedDate(resetDate)}));
      await qc.invalidateQueries({queryKey:['date-exceptions',org,path]});
    }catch(e){setError(safeErrorMessage(e));}finally{setBusy(false);}
  }
  return <div className="date-exceptions">
    <div className="section-heading"><div><h3><CalendarOff size={19}/> {member?tr('Jednorázové změny pracovní doby'):tr('Svátky a výjimečná otevírací doba')}</h3>
      <p>{member?tr('Dovolená, nemoc, zkrácená pracovní doba nebo mimořádné pracovní hodiny.'):tr('Zavřeno o svátku, mimořádné otevření nebo kratší provoz na vybraný den.')} {tr('Změna platí jen ve vybraný den.')}</p></div></div>
    <Notice message={error}/><Notice kind="success" message={success}/>
    <div className="date-exception-form"><label>{tr('Datum')}<input className="input" type="date" value={date} min={from} max={to} onChange={e=>setDate(e.target.value)}/></label><label>{tr('Režim')}<select className="input" value={mode} onChange={e=>setMode(e.target.value as 'closed'|'custom')}><option value="closed">{member?tr('Celý den volno'):tr('Celý den zavřeno')}</option><option value="custom">{tr('Vlastní intervaly')}</option></select></label></div>
    {mode==='custom'&&<div className="stack">{intervals.map((slot,i)=><div className="date-exception-row" key={i}><input className="input" type="time" value={slot.from} onChange={e=>setIntervals(prev=>prev.map((x,j)=>i===j?{...x,from:e.target.value}:x))}/><span>–</span><input className="input" type="time" value={slot.to} onChange={e=>setIntervals(prev=>prev.map((x,j)=>i===j?{...x,to:e.target.value}:x))}/><button type="button" className="text-button danger" onClick={()=>setIntervals(prev=>prev.filter((_,j)=>j!==i))}><Trash2 size={16}/>Odebrat</button></div>)}<button className="text-button" type="button" onClick={()=>setIntervals(prev=>[...prev,{from:'09:00',to:'17:00'}])}><Plus size={16}/>{tr('Přidat časový interval')}</button></div>}
    <div><Button loading={busy} onClick={save}>{tr('Uložit výjimku')}</Button></div>
    <p className="muted small">{tr('Před uložením se ověří kolize s existujícími rezervacemi. Rezervace se automaticky neruší. Výjimka nahrazuje týdenní rozvrh jen pro dané datum.')}</p>
    <h3>{tr('Naplánované výjimky (následujících 365 dní)')}</h3>
    {query.isLoading?<Loading/>:query.error?<ErrorState error={query.error}/>:entries.length===0?<p className="muted">{tr('Zatím nemáte žádné výjimky.')}</p>:entries.map(day=><div className="date-exception-row" key={day.date}><strong>{formattedDate(day.date)}</strong><span>{day.intervals.length?day.intervals.map(i=>`${i.from}–${i.to}`).join(', '):(member?tr('Volno'):tr('Zavřeno'))}</span><button type="button" className="text-button" onClick={()=>editDay(day)}>{tr('Upravit')}</button><button type="button" className="text-button danger" disabled={busy} onClick={()=>resetDay(day.date)}><RotateCcw size={15}/>{tr('Vrátit běžný rozvrh')}</button></div>)}
  </div>;
}
