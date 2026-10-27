import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarOff, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { json, orgApi } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { tr, translateWith } from '../lib/translations';
import { Button, ErrorState, Loading, Notice } from './UI';
import { formattedDate } from '../lib/dateFormat';
import { useConfirm } from '../contexts/ConfirmContext';
import { UiError } from '../lib/errors';
import { useMemberDetailSave } from './MemberDetailSaveContext';

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
  const confirm = useConfirm();
  const path = member ? `/locations/${location}/members/${member}/working-hours/dates` : `/locations/${location}/opening-hours/dates`;
  const qc = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);
  const [date,setDate] = useState(localDate());
  const [editingDate,setEditingDate] = useState<string|null>(null);
  const [mode,setMode] = useState<'closed'|'custom'>('closed');
  const [intervals,setIntervals] = useState<TimeInterval[]>([{from:'09:00',to:'17:00'}]);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const [busy,setBusy] = useState(false);
  const [staged,setStaged] = useState<Record<string,TimeInterval[]|null>>({});
  const from=localDate(), to=localDate(365);
  const key=['date-exceptions',org,path,from,to];
  const query=useQuery({queryKey:key,queryFn:()=>orgApi<ApiRow[]>(org,`${path}?from=${from}&to=${to}`)});
  const entries=useMemo(()=>dayGroups(query.data||[]),[query.data]);
  const visibleEntries=useMemo(()=>{
    const savedByDate=new Map(entries.map(day=>[day.date,day.intervals]));
    const dates=new Set([...savedByDate.keys(),...Object.keys(staged)]);
    return [...dates].map(dayDate=>{
      const isStaged=Object.prototype.hasOwnProperty.call(staged,dayDate);
      const removalPending=isStaged&&staged[dayDate]===null;
      return {date:dayDate,intervals:removalPending?savedByDate.get(dayDate)||[]:isStaged?staged[dayDate]||[]:savedByDate.get(dayDate)||[],pending:isStaged,removalPending};
    }).sort((a,b)=>a.date.localeCompare(b.date));
  },[entries,staged]);
  function editDay(day:{date:string;intervals:TimeInterval[]}) {
    setDate(day.date); setMode(day.intervals.length?'custom':'closed');
    setIntervals(day.intervals.length?day.intervals:[{from:'09:00',to:'17:00'}]);setEditingDate(day.date);setError('');setSuccess('');
    requestAnimationFrame(()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  function validateIntervals():TimeInterval[]|null {
    if (date < from) {setError(tr('Date cannot be in the past.'));return null;}
    const actual=mode==='closed'?[]:[...intervals].sort((a,b)=>a.from.localeCompare(b.from));
    if (mode==='custom' && (!actual.length||actual.some((x,i)=>!x.from||!x.to||x.from>=x.to||(i>0&&x.from<actual[i-1].to)))) {
      setError(tr('Check the times. Intervals cannot overlap.'));return null;
    }
    return actual;
  }
  function stageException() {
    const actual=validateIntervals();if(!actual)return;
    setStaged(current=>({...current,[date]:actual}));
    setEditingDate(null);setError('');setSuccess(tr('Exception added to pending changes.'));
  }
  const saveDraft=useCallback(async()=>{
    const changes=Object.entries(staged).sort(([a],[b])=>a.localeCompare(b));
    if(!changes.length)return;
    const updates=changes.filter((entry):entry is [string,TimeInterval[]]=>entry[1]!==null).map(([changedDate,changedIntervals])=>({date:changedDate,intervals:changedIntervals}));
    const removals=changes.filter((entry):entry is [string,null]=>entry[1]===null).map(([changedDate])=>changedDate);
    const chunks:typeof updates[]=[];
    for(let i=0;i<updates.length;i+=62)chunks.push(updates.slice(i,i+62));
    let conflictCount=0;
    for(const days of chunks){
      const preview=await orgApi<Preview>(org,`${path}?dryRun=true`,json('PUT',{days}));
      conflictCount+=preview.conflictCount;
    }
    for(const changedDate of removals){
      const preview=await orgApi<Preview>(org,`${path}/${changedDate}?dryRun=true`,{method:'DELETE'});
      conflictCount+=preview.conflictCount;
    }
    if(conflictCount>0)throw new UiError(`${translateWith('This would affect {count} existing bookings.',{count:conflictCount})} ${tr('Not saved.')} ${tr('Change or cancel affected bookings manually first.')}`);
    for(const days of chunks)await orgApi(org,path,json('PUT',{days}));
    for(const changedDate of removals)await orgApi(org,`${path}/${changedDate}`,{method:'DELETE'});
    setStaged({});
    setEditingDate(null);
    await qc.invalidateQueries({queryKey:['date-exceptions',org,path]});
  },[org,path,qc,staged]);
  useMemberDetailSave(`exceptions-${location}-${member ?? 'location'}`,3,!!member&&Object.keys(staged).length>0,saveDraft);
  async function save() {
    const actual=validateIntervals();if(!actual)return;
    setBusy(true);setError('');setSuccess('');
    try {
      const url=`${path}?dryRun=true`;
      const body={days:[{date,intervals:actual}]};
      const preview=await orgApi<Preview>(org,url,json('PUT',body));
      if(preview.conflictCount>0){setError(`${translateWith('This would affect {count} existing bookings.',{count:preview.conflictCount})} ${tr('Not saved.')} ${tr('Change or cancel affected bookings manually first.')}`);return;}
      await orgApi(org,path,json('PUT',body));
      setSuccess(`${translateWith('Exception saved for {date}.',{date:formattedDate(date)})} ${tr('Other days are unchanged.')}`);
      setEditingDate(null);
      await qc.invalidateQueries({queryKey:['date-exceptions',org,path]});
    }catch(e){setError(safeErrorMessage(e));}finally{setBusy(false);}
  }
  async function resetDay(resetDate:string) {
    if(!await confirm(translateWith('Restore the regular weekly schedule for {date}?',{date:formattedDate(resetDate)}),{variant:'primary'}))return;
    if(member){
      setStaged(current=>({...current,[resetDate]:null}));
      setError('');setSuccess(tr('Exception added to pending changes.'));
      return;
    }
    setBusy(true);setError('');setSuccess('');
    try {
      const preview=await orgApi<Preview>(org,`${path}/${resetDate}?dryRun=true`,{method:'DELETE'});
      if(preview.conflictCount>0) {setError(`${translateWith('Restoring the schedule would affect {count} bookings.',{count:preview.conflictCount})} ${tr('Not saved.')}`);return;}
      await orgApi(org,`${path}/${resetDate}`,{method:'DELETE'});
      setSuccess(translateWith('Regular schedule applies again on {date}.',{date:formattedDate(resetDate)}));
      await qc.invalidateQueries({queryKey:['date-exceptions',org,path]});
    }catch(e){setError(safeErrorMessage(e));}finally{setBusy(false);}
  }
  return <div className="date-exceptions">
    <div className="section-heading"><div><h3><CalendarOff size={19}/> {member?tr('One-off working hours changes'):tr('Holidays and special opening hours')}</h3>
      <p>{member?tr('Holiday, illness, shorter working hours or special hours.'):tr('Close for a holiday, open exceptionally or shorten hours on a specific day.')} {tr('The change applies only to the selected date.')}</p></div></div>
    <Notice message={error}/><Notice kind="success" message={success}/>
    <div className="date-exception-form" ref={formRef}><label>{tr('Date')}<input className="input" type="date" value={date} min={from} max={to} onChange={e=>{setDate(e.target.value);setEditingDate(null);}}/></label><label>{tr('Mode')}<select className="input" value={mode} onChange={e=>setMode(e.target.value as 'closed'|'custom')}><option value="closed">{member?tr('Day off'):tr('Closed all day')}</option><option value="custom">{tr('Custom hours')}</option></select></label></div>
    {mode==='custom'&&<div className="stack">{intervals.map((slot,i)=><div className="date-exception-row" key={i}><input className="input" type="time" value={slot.from} onChange={e=>setIntervals(prev=>prev.map((x,j)=>i===j?{...x,from:e.target.value}:x))}/><span>–</span><input className="input" type="time" value={slot.to} onChange={e=>setIntervals(prev=>prev.map((x,j)=>i===j?{...x,to:e.target.value}:x))}/><button type="button" className="text-button danger" onClick={()=>setIntervals(prev=>prev.filter((_,j)=>j!==i))}><Trash2 size={16}/>Odebrat</button></div>)}<button className="text-button" type="button" onClick={()=>setIntervals(prev=>[...prev,{from:'09:00',to:'17:00'}])}><Plus size={16}/>{tr('Add time interval')}</button></div>}
    <div>{member?<Button type="button" onClick={stageException}>{editingDate?tr('Add changes to pending'):tr('Add exception to pending')}</Button>:<Button loading={busy} onClick={save}>{editingDate?tr('Save changes'):tr('Save exception')}</Button>}</div>
    <p className="muted small">{tr('Existing booking conflicts are checked first. Bookings are never automatically cancelled.')}</p>
    <h3>{tr('Planned exceptions (next 365 days)')}</h3>
    {query.isLoading?<Loading/>:query.error?<ErrorState error={query.error}/>:visibleEntries.length===0?<p className="muted">{tr('No exceptions scheduled yet.')}</p>:visibleEntries.map(day=><div className="date-exception-row" key={day.date}><strong>{formattedDate(day.date)}</strong><span>{day.removalPending?tr('Exception will be removed when changes are saved.'):day.intervals.length?day.intervals.map(i=>`${i.from}–${i.to}`).join(', '):(member?tr('Day off'):tr('Closed'))}</span>{day.pending&&<span className="badge badge-orange">{tr('Pending changes')}</span>}{day.pending?<button type="button" className="text-button" onClick={()=>setStaged(current=>{const next={...current};delete next[day.date];return next;})}>{tr('Undo pending change')}</button>:<button type="button" className="text-button" onClick={()=>editDay(day)}>{tr('Edit')}</button>}<button type="button" className="text-button danger" disabled={busy} onClick={()=>resetDay(day.date)}><RotateCcw size={15}/>{tr('Restore regular schedule')}</button></div>)}
  </div>;
}
