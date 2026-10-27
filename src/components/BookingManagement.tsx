import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicCatalog, orgApi, json, locations } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { dateWithZone, today } from '../lib/utils';
import { Button, Field, Input, Loading, Notice, Select } from './UI';
import { tr } from '../lib/translations';
import { useConfirm } from '../contexts/ConfirmContext';

export function CreateTeamBooking({org,publicId,ownMemberId,excludeMemberId,onComplete}:{org:number;publicId:string;ownMemberId?:number;excludeMemberId?:number;onComplete:()=>void}){
 const qc=useQueryClient();const [date,setDate]=useState(today());const [time,setTime]=useState('09:00');
 const [locationId,setLocationId]=useState(0);const [serviceId,setServiceId]=useState(0);const [memberId,setMemberId]=useState(0);
 const [staffIds,setStaffIds]=useState<number[]>([]);
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [phone,setPhone]=useState('');const [error,setError]=useState('');
 const catalog=useQuery({queryKey:['public-catalog',publicId,date],queryFn:()=>publicCatalog(publicId,date)});
 const ownLocationIds=new Set((catalog.data?.members||[]).filter(m=>m.id===ownMemberId).map(m=>m.location_id));
 const availableLocations=(catalog.data?.locations||[]).filter(l=>!ownMemberId||ownLocationIds.has(l.id));
 const selectedLocationId=locationId||(ownMemberId?availableLocations[0]?.id||0:(availableLocations.length===1?availableLocations[0].id:0));
 const location=catalog.data?.locations.find(l=>l.id===selectedLocationId);
 const service=catalog.data?.services.find(s=>s.id===serviceId);
 const available=(catalog.data?.services||[]).filter(s=>s.locationIds.some(id=>Number(id)===selectedLocationId));
 const workers=(catalog.data?.members||[]).filter(m=>m.location_id===selectedLocationId&&m.service_id===serviceId&&(!ownMemberId||m.id===ownMemberId)&&(!excludeMemberId||m.id!==excludeMemberId)).filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i);
 const needsWorker=service?.requirements.length===0;
 const needsStaff=!!service?.requirements.some(r=>r.category==='staff');
 const requiredStaffCount=service?.required_staff_count??1;
 const incompleteStaffSelection=needsStaff&&requiredStaffCount>1&&staffIds.length>0&&staffIds.length!==requiredStaffCount;
 const ownCannotBookMultiStaff=!!ownMemberId&&needsStaff&&requiredStaffCount>1;
 const create=useMutation({mutationFn:()=>orgApi(org,'/reservations',json('POST',{
  organizationId:org,locationId:selectedLocationId,serviceId,startsAt:dateWithZone(date,time,location!.timezone),
  preferredMemberId:ownMemberId??(needsStaff&&requiredStaffCount>1?null:(memberId||null)),
  ...(needsStaff&&requiredStaffCount>1&&staffIds.length===requiredStaffCount?{preferredMemberIds:staffIds}:{}),
  customerName:name,customerEmail:email||null,customerPhone:phone||null
 })),onSuccess:()=>{setError('');void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});onComplete();},onError:e=>setError(safeErrorMessage(e))});
 return <div className="stack"><Notice message={error}/>{catalog.isLoading?<Loading/>:<>
 <Field label={tr('Location')}><Select value={selectedLocationId} onChange={e=>{setLocationId(Number(e.target.value));setServiceId(0);setMemberId(0);setStaffIds([]);}}><option value={0}>—</option>{availableLocations.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</Select></Field>
 <Field label={tr('Service')}><Select value={serviceId} onChange={e=>{setServiceId(Number(e.target.value));setMemberId(0);setStaffIds([]);}}><option value={0}>—</option>{available.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
 {ownMemberId?<p className="muted small">{tr('Booking assigned to you.')}</p>:<Field label={tr('Staff member')}><Select value={memberId} onChange={e=>setMemberId(Number(e.target.value))}><option value={0}>{needsWorker?tr('Choose a staff member'):tr('Automatically by availability')}</option>{workers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>}
 {needsStaff&&requiredStaffCount>1&&!ownMemberId&&<Field label={tr('Select all required staff members')}><Select multiple value={staffIds.map(String)} onChange={e=>setStaffIds(Array.from(e.target.selectedOptions,option=>Number(option.value)))}>{workers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>}
 {ownCannotBookMultiStaff&&<p className="muted small">{tr('This service requires multiple staff members and cannot be booked from your own-only account.')}</p>}
 <div className="form-grid"><Field label={tr('Date')}><Input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label={tr('Time')}><Input type="time" value={time} onChange={e=>setTime(e.target.value)}/></Field></div>
 <Field label={tr('Customer name')}><Input value={name} required onChange={e=>setName(e.target.value)}/></Field>
 <Field label={tr('Customer email (optional)')}><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
 <Field label={tr('Phone (optional)')}><Input value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
 <p className="muted small">{tr('Availability is checked before saving. Team bookings cannot overlap.')}</p>
 <Button loading={create.isPending} disabled={!location||!service||!name.trim()||(needsWorker&&!memberId&&!ownMemberId)||incompleteStaffSelection||ownCannotBookMultiStaff||(needsStaff&&requiredStaffCount>1&&staffIds.length!==0&&staffIds.length!==requiredStaffCount)} onClick={()=>create.mutate()}>{tr('Create booking')}</Button>
 </>}</div>;
}

export function BookingStatusActions({org,id,status,onChanged}:{org:number;id:number;status:string;onChanged:()=>void|Promise<void>}){
 const confirm=useConfirm();
 const [error,setError]=useState('');
 const action=useMutation({mutationFn:(next:string)=>orgApi(org,`/reservations/${id}/status`,json('PUT',{status:next})),onSuccess:async()=>{setError('');await onChanged();},onError:e=>setError(safeErrorMessage(e))});
 const allowed=status==='pending'?['confirmed','cancelled']:status==='confirmed'?['completed','no_show','cancelled']:[];
 const labels:Record<string,string>={confirmed:'Potvrdit',completed:'Dokončit',no_show:'Nedostavil se',cancelled:'Zrušit rezervaci'};
 return allowed.length?<div className="stack"><Notice message={error}/><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{allowed.map(next=><Button key={next} variant={next==='cancelled'?'secondary':'primary'} loading={action.isPending} onClick={async()=>{if(next!=='cancelled'||await confirm(tr('Are you sure you want to cancel this booking?')))action.mutate(next);}}>{tr(labels[next])}</Button>)}</div></div>:null;
}

/** Safely reschedule only a single legacy worker appointment; new resource allocations remain immutable. */
export function MoveTeamBooking({org,id,item,onChanged}:{org:number;id:number;item:Record<string,unknown>;onChanged:()=>void|Promise<void>}) {
 const [editing,setEditing]=useState(false);
 const [date,setDate]=useState('');const [time,setTime]=useState('');const [error,setError]=useState('');
 const branches=useQuery({queryKey:['locations',org],queryFn:()=>locations(org)});
 const loc=branches.data?.items.find(x=>x.id===Number(item.location_id));
 const mutation=useMutation({mutationFn:()=>orgApi(org,`/reservations/${id}/reschedule`,json('PUT',{
  startsAt:dateWithZone(date,time,loc?.timezone||'Europe/Prague')
 })),onSuccess:async()=>{setError('');setEditing(false);await onChanged();},onError:e=>setError(safeErrorMessage(e))});
 const open=()=>{
  const zoned=new Intl.DateTimeFormat('en-CA',{timeZone:loc?.timezone||'Europe/Prague',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
    .formatToParts(new Date(String(item.starts_at)));
  const parts=Object.fromEntries(zoned.map(p=>[p.type,p.value]));
  setDate(`${parts.year}-${parts.month}-${parts.day}`);
  setTime(`${parts.hour}:${parts.minute}`);setEditing(true);setError('');
 };
 return <div className="stack"><Button variant="secondary" onClick={()=>editing?setEditing(false):open()}>
  {tr('Reschedule booking')}</Button>{editing&&<div className="stack"><Notice message={error}/>
  <p className="muted small">{tr('Choose a new date and time. We will check staff availability before saving.')}</p>
  <div className="form-grid"><Field label={tr('Date')}><Input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)}/></Field>
  <Field label={tr('Time')}><Input type="time" value={time} onChange={e=>setTime(e.target.value)}/></Field></div>
  <Button loading={mutation.isPending} disabled={!date||!time||!loc} onClick={()=>mutation.mutate()}>{tr('Save new time')}</Button>
 </div>}</div>;
}
