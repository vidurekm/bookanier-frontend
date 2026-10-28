import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, orgApi } from '../lib/api';
import { UiError } from '../lib/errors';
import { tr, translateWith } from '../lib/translations';
import { Button, ErrorState, Field, Loading, Select } from './UI';
import { PeriodPicker } from './PeriodPicker';
import { AddTimeIntervalButton, TimeIntervalRows } from './TimeIntervalEditor';
import { formattedDate } from '../lib/dateFormat';
import { useMemberDetailSave } from './MemberDetailSaveContext';
import { useToast } from '../contexts/ToastContext';

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
  const notify=useToast();
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
  function validateIntervals():TimeInterval[]|null {
    if (date < from) {notify(tr('Date cannot be in the past.'),'error');return null;}
    const actual=mode==='closed'?[]:[...intervals].sort((a,b)=>a.from.localeCompare(b.from));
    if (mode==='custom' && (!actual.length||actual.some((x,i)=>!x.from||!x.to||x.from>=x.to||(i>0&&x.from<actual[i-1].to)))) {
      notify(tr('Check the times. Intervals cannot overlap.'),'error');return null;
    }
    return actual;
  }
  function stageException() {
    if (entries.some(day=>day.date===date)) {
      notify(tr('An exception is already saved for this date. Remove it and save changes before adding a new one.'),'error');
      return;
    }
    const actual=validateIntervals();if(!actual)return;
    setStaged(current=>({...current,[date]:actual}));
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
    await qc.invalidateQueries({queryKey:['date-exceptions',org,path]});
  },[org,path,qc,staged]);
  useMemberDetailSave(`exceptions-${location}-${member ?? 'location'}`,3,Object.keys(staged).length>0,saveDraft);
  return <div className="date-exceptions">
    <div className="section-heading"><div><h3>{member?tr('One-off working hours changes'):tr('Holidays and special opening hours')}</h3>
      <p>{member?tr('Holiday, illness, shorter working hours or special hours.'):tr('Close for a holiday, open exceptionally or shorten hours on a specific day.')} {tr('The change applies only to the selected date.')}</p></div></div>
    <div className="date-exception-form"><Field label={tr('Date')}><PeriodPicker mode="day" field label={tr('Date')} value={date} minDate={from} minYear={Number(from.slice(0,4))} maxYear={Number(to.slice(0,4))} onChange={setDate}/></Field><Field label={tr('Mode')}><Select value={mode} onChange={e=>setMode(e.target.value as 'closed'|'custom')}><option value="closed">{member?tr('Day off'):tr('Closed all day')}</option><option value="custom">{tr('Custom hours')}</option></Select></Field><Button type="button" onClick={stageException}>{tr('Add exception to pending')}</Button></div>
    {mode==='custom'&&<div className="date-exception-interval-editor"><TimeIntervalRows intervals={intervals} onChange={setIntervals} rowClassName="date-exception-interval-row"/><AddTimeIntervalButton className="date-exception-add-interval" onClick={()=>setIntervals(prev=>[...prev,{from:'09:00',to:'17:00'}])}/></div>}
    <p className="muted small">{tr('Existing booking conflicts are checked first. Bookings are never automatically cancelled.')}</p>
    <h3>{tr('Planned exceptions (next 365 days)')}</h3>
    {query.isLoading?<Loading/>:query.error?<ErrorState error={query.error}/>:visibleEntries.length===0?<p className="muted">{tr('No exceptions scheduled yet.')}</p>:visibleEntries.map(day=><div className="date-exception-row" key={day.date}><strong>{formattedDate(day.date)}</strong><span>{day.removalPending?tr('Exception will be removed when changes are saved.'):day.intervals.length?day.intervals.map(i=>`${i.from}–${i.to}`).join(', '):(member?tr('Day off'):tr('Closed'))}</span>{day.pending&&<span className="badge badge-orange">{tr('Pending changes')}</span>}{day.pending?<button type="button" className="text-button" onClick={()=>setStaged(current=>{const next={...current};delete next[day.date];return next;})}>{tr('Undo pending change')}</button>:<button type="button" className="text-button" onClick={()=>{setStaged(current=>({...current,[day.date]:null}));}}>{tr('Delete exception')}</button>}</div>)}
  </div>;
}
