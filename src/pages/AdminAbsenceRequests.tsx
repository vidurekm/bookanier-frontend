import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '../components/AdminShell';
import { myAccess } from '../lib/access';
import { orgApi, json, locations, members } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { Button, Card, Field, Input, Loading, Notice, PageTitle, Select } from '../components/UI';
import { tr } from '../lib/translations';
import type { Member } from '../lib/types';
import { formattedDate } from '../lib/dateFormat';

type Interval={from:string;to:string};
type RequestRow={id:number;member_id:number;location_id:number;work_date:string;intervals:string;reason:string|null;status:'pending'|'approved'|'rejected';member_name:string;created_at:string};
function describeIntervals(value:string):string {
 try {
  const parsed=JSON.parse(value) as unknown;
  if(!Array.isArray(parsed))return tr('Změna pracovní doby');
  if(parsed.length===0)return tr('Celý den volno');
  return parsed.filter((x):x is Interval=>typeof x==='object'&&x!==null&&typeof x.from==='string'&&typeof x.to==='string')
    .map(x=>`${x.from.slice(0,5)}–${x.to.slice(0,5)}`).join(', ');
 } catch{return tr('Změna pracovní doby');}
}
const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};

export function AdminAbsenceRequests(){
 const {orgId}=useAdmin();const qc=useQueryClient();
 const access=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
 const requests=useQuery({queryKey:['absence-requests',orgId],queryFn:()=>orgApi<RequestRow[]>(orgId,'/absence-requests')});
 const locs=useQuery({queryKey:['locations',orgId],queryFn:()=>locations(orgId)});
 const team=useQuery({queryKey:['members',orgId,'absence'],queryFn:()=>members(orgId)});
 const [memberId,setMemberId]=useState(0);const [locationId,setLocationId]=useState(0);
 const [date,setDate]=useState(tomorrow());const [dayOff,setDayOff]=useState(true);
 const [intervals,setIntervals]=useState<Interval[]>([{from:'09:00',to:'13:00'}]);
 const [reason,setReason]=useState('');const [error,setError]=useState('');const [message,setMessage]=useState('');
 const effectiveMember=access.data?.canWrite?(memberId||team.data?.items[0]?.id||0):(access.data?.ownMemberId||0);
 const effectiveLocation=locationId||locs.data?.items[0]?.id||0;
 const save=useMutation({mutationFn:()=>orgApi(orgId,'/absence-requests',json('POST',{
  memberId:effectiveMember,locationId:effectiveLocation,date,intervals:dayOff?[]:intervals,reason
 })),onSuccess:()=>{setError('');setMessage(tr('Žádost byla odeslána.'));void qc.invalidateQueries({queryKey:['absence-requests',orgId]});},onError:e=>setError(safeErrorMessage(e))});
 const decision=useMutation({mutationFn:({id,action}:{id:number;action:'approve'|'reject'})=>orgApi(orgId,`/absence-requests/${id}/${action}`,{method:'POST'}),onSuccess:()=>{setError('');setMessage(tr('Změna byla uložena.'));void qc.invalidateQueries({queryKey:['absence-requests',orgId]});},onError:e=>setError(safeErrorMessage(e))});
 if(access.isLoading)return <Loading/>;
 const canDecide=(row:RequestRow)=>!!access.data?.canWrite || (!!access.data?.canApproveOwnAbsence&&row.member_id===access.data?.ownMemberId);
 return <><PageTitle eyebrow={tr('TÝM A DOSTUPNOST')} title={tr('Žádosti o volno a změny pracovní doby')} description={tr('Pracovník požádá o volno nebo úpravu pracovní doby. Změna se projeví až po schválení, pokud nemá povolené vlastní schvalování.')}/>
 <div className="stack"><Card><h3>{tr('Nová žádost')}</h3><p className="muted small">{access.data?.canApproveOwnAbsence||access.data?.canWrite?tr('Vaše oprávnění umožňuje žádost rovnou schválit.'):tr('Žádost odešlete ke schválení vedoucímu.')}</p><Notice message={error}/><Notice kind="success" message={message}/>
 <div className="form-grid">{access.data?.canWrite&&<Field label={tr('Pracovník')}><Select value={effectiveMember} onChange={e=>setMemberId(Number(e.target.value))}>{team.data?.items.map((m:Member)=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>}
 <Field label={tr('Pobočka')}><Select value={effectiveLocation} onChange={e=>setLocationId(Number(e.target.value))}>{locs.data?.items.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field><Field label={tr('Datum')}><Input type="date" value={date} min={tomorrow()} onChange={e=>setDate(e.target.value)}/></Field></div>
 <label className="setup-check"><input type="checkbox" checked={dayOff} onChange={e=>setDayOff(e.target.checked)}/>{tr('Celý den volno')}</label>
 {!dayOff&&<div className="stack"><p className="muted small">{tr('Zadejte intervaly, kdy tento den pracovník bude pracovat.')}</p>{intervals.map((v,i)=><div className="form-grid" key={i}><Field label={tr('Od')}><Input type="time" value={v.from} onChange={e=>setIntervals(all=>all.map((x,j)=>j===i?{...x,from:e.target.value}:x))}/></Field><Field label={tr('Do')}><Input type="time" value={v.to} onChange={e=>setIntervals(all=>all.map((x,j)=>j===i?{...x,to:e.target.value}:x))}/></Field><Button variant="secondary" onClick={()=>setIntervals(all=>all.filter((_,j)=>j!==i))}>{tr('Odebrat interval')}</Button></div>)}<Button variant="secondary" onClick={()=>setIntervals(all=>[...all,{from:'14:00',to:'18:00'}])}>{tr('Přidat interval')}</Button></div>}
 <Field label={tr('Důvod (volitelné)')}><Input value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></Field><Button disabled={!effectiveMember||!effectiveLocation} loading={save.isPending} onClick={()=>save.mutate()}>{tr('Odeslat žádost')}</Button></Card>
 <Card><h3>{tr('Žádosti')}</h3>{requests.isLoading?<Loading/>:!requests.data?.length?<p className="muted">{tr('Zatím žádné žádosti.')}</p>:<div className="stack">{requests.data.map(row=><div className="setup-item" key={row.id}><strong>{row.member_name} · {formattedDate(row.work_date.slice(0,10))}</strong><p className="muted small">{describeIntervals(row.intervals)} · {row.reason||tr('Bez uvedení důvodu')} · {row.status==='pending'?tr('Čeká na schválení'):row.status==='approved'?tr('Schváleno'):tr('Zamítnuto')}</p>{row.status==='pending'&&canDecide(row)&&<div className="row" style={{display:'flex',gap:8}}><Button loading={decision.isPending} onClick={()=>decision.mutate({id:row.id,action:'approve'})}>{tr('Schválit')}</Button>{access.data?.canWrite&&<Button variant="secondary" loading={decision.isPending} onClick={()=>decision.mutate({id:row.id,action:'reject'})}>{tr('Zamítnout')}</Button>}</div>}</div>)}</div>}</Card></div></>;
}
