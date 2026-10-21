import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicCatalog, orgApi, json, locations } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { dateWithZone, today } from '../lib/utils';
import { Button, Field, Input, Loading, Notice, Select } from './UI';
import { tr } from '../lib/translations';

export function CreateTeamBooking({org,publicId,onComplete}:{org:number;publicId:string;onComplete:()=>void}){
 const qc=useQueryClient();const [date,setDate]=useState(today());const [time,setTime]=useState('09:00');
 const [locationId,setLocationId]=useState(0);const [serviceId,setServiceId]=useState(0);const [memberId,setMemberId]=useState(0);
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [phone,setPhone]=useState('');const [error,setError]=useState('');
 const catalog=useQuery({queryKey:['public-catalog',publicId,date],queryFn:()=>publicCatalog(publicId,date)});
 const location=catalog.data?.locations.find(l=>l.id===locationId);
 const service=catalog.data?.services.find(s=>s.id===serviceId);
 const available=(catalog.data?.services||[]).filter(s=>s.locationIds.some(id=>Number(id)===locationId));
 const workers=(catalog.data?.members||[]).filter(m=>m.location_id===locationId&&m.service_id===serviceId).filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i);
 const needsWorker=service?.requirements.length===0;
 const create=useMutation({mutationFn:()=>orgApi(org,'/reservations',json('POST',{
  organizationId:org,locationId,serviceId,startsAt:dateWithZone(date,time,location!.timezone),
  preferredMemberId:memberId||null,customerName:name,customerEmail:email||null,customerPhone:phone||null
 })),onSuccess:()=>{setError('');void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});onComplete();},onError:e=>setError(safeErrorMessage(e))});
 return <div className="stack"><Notice message={error}/>{catalog.isLoading?<Loading/>:<>
 <Field label={tr('Pobočka')}><Select value={locationId} onChange={e=>{setLocationId(Number(e.target.value));setServiceId(0);setMemberId(0);}}><option value={0}>—</option>{catalog.data?.locations.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</Select></Field>
 <Field label={tr('Služba')}><Select value={serviceId} onChange={e=>{setServiceId(Number(e.target.value));setMemberId(0);}}><option value={0}>—</option>{available.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
 <Field label={tr('Pracovník')}><Select value={memberId} onChange={e=>setMemberId(Number(e.target.value))}><option value={0}>{needsWorker?tr('Vyberte pracovníka'):tr('Automaticky podle dostupnosti')}</option>{workers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>
 <div className="form-grid"><Field label={tr('Datum')}><Input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label={tr('Čas')}><Input type="time" value={time} onChange={e=>setTime(e.target.value)}/></Field></div>
 <Field label={tr('Jméno zákazníka')}><Input value={name} required onChange={e=>setName(e.target.value)}/></Field>
 <Field label={tr('E-mail zákazníka (nepovinné)')}><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
 <Field label={tr('Telefon (nepovinné)')}><Input value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
 <p className="muted small">{tr('Před uložením se znovu ověří dostupnost služby a pracovníka. Rezervace jiných kolegů nelze překrýt.')}</p>
 <Button loading={create.isPending} disabled={!location||!service||!name.trim()||(needsWorker&&!memberId)} onClick={()=>create.mutate()}>{tr('Vytvořit rezervaci')}</Button>
 </>}</div>;
}

export function BookingStatusActions({org,id,status,onChanged}:{org:number;id:number;status:string;onChanged:()=>void}){
 const [error,setError]=useState('');
 const action=useMutation({mutationFn:(next:string)=>orgApi(org,`/reservations/${id}/status`,json('PUT',{status:next})),onSuccess:()=>{setError('');onChanged();},onError:e=>setError(safeErrorMessage(e))});
 const allowed=status==='pending'?['confirmed','cancelled']:status==='confirmed'?['completed','no_show','cancelled']:[];
 const labels:Record<string,string>={confirmed:'Potvrdit',completed:'Dokončit',no_show:'Nedostavil se',cancelled:'Zrušit rezervaci'};
 return allowed.length?<div className="stack"><Notice message={error}/><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{allowed.map(next=><Button key={next} variant={next==='cancelled'?'secondary':'primary'} loading={action.isPending} onClick={()=>{if(next!=='cancelled'||window.confirm(tr('Opravdu zrušit tuto rezervaci?')))action.mutate(next);}}>{tr(labels[next])}</Button>)}</div></div>:null;
}

/** Safely reschedule only a single legacy worker appointment; new resource allocations remain immutable. */
export function MoveTeamBooking({org,id,item,onChanged}:{org:number;id:number;item:Record<string,unknown>;onChanged:()=>void}) {
 const [editing,setEditing]=useState(false);
 const [date,setDate]=useState('');const [time,setTime]=useState('');const [error,setError]=useState('');
 const branches=useQuery({queryKey:['locations',org],queryFn:()=>locations(org)});
 const loc=branches.data?.items.find(x=>x.id===Number(item.location_id));
 const mutation=useMutation({mutationFn:()=>orgApi(org,`/reservations/${id}/reschedule`,json('PUT',{
  startsAt:dateWithZone(date,time,loc?.timezone||'Europe/Prague')
 })),onSuccess:()=>{setError('');setEditing(false);onChanged();},onError:e=>setError(safeErrorMessage(e))});
 const open=()=>{
  const zoned=new Intl.DateTimeFormat('en-CA',{timeZone:loc?.timezone||'Europe/Prague',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
    .formatToParts(new Date(String(item.starts_at)));
  const parts=Object.fromEntries(zoned.map(p=>[p.type,p.value]));
  setDate(`${parts.year}-${parts.month}-${parts.day}`);
  setTime(`${parts.hour}:${parts.minute}`);setEditing(true);setError('');
 };
 return <div className="stack"><Button variant="secondary" onClick={()=>editing?setEditing(false):open()}>
  {tr('Přesunout termín')}</Button>{editing&&<div className="stack"><Notice message={error}/>
  <p className="muted small">{tr('Vyberte nové datum a čas. Před uložením ověříme volný termín pracovníka.')}</p>
  <div className="form-grid"><Field label={tr('Datum')}><Input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)}/></Field>
  <Field label={tr('Čas')}><Input type="time" value={time} onChange={e=>setTime(e.target.value)}/></Field></div>
  <Button loading={mutation.isPending} disabled={!date||!time||!loc} onClick={()=>mutation.mutate()}>{tr('Uložit nový termín')}</Button>
 </div>}</div>;
}
