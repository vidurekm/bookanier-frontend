import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicCatalog, backofficeSlots, backofficeUnavailableDays, orgApi, json, locations, resources, rescheduleAvailability, rescheduleOptions } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { dateWithZone, sortByName, today } from '../lib/utils';
import { Button, Field, Input, Loading, Modal, Select } from './UI';
import { tr } from '../lib/translations';
import { useConfirm } from '../contexts/ConfirmContext';
import { getSetup } from '../lib/setup';
import { PeriodPicker } from './PeriodPicker';
import { useToast } from '../contexts/ToastContext';

export function CreateTeamBooking({org,publicId,ownMemberId,excludeMemberId,onComplete}:{org:number;publicId:string;ownMemberId?:number;excludeMemberId?:number;onComplete:()=>void}){
 const notify=useToast();
 const qc=useQueryClient();const [date,setDate]=useState(today());const [selectedSlot,setSelectedSlot]=useState('');
 const [partySize,setPartySize]=useState(2);const [quantity,setQuantity]=useState(1);
 const [locationId,setLocationId]=useState(0);const [serviceId,setServiceId]=useState(0);const [memberId,setMemberId]=useState(0);
 const [staffIds,setStaffIds]=useState<number[]>([]);const [resourceId,setResourceId]=useState(0);
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [phone,setPhone]=useState('');
 const catalog=useQuery({queryKey:['public-catalog',publicId,date],queryFn:()=>publicCatalog(publicId,date),placeholderData:keepPreviousData});
 const ownLocationIds=new Set((catalog.data?.members||[]).filter(m=>m.id===ownMemberId).map(m=>m.location_id));
 const availableLocations=(catalog.data?.locations||[]).filter(l=>!ownMemberId||ownLocationIds.has(l.id));
 const selectedLocationId=locationId||(ownMemberId?availableLocations[0]?.id||0:(availableLocations.length===1?availableLocations[0].id:0));
 const location=catalog.data?.locations.find(l=>l.id===selectedLocationId);
 const service=catalog.data?.services.find(s=>s.id===serviceId);
 const available=(catalog.data?.services||[]).filter(s=>s.locationIds.some(id=>Number(id)===selectedLocationId));
 const workers=(catalog.data?.members||[]).filter(m=>m.location_id===selectedLocationId&&m.service_id===serviceId&&(!ownMemberId||m.id===ownMemberId)&&(!excludeMemberId||m.id!==excludeMemberId)).filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i);
 const needsWorker=service?.requirements.length===0;
 const needsStaff=!!service?.requirements.some(r=>r.category==='staff');
 const pickMember=!needsStaff;
 const requiredStaffCount=service?.required_staff_count??1;
 const nonStaffRequirements=(service?.requirements||[]).filter(r=>r.category!=='staff');
 const needsPartySize=!!service?.requirements.some(r=>r.category==='space');
 const setup=useQuery({queryKey:['setup',org],queryFn:()=>getSetup(org)});
 const needsQuantity=setup.data?.booking_model!=='APPOINTMENT'&&nonStaffRequirements.length===1&&nonStaffRequirements[0].category==='equipment';
 const trackResources=setup.data?.settings.trackResources===true;
 const storedWeekStart=Number(setup.data?.settings.weekStartsOn);
 const weekStartDay=(Number.isInteger(storedWeekStart)&&storedWeekStart>=1&&storedWeekStart<=7?storedWeekStart:1)%7;
 const currentYear=new Date().getFullYear();
 const canChooseStaff=!ownMemberId;
 const canChooseResource=trackResources&&nonStaffRequirements.length===1&&nonStaffRequirements[0].quantity===1&&(!needsQuantity||quantity===1);
 const resourceOptions=useQuery({queryKey:['backoffice-resources',org,selectedLocationId],
  queryFn:()=>resources(org,selectedLocationId),
  enabled:!!selectedLocationId&&!!serviceId&&canChooseResource});
 const [pickerView,setPickerView]=useState<{year:number;month:number}|null>(null);
 const unavailableDays=useQuery({queryKey:['unavailable-days',org,selectedLocationId,serviceId,pickerView?.year,pickerView?.month,needsPartySize?partySize:undefined,needsQuantity?quantity:undefined],
  queryFn:()=>{const last=new Date(pickerView!.year,pickerView!.month,0).getDate();const prefix=`${pickerView!.year}-${String(pickerView!.month).padStart(2,'0')}`;
   return backofficeUnavailableDays(org,selectedLocationId,serviceId,`${prefix}-01`,`${prefix}-${String(last).padStart(2,'0')}`,needsPartySize?partySize:undefined,needsQuantity?quantity:undefined);},
  enabled:!!selectedLocationId&&!!serviceId&&!!pickerView,placeholderData:keepPreviousData});
 const availabilityQuery=useQuery({queryKey:['new-booking-slots',org,selectedLocationId,serviceId,date,
  needsPartySize?partySize:undefined,needsQuantity?quantity:undefined],
  queryFn:()=>backofficeSlots(org,selectedLocationId,serviceId,date,
   needsPartySize?partySize:undefined,needsQuantity?quantity:undefined),enabled:!!selectedLocationId&&!!serviceId});
 const hasStaffSelection=needsStaff&&canChooseStaff&&staffIds.length>0;
 const staffSelectionComplete=!needsStaff||staffIds.length===0||staffIds.length===requiredStaffCount;
 const availabilityChoices={
  ...(pickMember&&memberId?{preferredMemberIds:[memberId]}:
   hasStaffSelection&&staffSelectionComplete?{preferredMemberIds:staffIds}:{}),
  ...(resourceId&&canChooseResource?{preferredResourceId:resourceId}:{})
 };
 const hasAvailabilityChoices=Object.keys(availabilityChoices).length>0;
 const selectedAvailability=useQuery({queryKey:['new-booking-slots',org,selectedLocationId,serviceId,date,
  needsPartySize?partySize:undefined,needsQuantity?quantity:undefined,staffIds.join(','),memberId,resourceId,ownMemberId],
  queryFn:()=>backofficeSlots(org,selectedLocationId,serviceId,date,
   needsPartySize?partySize:undefined,needsQuantity?quantity:undefined,availabilityChoices),
  enabled:!!selectedLocationId&&!!serviceId&&hasAvailabilityChoices});
 const candidateSlots=hasAvailabilityChoices?selectedAvailability.data?.slots:availabilityQuery.data?.slots;
 const slots=(candidateSlots||[]).filter(slot=>{
  const assignable=slot.memberIds.filter(id=>!excludeMemberId||id!==excludeMemberId);
  if(ownMemberId&&!assignable.includes(ownMemberId))return false;
  const required=needsStaff?requiredStaffCount:needsWorker?1:0;
  return assignable.length>=required;
 });
 const availableMemberIds=[...new Set((availabilityQuery.data?.slots||[]).flatMap(slot=>slot.memberIds))]
  .filter(id=>id!==excludeMemberId);
 const availableResourceIds=[...new Set((availabilityQuery.data?.slots||[]).flatMap(slot=>slot.resourceIds||[]))];
 const visibleWorkers=sortByName(workers.filter(worker=>availableMemberIds.includes(worker.id)),worker=>worker.display_name);
 const visibleResources=sortByName((resourceOptions.data||[]).filter(resource=>availableResourceIds.includes(resource.id)),resource=>resource.name);
 const selectedTimeSlot=(slots||[]).find(slot=>slot.startsAt===selectedSlot);
 const ownCannotBookMultiStaff=!!ownMemberId&&needsStaff&&requiredStaffCount>1;
 const create=useMutation({mutationFn:()=>orgApi(org,'/reservations',json('POST',{
  organizationId:org,locationId:selectedLocationId,serviceId,startsAt:selectedTimeSlot!.startsAt,
  preferredMemberId:ownMemberId??(pickMember?(memberId||selectedTimeSlot!.memberIds.find(id=>id!==excludeMemberId)||null):
   (needsStaff&&staffIds.length===1?staffIds[0]:null)),
  ...(needsStaff&&staffIds.length===requiredStaffCount&&staffIds.length>0?{preferredMemberIds:staffIds}:{}),
  ...(resourceId?{preferredResourceId:resourceId}:{}),
  ...(needsPartySize?{partySize}:{}),
  ...(needsQuantity?{quantity}:{}),
  ...(excludeMemberId?{excludedMemberIds:[excludeMemberId]}:{}),
  customerName:name,customerEmail:email||null,customerPhone:phone||null
 })),onSuccess:()=>{notify(tr('Booking created successfully.'));void qc.invalidateQueries({queryKey:['reservations',org]});void qc.invalidateQueries({queryKey:['calendar',org]});onComplete();},onError:e=>notify(safeErrorMessage(e),'error')});
 useEffect(()=>{const error=selectedAvailability.error||availabilityQuery.error;if(error)notify(safeErrorMessage(error),'error');},[availabilityQuery.error,notify,selectedAvailability.error]);
 return <div className="stack new-booking-form">{catalog.isLoading?<Loading/>:<>
 <div className="form-grid"><Field label={tr('Location')}><Select value={selectedLocationId} onChange={e=>{setLocationId(Number(e.target.value));setServiceId(0);setMemberId(0);setStaffIds([]);setResourceId(0);setSelectedSlot('');}}><option value={0}>—</option>{availableLocations.map(l=><option value={l.id} key={l.id}>{l.name}</option>)}</Select></Field>
 <Field label={tr('Service')}><Select value={serviceId} onChange={e=>{const next=available.find(s=>s.id===Number(e.target.value));setServiceId(Number(e.target.value));setMemberId(0);setStaffIds([]);setResourceId(0);setQuantity(next?.requirements.find(r=>r.category==='equipment')?.quantity||1);setPartySize(2);setSelectedSlot('');}}><option value={0}>—</option>{available.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
 <Field label={tr('Date')}><PeriodPicker field mode="day" label={tr('Select date')} value={date} weekStartDay={weekStartDay} minDate={today()} unavailableDays={unavailableDays.data} onViewChange={(year,month)=>setPickerView({year,month})} minYear={currentYear} maxYear={currentYear+2} onChange={value=>{setDate(value);setSelectedSlot('');}}/></Field>
 {needsPartySize?<Field label={tr('Party size')}><Input type="number" min={1} max={100} value={partySize} onChange={e=>{setPartySize(Math.max(1,Math.min(100,Number(e.target.value)||1)));setSelectedSlot('');}}/></Field>:needsQuantity?<Field label={tr('Quantity')}><Input type="number" min={nonStaffRequirements[0]?.quantity||1} max={100} value={quantity} onChange={e=>{setQuantity(Math.max(nonStaffRequirements[0]?.quantity||1,Math.min(100,Number(e.target.value)||1)));setSelectedSlot('');if(Number(e.target.value)>1)setResourceId(0);}}/></Field>:<div/>}
 {ownMemberId?<p className="muted small">{tr('Booking assigned to you.')}</p>:needsStaff&&requiredStaffCount>1?<Field label={tr('Select all required staff members')}><Select multiple value={staffIds.map(String)} onChange={e=>{setStaffIds(Array.from(e.target.selectedOptions,option=>Number(option.value)));setSelectedSlot('');}}>{visibleWorkers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>:<Field label={tr('Staff member')}><Select disabled={!serviceId} value={pickMember?memberId:staffIds[0]||0} onChange={e=>{const id=Number(e.target.value);if(pickMember)setMemberId(id);else setStaffIds(id?[id]:[]);setSelectedSlot('');}}><option value={0}>{tr('Automatically by availability')}</option>{visibleWorkers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>}
 {trackResources&&<Field label={tr('Resource')}><Select disabled={!canChooseResource} value={resourceId} onChange={e=>{setResourceId(Number(e.target.value));setSelectedSlot('');}}><option value={0}>{tr('Automatically by availability')}</option>{visibleResources.map(resource=><option key={resource.id} value={resource.id}>{resource.name}</option>)}</Select></Field>}
 </div>
 {ownCannotBookMultiStaff&&<p className="muted small">{tr('This service requires multiple staff members and cannot be booked from your own-only account.')}</p>}
 {!!selectedLocationId&&!!serviceId&&<div className="stack"><strong>{tr('Available start times')}</strong>
  {availabilityQuery.isLoading||hasAvailabilityChoices&&selectedAvailability.isLoading?<Loading label={tr('Checking availability…')}/>:selectedAvailability.error||availabilityQuery.error?
   null:slots?.length?
    <div className="reschedule-slots" aria-label={tr('Available times')}>{slots.map(slot=><Button type="button" key={slot.startsAt}
     variant={selectedSlot===slot.startsAt?'primary':'secondary'} aria-pressed={selectedSlot===slot.startsAt}
     onClick={()=>setSelectedSlot(slot.startsAt)}>{slot.time.slice(0,5)}</Button>)}</div>:
    <p className="muted small">{noSlotsReason((selectedAvailability.data||availabilityQuery.data)?.reason)}</p>}
 </div>}
 <div className="form-grid">
 <div style={{gridColumn:'1/-1'}}><Field label={tr('Customer name')}><Input value={name} required onChange={e=>setName(e.target.value)}/></Field></div>
 <Field label={tr('Email')}><Input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
 <Field label={tr('Phone')}><Input value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
 </div>
 <p className="muted small">{tr('Availability is checked before saving. Team bookings cannot overlap.')}</p>
 <div className="form-actions"><Button loading={create.isPending} disabled={!location||!service||!name.trim()||!selectedTimeSlot||ownCannotBookMultiStaff||!staffSelectionComplete} onClick={()=>create.mutate()}>{tr('Create booking')}</Button></div>
 </>}</div>;
}

function noSlotsReason(reason?:string){
 return tr(reason==='closed'?'No available times: the location is closed on this day. Try another date.':reason==='timing'?'No available times: the remaining times are too soon or too far ahead for booking. Try another date.':reason==='booked'?'No available times: all opening hours are already booked or blocked. Try another date.':reason==='out_of_range'?'No available times: the date is outside the supported range.':reason==='resources_changed'?'No available times: the staff or resources of this booking changed and it cannot be moved automatically.':'No available times for this date. Try another date.');
}

export function BookingStatusActions({org,id,status,item,canMarkNoShow,onChanged,onActionComplete}:{org:number;id:number;status:string;item?:Record<string,unknown>;canMarkNoShow:boolean;onChanged:()=>void|Promise<void>;onActionComplete:()=>void}) {
 const confirm=useConfirm();
 const notify=useToast();
 const action=useMutation({mutationFn:(next:string)=>orgApi(org,`/reservations/${id}/status`,json('PUT',{status:next})),onSuccess:async(_data,next)=>{notify(next==='cancelled'?tr('Booking cancelled successfully.'):tr('Booking updated successfully.'));await onChanged();onActionComplete();},onError:e=>notify(safeErrorMessage(e),'error')});
 const [editing,setEditing]=useState(false);
 const [date,setDate]=useState('');const [time,setTime]=useState('');
 const [initialStart,setInitialStart]=useState('');
 const branches=useQuery({queryKey:['locations',org],queryFn:()=>locations(org),enabled:item?.location_id!=null});
 const loc=branches.data?.items.find(x=>x.id===Number(item?.location_id));
 const options=useQuery({queryKey:['reschedule-options',org,id],queryFn:()=>rescheduleOptions(org,id),enabled:editing});
 const setup=useQuery({queryKey:['setup',org],queryFn:()=>getSetup(org),enabled:editing});
 const [memberChoice,setMemberChoice]=useState<number|null>(null);const [memberChoices,setMemberChoices]=useState<number[]|null>(null);const [resourceChoice,setResourceChoice]=useState<number|null>(null);
 const showStaff=!!options.data&&options.data.staffCount>0&&options.data.members.length>0;
 const showResource=!!options.data&&setup.data?.settings.trackResources===true&&options.data.resources.length>0;
 const effMember=memberChoice??options.data?.currentMemberIds[0]??0;
 const effResource=resourceChoice??options.data?.currentResourceId??0;
 const selectedMemberIds=memberChoices??options.data?.currentMemberIds??[];
 const rescheduleDirty=!!loc&&!!date&&!!time&&!!options.data&&(
  `${date}T${time}`!==initialStart||
  showStaff&&(options.data.staffCount>1
   ? selectedMemberIds.length!==options.data.currentMemberIds.length||
     selectedMemberIds.some(id=>!options.data!.currentMemberIds.includes(id))
   : effMember!==(options.data.currentMemberIds[0]??0))||
  showResource&&effResource!==(options.data.currentResourceId??0));
 const rescheduleMembers=sortByName(options.data?.members||[],member=>member.display_name);
 const rescheduleResources=sortByName(options.data?.resources||[],resource=>resource.name);
 const memberIds=showStaff
  ? options.data.staffCount>1?selectedMemberIds:effMember?[effMember]:undefined
  : undefined;
 const staffSelectionComplete=!showStaff||options.data!.staffCount<=1||
  selectedMemberIds.length===options.data!.staffCount;
 const storedWeekStart=Number(setup.data?.settings.weekStartsOn);
 const weekStartDay=(Number.isInteger(storedWeekStart)&&storedWeekStart>=1&&storedWeekStart<=7?storedWeekStart:1)%7;
 const currentYear=new Date().getFullYear();
 const [pickerView,setPickerView]=useState<{year:number;month:number}|null>(null);
 const unavailableDays=useQuery({queryKey:['reschedule-unavailable-days',org,item?.location_id,item?.service_id,pickerView?.year,pickerView?.month],
  queryFn:()=>{const last=new Date(pickerView!.year,pickerView!.month,0).getDate();const prefix=`${pickerView!.year}-${String(pickerView!.month).padStart(2,'0')}`;
   return backofficeUnavailableDays(org,Number(item?.location_id),Number(item?.service_id),`${prefix}-01`,`${prefix}-${String(last).padStart(2,'0')}`);},
  enabled:editing&&!!pickerView&&item?.location_id!=null&&item?.service_id!=null,placeholderData:keepPreviousData});
 const reschedule=useMutation({mutationFn:()=>orgApi(org,`/reservations/${id}/reschedule`,json('PUT',{
  startsAt:dateWithZone(date,time,loc?.timezone||'Europe/Prague'),
  ...(memberIds?{preferredMemberIds:memberIds}:{}),
  ...(effResource&&showResource?{preferredResourceId:effResource}:{})
 })),onSuccess:async()=>{notify(tr('Booking updated successfully.'));setEditing(false);await onChanged();},onError:e=>notify(safeErrorMessage(e),'error')});
 const availableSlots=useQuery({queryKey:['reschedule-availability',org,id,date,memberIds?.join(','),effResource,showResource],
  queryFn:()=>rescheduleAvailability(org,id,date,{preferredMemberIds:memberIds,preferredResourceId:showResource&&effResource?effResource:undefined}),
  enabled:editing&&!!date&&!!options.data,staleTime:15_000});
 const allowed=(status==='pending'?['confirmed','cancelled']:status==='confirmed'?['completed','no_show','cancelled']:
  status==='completed'?['confirmed','no_show']:status==='no_show'?['confirmed','completed']:status==='cancelled'?['confirmed']:[])
  .filter(next=>next!=='no_show'||canMarkNoShow);
 const labels:Record<string,string>={confirmed:'Potvrdit',completed:'Dokončit',no_show:'Nedostavil se',cancelled:'Zrušit rezervaci'};
 const canReschedule=status==='confirmed'&&item!=null;
 const openReschedule=()=>{
  const zoned=new Intl.DateTimeFormat('en-CA',{timeZone:loc?.timezone||'Europe/Prague',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
    .formatToParts(new Date(String(item?.starts_at)));
  const parts=Object.fromEntries(zoned.map(p=>[p.type,p.value]));
  setInitialStart(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`);
  setDate(`${parts.year}-${parts.month}-${parts.day}`);setMemberChoice(null);setMemberChoices(null);setResourceChoice(null);
  setTime(`${parts.hour}:${parts.minute}`);setEditing(true);
 };
 useEffect(()=>{if(availableSlots.error)notify(safeErrorMessage(availableSlots.error),'error');},[availableSlots.error,notify]);
 return allowed.length?<div className="stack"><div className="booking-detail-actions">
  {allowed.filter(next=>next!=='cancelled').map(next=><Button key={next} loading={action.isPending&&action.variables===next} disabled={action.isPending||reschedule.isPending} onClick={()=>action.mutate(next)}>{tr(next==='confirmed'&&status!=='pending'?'Reopen booking':labels[next])}</Button>)}
  {canReschedule&&<Button variant="secondary" disabled={action.isPending} onClick={()=>editing?setEditing(false):openReschedule()}>{tr('Reschedule booking')}</Button>}
  {allowed.filter(next=>next==='cancelled').map(next=><Button key={next} variant="danger" loading={action.isPending&&action.variables===next} disabled={action.isPending||reschedule.isPending} onClick={async()=>{if(await confirm(tr('Are you sure you want to cancel this booking?')))action.mutate(next);}}>{tr(labels[next])}</Button>)}
 </div>{editing&&createPortal(<Modal themed className="booking-reschedule-modal" title={tr('Reschedule booking')} onClose={()=>setEditing(false)}>
  <form className="stack" onSubmit={async event=>{event.preventDefault();
   if(!rescheduleDirty||reschedule.isPending)return;
   const startsAt=dateWithZone(date,time,loc?.timezone||'Europe/Prague');
   if(Date.parse(startsAt)<=Date.now()&&!await confirm(tr('This new time has already started or is in the past. Do you really want to move the booking there?'),{title:tr('Move booking to the past?'),confirmLabel:tr('Yes, move it'),variant:'primary'}))return;
   reschedule.mutate();}}>
   <p className="muted small">{tr('Choose a new date and time. Available times account for staff and resource availability.')}</p>
   <div className="form-grid"><Field label={tr('Date')}><PeriodPicker field mode="day" label={tr('Select date')} value={date} weekStartDay={weekStartDay} minDate={today()} unavailableDays={unavailableDays.data} onViewChange={(year,month)=>setPickerView({year,month})} minYear={currentYear} maxYear={currentYear+2} onChange={value=>{setDate(value);setTime('');}}/></Field>
   {showStaff&&options.data!.staffCount>1
    ?<Field label={tr('Select all required staff members')}><Select multiple value={selectedMemberIds.map(String)} onChange={e=>{const selected=Array.from(e.target.selectedOptions,option=>Number(option.value));setMemberChoices(selected.length?selected:null);setTime('');}}>{rescheduleMembers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>
    :showStaff?<Field label={tr('Staff member')}><Select value={effMember} onChange={e=>{setMemberChoice(Number(e.target.value));setTime('');}}><option value={0}>{tr('Automatically by availability')}</option>{rescheduleMembers.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</Select></Field>:<div/>}
   {showResource&&<Field label={tr('Resource')}><Select value={effResource} onChange={e=>{setResourceChoice(Number(e.target.value));setTime('');}}><option value={0}>{tr('Automatically by availability')}</option>{rescheduleResources.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>}
   </div>
   <strong>{tr('Available start times')}</strong>
   {availableSlots.isLoading?<Loading label={tr('Checking availability…')}/>:availableSlots.error?
    null:availableSlots.data?.slots.length?
     <div className="reschedule-slots" aria-label={tr('Available times')}>
      {availableSlots.data.slots.map(slot=><Button type="button" key={slot.startsAt} variant={time===slot.time.slice(0,5)?'primary':'secondary'}
       aria-pressed={time===slot.time.slice(0,5)} onClick={()=>setTime(slot.time.slice(0,5))}>{slot.time.slice(0,5)}</Button>)}
     </div>:<p className="muted small">{noSlotsReason(availableSlots.data?.reason)}</p>}
   <div className="form-actions"><Button type="submit" loading={reschedule.isPending} disabled={!rescheduleDirty||!staffSelectionComplete}>{tr('Save new time')}</Button></div>
  </form>
 </Modal>,document.body)}</div>:null;
}
