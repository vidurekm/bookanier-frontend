import { useState } from 'react';
import { PeriodPicker } from '../components/PeriodPicker';
import { AddTimeIntervalButton, TimeIntervalRows, type TimeInterval } from '../components/TimeIntervalEditor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '../lib/useAdmin';
import { myAccess } from '../lib/access';
import { orgApi, json, members } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { Button, Card, Field, Input, Loading, Notice, PageTitle, Select } from '../components/UI';
import { tr } from '../lib/translations';
import type { Location, Member } from '../lib/types';
import { formattedDate } from '../lib/dateFormat';
import { singleActiveLocationId } from '../lib/locationSelection';
import { sortByName } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

type RequestRow={id:number;member_id:number;location_id:number;work_date:string;intervals:string;reason:string|null;status:'pending'|'approved'|'rejected';member_name:string;created_at:string};
function describeIntervals(value:string):string {
 try {
  const parsed=JSON.parse(value) as unknown;
  if(!Array.isArray(parsed))return tr('Working hours change');
  if(parsed.length===0)return tr('Day off');
  return parsed.filter((x):x is TimeInterval=>typeof x==='object'&&x!==null&&typeof x.from==='string'&&typeof x.to==='string')
    .map(x=>`${x.from.slice(0,5)}–${x.to.slice(0,5)}`).join(', ');
 } catch{return tr('Working hours change');}
}
const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};

export function AdminAbsenceRequests(){
 const {orgId}=useAdmin();const qc=useQueryClient();const notify=useToast();
 const access=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId)});
 const requests=useQuery({queryKey:['absence-requests',orgId],queryFn:()=>orgApi<RequestRow[]>(orgId,'/absence-requests')});
 const locs=useQuery({queryKey:['absence-locations',orgId],queryFn:()=>orgApi<Location[]>(orgId,'/absence-requests/locations')});
 const team=useQuery({queryKey:['members',orgId,'absence'],queryFn:()=>members(orgId)});
 const [memberId,setMemberId]=useState(0);const [locationId,setLocationId]=useState(0);
 const [date,setDate]=useState(tomorrow());const [dayOff,setDayOff]=useState(true);
 const [intervals,setIntervals]=useState<TimeInterval[]>([{from:'09:00',to:'13:00'}]);
 const [reason,setReason]=useState('');
 const sortedTeam=sortByName(team.data?.items||[],member=>member.display_name);
 const effectiveMember=access.data?.canWrite?(memberId||sortedTeam[0]?.id||0):(access.data?.ownMemberId||0);
 const availableLocations=locs.data||[];
 const effectiveLocation=availableLocations.some(l=>l.id===locationId)?locationId:singleActiveLocationId(availableLocations)||availableLocations[0]?.id||0;
 const save=useMutation({mutationFn:()=>orgApi(orgId,'/absence-requests',json('POST',{
  memberId:effectiveMember,locationId:effectiveLocation,date,intervals:dayOff?[]:intervals,reason
 })),onSuccess:()=>{notify(tr('Request submitted.'));void qc.invalidateQueries({queryKey:['absence-requests',orgId]});},onError:e=>notify(safeErrorMessage(e),'error')});
 const decision=useMutation({mutationFn:({id,action}:{id:number;action:'approve'|'reject'})=>orgApi(orgId,`/absence-requests/${id}/${action}`,{method:'POST'}),onSuccess:()=>{notify(tr('Change saved.'));void qc.invalidateQueries({queryKey:['absence-requests',orgId]});},onError:e=>notify(safeErrorMessage(e),'error')});
 if(access.isLoading)return <Loading/>;
 const canDecide=(row:RequestRow)=>!!access.data?.canWrite || (!!access.data?.canApproveOwnAbsence&&row.member_id===access.data?.ownMemberId);
 return <><PageTitle eyebrow={tr('TEAM & AVAILABILITY')} title={tr('Time off and working hours requests')} description={tr('Employees can request time off or changes to working hours. Approval is needed unless self-approval is enabled.')}/>
 <div className="stack"><Card><div className="stack">
 <div><h3>{tr('New request')}</h3><p className="muted small">{access.data?.canApproveOwnAbsence||access.data?.canWrite?tr('Your permissions allow immediate approval.'):tr('Your request will be sent to a manager for approval.')}</p></div>
 {locs.isError&&<Notice message={safeErrorMessage(locs.error)}/>}
 {!locs.isError&&locs.data?.length===0&&<Notice message={tr('You have no active location assigned.')}/>}
 <div className="form-grid">{access.data?.canWrite&&<Field label={tr('Staff member')}><Select value={effectiveMember} onChange={e=>setMemberId(Number(e.target.value))}>{sortedTeam.map((m:Member)=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>}
 {!locs.isError&&locs.data?.length!==0&&<Field label={tr('Location')}><Select value={effectiveLocation} onChange={e=>setLocationId(Number(e.target.value))}>{locs.data?.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>}<Field label={tr('Date')}><PeriodPicker mode="day" field label={tr('Date')} value={date} minDate={tomorrow()} minYear={new Date().getFullYear()} maxYear={new Date().getFullYear()+2} onChange={setDate}/></Field></div>
 <label className="setup-check"><input type="checkbox" checked={dayOff} onChange={e=>setDayOff(e.target.checked)}/>{tr('Day off')}</label>
 {!dayOff&&<div className="stack"><p className="muted small">{tr('Enter the hours the employee will work on this day.')}</p><div className="absence-intervals"><TimeIntervalRows intervals={intervals} onChange={setIntervals} rowClassName="absence-interval" showLabels/><AddTimeIntervalButton className="absence-add-interval" onClick={()=>setIntervals(all=>[...all,{from:'14:00',to:'18:00'}])}/></div></div>}
 <Field label={tr('Reason (optional)')}><Input value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></Field><Button className="absence-submit" disabled={!effectiveMember||!effectiveLocation||locs.isError||locs.isLoading||!locs.data?.length} loading={save.isPending} onClick={()=>save.mutate()}>{tr('Submit request')}</Button></div></Card>
 <Card><h3>{tr('Requests')}</h3>{requests.isLoading?<Loading/>:!requests.data?.length?<p className="muted">{tr('No requests yet.')}</p>:<div className="stack">{requests.data.map(row=><div className="setup-item" key={row.id}><strong>{row.member_name} · {formattedDate(row.work_date.slice(0,10))}</strong><p className="muted small">{describeIntervals(row.intervals)} · {row.reason||tr('No reason given')} · {row.status==='pending'?tr('Pending approval'):row.status==='approved'?tr('Approved'):tr('Rejected')}</p>{row.status==='pending'&&canDecide(row)&&<div className="row" style={{display:'flex',gap:8}}><Button loading={decision.isPending&&decision.variables?.id===row.id&&decision.variables?.action==='approve'} disabled={decision.isPending} onClick={()=>decision.mutate({id:row.id,action:'approve'})}>{tr('Approve')}</Button>{access.data?.canWrite&&<Button variant="secondary" loading={decision.isPending&&decision.variables?.id===row.id&&decision.variables?.action==='reject'} disabled={decision.isPending} onClick={()=>decision.mutate({id:row.id,action:'reject'})}>{tr('Reject')}</Button>}</div>}</div>)}</div>}</Card></div></>;
}
