import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ChevronLeft, ChevronRight, MapPin, Plus, Users, Wrench, Utensils, CalendarDays, PackageOpen, Trash2, UserRoundCheck, Info, Coffee } from 'lucide-react';
import { getTemplates, getSetupOwner, saveSetup, completeSetup, defaultSetup, defaultOpeningHours, type OpeningInterval, type SetupDraft, type BusinessTemplate } from '../lib/setup';
import { safeErrorMessage } from '../lib/errors';
import { businessTypeLabel, st } from '../lib/setupTranslations';
import { Button, Card, Field, Input, Notice, Loading } from '../components/UI';
import { usePreferences } from '../lib/preferences';
import { Link } from 'react-router-dom';
import { AddressVerify } from '../components/AddressVerify';
import { bookingCurrencies, bookingLanguages } from '../lib/bookingOptions';
import { dateFormats } from '../lib/dateFormat';

const DAYS=['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];
const icons:Record<string,typeof CalendarClock>={SALON:CalendarClock,RESTAURANT:Utensils,RENTAL:PackageOpen,EVENTS:CalendarDays,GENERAL:UserRoundCheck};
const titles:Record<string,string>={locations:'Locations',team:'Team',services:'Services and products',resources:'Equipment and capacity',events:'Group events',hours:'Otevírací doba',public:'Public booking page'};
const descriptions:Record<string,string>={
  locations:'Zadejte místa, kde budete přijímat zákazníky. Každá pobočka má vlastní adresu, otevírací dobu a dostupné pracovníky.',
  team:'Zde určíte, koho si zákazník může rezervovat. Přístup do administrace a poskytování služeb jsou dvě různé věci.',
  services:'Přidejte konkrétní služby, jejich obvyklou délku a cenu. Zákazník si vybere službu a volný termín.',
  resources:'Zdrojem může být křeslo, místnost, masážní lehátko, stůl nebo kus vybavení. Systém hlídá, aby stejný zdroj nebyl rezervovaný dvakrát ve stejném čase.',
  events:'Skupinová lekce nebo událost má stanovenou kapacitu. Více lidí si může rezervovat místo na stejném termínu.',
  hours:'Jde o otevírací dobu provozovny, nikoli pracovní dobu zaměstnanců. Každý den může mít více intervalů (např. 9–12 a 13–18); pracovní dobu jednotlivých pracovníků upravíte později zvlášť.',
  public:'Set the booking page language and currency independently of the admin interface. You can share links in other languages later.',
  summary:'Zkontrolujte své nastavení. Po dokončení můžete upravovat služby, zaměstnance i otevírací dobu.'
};
const types:Record<string,{headline:string;examples:string}>={
  SALON:{headline:'Customers book a staff member, service and time slot.',examples:'Hair salons, barbers, beauty, manicures, pedicures, massages and consultations.'},
  RESTAURANT:{headline:'Customers book a table, meeting room or office for a specific period.',examples:'Restaurants, cafés, wine bars, meeting rooms, offices and coworking spaces.'},
  RENTAL:{headline:'Zákazník si půjčuje vybavení na vybranou dobu.',examples:'Půjčovny nářadí, sportovního vybavení, techniky nebo vozidel.'},
  EVENTS:{headline:'Zákazník si rezervuje místo v lekci nebo na události.',examples:'Kurzy, skupinové lekce, workshopy a zážitkové aktivity.'},
  GENERAL:{headline:'Zákazník si rezervuje službu a dostupný termín.',examples:'Individuální konzultace a ostatní služby s časovou rezervací.'}
};
function initialDraft(initial?:Record<string,unknown>):SetupDraft {
  if(!initial || typeof initial.templateKey!=='string') return {
    ...defaultSetup,
    locations:defaultSetup.locations.map(loc=>({...loc,name:st('Main location')})),
    resourceName:st('Chair'),
  };
  const raw={...defaultSetup,...initial} as SetupDraft;
  const openingHours=Array.isArray(initial.openingHours) ? initial.openingHours as OpeningInterval[]
    : raw.locations.flatMap((_,i)=>defaultOpeningHours(i).map(slot=>({...slot,start:raw.workingStart||'09:00',end:raw.workingEnd||'17:00'})));
  return {...raw,defaultPublicLanguage:raw.defaultPublicLanguage||'cs',defaultCurrency:raw.defaultCurrency||'CZK',dateFormat:raw.dateFormat||'DD.MM.YYYY',ownerProvidesServices:Boolean(raw.ownerProvidesServices),ownerLocationIndex:raw.ownerLocationIndex??0,openingHours,
    services:(raw.services||[]).map(s=>({...s,
      customerCanChooseStaff:s.customerCanChooseStaff??(['SALON','GENERAL'].includes(raw.templateKey)&&raw.showStaffChoice),
      customerCanChooseResource:s.customerCanChooseResource??(raw.trackResources&&raw.customerSelectResource),
      requiredStaffCount:s.requiredStaffCount??1})),
    members:(raw.members||[]).filter(x=>x.name.trim()!=='').map(m=>({...m,providesServices:m.providesServices!==false}))};
}
function makeDefault(template:BusinessTemplate):SetupDraft {
  const defaults=template.defaults as Partial<SetupDraft> & {serviceName?:string;serviceDuration?:number};
  const displayPresets:Record<string,{resourceName?:string;serviceName?:string}>={
    SALON:{resourceName:st('Chair')},
    RESTAURANT:{resourceName:st('Table'),serviceName:st('Table reservation')},
    RENTAL:{resourceName:st('Equipment'),serviceName:st('Equipment rental')},
  };
  const preset=displayPresets[template.template_key]||{};
  const draft:SetupDraft={...defaultSetup,...defaults,...preset,
    locations:defaultSetup.locations.map(x=>({...x,name:st('Main location')})),members:[],
    openingHours:defaultOpeningHours(0),services:defaultSetup.services.map(x=>({...x,currency:defaultSetup.defaultCurrency,
      customerCanChooseStaff:template.booking_model==='APPOINTMENT',customerCanChooseResource:false,requiredStaffCount:1})),templateKey:template.template_key};
  if(template.booking_model==='EVENT') return {...draft,services:[]};
  if(template.booking_model==='RESOURCE'||template.booking_model==='RENTAL')
    return {...draft,services:[{name:preset.serviceName||defaults.serviceName||'',durationMinutes:defaults.serviceDuration||60,price:0,currency:draft.defaultCurrency,customerCanChooseStaff:false,customerCanChooseResource:false,requiredStaffCount:1}]};
  return draft;
}

export function SetupWizard({orgId,initial}:{orgId:number;initial?:Record<string,unknown>}) {
  const {language}=usePreferences();void language;
  const qc=useQueryClient();
  const {data:templates,isLoading,error:loadError}=useQuery({queryKey:['setup-templates',orgId],queryFn:()=>getTemplates(orgId)});
  const {data:owner,error:ownerError}=useQuery({queryKey:['setup-owner',orgId],queryFn:()=>getSetupOwner(orgId)});
  const [draft,setDraft]=useState<SetupDraft>(()=>initialDraft(initial));
  const [step,setStep]=useState(0);
  const [locationTab,setLocationTab]=useState(0);
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  const template=templates?.find(x=>x.template_key===draft.templateKey);
  const steps=useMemo(()=>{
    const configured=template?.booking_model==='APPOINTMENT'
      ? ['locations','team','services','resources','hours']
      : (template?.steps||[]).filter(x=>x.when==='always').map(x=>x.id);
    return ['type',...configured,'public','summary'];
  },[template]);
  const current=steps[Math.min(step,steps.length-1)];
  useEffect(()=>setStep(x=>Math.min(x,steps.length-1)),[steps.length]);
  const save=useMutation({mutationFn:(finish:boolean)=>finish?completeSetup(orgId,draft):saveSetup(orgId,draft),onSuccess:(_r,finish)=>{
    setError('');if(finish){setDone(true);void qc.invalidateQueries({queryKey:['setup',orgId]});void qc.invalidateQueries({queryKey:['organization',orgId]});void qc.invalidateQueries({queryKey:['locations',orgId]});}
    else setStep(x=>Math.min(steps.length-1,x+1));
  },onError:e=>setError(safeErrorMessage(e))});
  const patch=<K extends keyof SetupDraft>(key:K,value:SetupDraft[K])=>setDraft(d=>({...d,[key]:value}));
  const changeItem=<K extends 'locations'|'members'|'services'>(key:K,index:number,field:string,value:string|number|boolean)=>
    setDraft(d=>({...d,[key]:d[key].map((x,i)=>i===index?{...x,[field]:value}:x)}));
  const addItem=(key:'locations'|'members'|'services')=>setDraft(d=>{
    if(key==='locations')return {...d,locations:[...d.locations,{name:'',address:'',timezone:'Europe/Prague'}],openingHours:[...d.openingHours,...defaultOpeningHours(d.locations.length)]};
    if(key==='members')return {...d,members:[...d.members,{name:'',email:'',providesServices:true,canManageBookings:false,canManageOwnBookings:false,canApproveOwnAbsence:false,locationIndexes:[0]}]};
    return {...d,services:[...d.services,{name:'',durationMinutes:60,price:0,currency:d.defaultCurrency,customerCanChooseStaff:true,customerCanChooseResource:false,requiredStaffCount:1}]};
  });
  const removeItem=(key:'members'|'services',index:number)=>setDraft(d=>({...d,[key]:d[key].filter((_,i)=>i!==index)}));
  const updateOpening=(weekday:number,index:number,field:'start'|'end',value:string)=>setDraft(d=>{
    let n=0;
    return {...d,openingHours:d.openingHours.map(x=>x.locationIndex===locationTab&&x.weekday===weekday&&n++===index?{...x,[field]:value}:x)};
  });
  const toggleDay=(day:number,enabled:boolean)=>setDraft(d=>({...d,openingHours:enabled
    ?[...d.openingHours,{locationIndex:locationTab,weekday:day,start:'09:00',end:'17:00'}]
    :d.openingHours.filter(x=>x.locationIndex!==locationTab||x.weekday!==day)}));
  const addInterval=(day:number)=>setDraft(d=>({...d,openingHours:[...d.openingHours,{locationIndex:locationTab,weekday:day,start:'13:00',end:'18:00'}]}));
  const removeInterval=(slot:OpeningInterval)=>setDraft(d=>{
    const i=d.openingHours.indexOf(slot);
    return {...d,openingHours:d.openingHours.filter((_,j)=>j!==i)};
  });
  const validateHours=()=>{
    for(const slot of draft.openingHours)if(!slot.start||!slot.end||slot.start>=slot.end)return 'Interval otevírací doby musí mít začátek před koncem.';
    for(let li=0;li<draft.locations.length;li++)for(let day=1;day<=7;day++){
      const daySlots=draft.openingHours.filter(s=>s.locationIndex===li&&s.weekday===day).sort((a,b)=>a.start.localeCompare(b.start));
      for(let i=1;i<daySlots.length;i++)if(daySlots[i].start<daySlots[i-1].end)return `Otevírací doba se překrývá: ${draft.locations[li].name}, ${DAYS[day-1]}.`;
    }
    return '';
  };
  const next=()=>{
    if(save.isPending)return;setError('');
    if(current==='type'){setStep(x=>x+1);return;}
    if(current==='locations'&&(!draft.locations.length||draft.locations.some(x=>!x.name.trim()))){setError('Vyplňte názvy všech poboček.');return;}
    if(current==='services'&&(!draft.services.length||draft.services.some(x=>!x.name.trim()))){setError('Vyplňte názvy všech služeb.');return;}
    if(current==='team'&&draft.members.some(x=>!x.name.trim())){setError(st('Enter the names of added team members.'));return;}
    if(current==='summary'&&draft.members.some(x=>!x.email?.trim()||! /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(x.email.trim()))){setError(st('Enter a valid email for every team member.'));return;}
    if(current==='hours'||current==='summary'){const e=validateHours();if(e){setError(e);return;}}
    if(current==='summary'&&template?.booking_model==='APPOINTMENT'&&!draft.ownerProvidesServices&&!draft.members.some(x=>x.providesServices!==false)){
      setError('Nastavte alespoň jednoho poskytovatele služeb – sebe nebo člena týmu.');return;
    }
    save.mutate(current==='summary');
  };
  if(isLoading)return <Loading/>;
  if(loadError)return <Notice message={safeErrorMessage(loadError)}/>;
  if(done)return <Card><div className="setup-done"><CalendarClock size={42}/><h2>{st('Setup complete.')}</h2><Link className="btn btn-primary" to="/admin/overview">{st('Go to administration')}</Link></div></Card>;
  return <div className="setup-page"><div className="setup-head"><span className="eyebrow">BOOKANEAR · {st('Setup wizard')}</span><h1>{st('Set up Bookanear')}</h1><p>{st('Choose a business type to tailor bookings and administration.')}</p></div>
    <div className="setup-progress">{steps.map((x,i)=><span key={x} className={i<=step?'active':''}/>)}</div><Card><div className="setup-card">
      <h2>{current==='type'?st('What kind of business do you run?'):current==='summary'?st('Summary'):st(titles[current]||current)}</h2>
      {current!=='type'&&<p className="setup-step-description"><Info size={18}/>{st(descriptions[current])}</p>}
      <Notice message={error||((current==='type'&&templates?.length===0)?st('Business types are unavailable. Check the server update and refresh the page.'):undefined)}/>
      {current==='type'&&<div className="setup-types">{templates?.map(t=>{const Icon=icons[t.template_key]||Users;const explanation=types[t.template_key];return <button type="button" key={t.template_key} className={'setup-type '+(draft.templateKey===t.template_key?'selected':'')} onClick={()=>{setDraft(makeDefault(t));setLocationTab(0);setError('');}}><Icon size={29}/><strong>{businessTypeLabel(t.template_key,t.label)}</strong><span className="setup-type-headline">{explanation?.headline ? st(explanation.headline) : null}</span><small>{explanation?.examples ? st(explanation.examples) : null}</small></button>})}</div>}
      {current==='public'&&<div className="stack"><p className="muted">{st("Set the booking page language and currency independently of the admin interface. You can share links in other languages later.")}</p><div className="form-grid"><Field label={st("Default customer language")}><select className="input" value={draft.defaultPublicLanguage} onChange={e=>patch('defaultPublicLanguage',e.target.value)}>{bookingLanguages.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label={st("Default pricing currency")}><select className="input" value={draft.defaultCurrency} onChange={e=>setDraft(d=>({...d,defaultCurrency:e.target.value,services:d.services.map(x=>({...x,currency:e.target.value}))}))}>{bookingCurrencies.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label={st('Date format')}><select className="input" value={draft.dateFormat} onChange={e=>patch('dateFormat',e.target.value)}>{dateFormats.map(x=><option key={x.value} value={x.value}>{x.label} ({x.value})</option>)}</select></Field></div></div>}
      {current==='locations'&&<div className="stack"><h3>{st('Do you have multiple locations?')}</h3><div className="setup-toggle"><button type="button" className={!draft.multiLocation?'selected':''} onClick={()=>{setDraft(d=>({...d,multiLocation:false,locations:d.locations.slice(0,1),openingHours:d.openingHours.filter(s=>s.locationIndex===0),ownerLocationIndex:0}));setLocationTab(0);}}>{st('One location')}</button><button type="button" className={draft.multiLocation?'selected':''} onClick={()=>patch('multiLocation',true)}>{st('Multiple locations')}</button></div>{draft.locations.map((loc,i)=><div className="setup-item" key={i}><div className="form-grid"><Field label={st('Location name')}><Input required value={loc.name} onChange={e=>changeItem('locations',i,'name',e.target.value)}/></Field><Field label={st('Address')}><Input value={loc.address} onChange={e=>setDraft(d=>({...d,locations:d.locations.map((x,j)=>j===i?{...x,address:e.target.value,latitude:null,longitude:null}:x)}))}/></Field></div><AddressVerify org={orgId} address={loc.address} latitude={loc.latitude} longitude={loc.longitude} onSelect={result=>setDraft(d=>({...d,locations:d.locations.map((x,j)=>i===j?{...x,address:result.address,latitude:result.latitude,longitude:result.longitude}:x)}))}/>{draft.multiLocation&&draft.locations.length>1&&<button type="button" className="text-button" onClick={()=>{
        setDraft(d=>({...d,locations:d.locations.filter((_,j)=>i!==j),openingHours:d.openingHours.filter(x=>x.locationIndex!==i).map(x=>({...x,locationIndex:x.locationIndex>i?x.locationIndex-1:x.locationIndex})),ownerLocationIndex:d.ownerLocationIndex===i?0:Math.max(0,d.ownerLocationIndex-(d.ownerLocationIndex>i?1:0)),members:d.members.map(m=>({...m,locationIndexes:m.locationIndexes?.filter(x=>x!==i).map(x=>x>i?x-1:x)}))}));setLocationTab(0);
      }}>{st('Remove')}</button>}</div>)}{draft.multiLocation&&<Button variant="secondary" onClick={()=>addItem('locations')}><Plus size={16}/>{st('Add location')}</Button>}</div>}
      {current==='team'&&<div className="stack"><div className="setup-owner"><div className="setup-owner-head"><UserRoundCheck size={25}/><div><strong>{owner?.name||st('Organization owner')}</strong><small>{st("Owner · account already exists (cannot rename here)")}</small></div></div><label className="setup-check"><input type="checkbox" checked={draft.ownerProvidesServices} onChange={e=>patch('ownerProvidesServices',e.target.checked)}/>{st("I also provide services and customers can book me.")}</label>{draft.ownerProvidesServices&&draft.multiLocation&&<Field label={st("My default location")}><select className="input" value={draft.ownerLocationIndex} onChange={e=>patch('ownerLocationIndex',Number(e.target.value))}>{draft.locations.map((loc,li)=><option key={li} value={li}>{loc.name}</option>)}</select></Field>}<p className="muted">{st("Owners always have admin access. You can adjust shifts at other locations later.")}</p></div>
      {ownerError&&<Notice message={safeErrorMessage(ownerError)}/>}<h3>{st("Other team members")}</h3><p className="muted">{st("Add other people, not yourself again. Receptionists do not need to be bookable. Everyone sees their own bookings; choose whether a worker may manage colleagues’ bookings or only their own.")}</p>
      {draft.members.map((m,i)=><div className="setup-item" key={i}>
        <div className="setup-inline"><Field label={st("Team member name")}><Input value={m.name} onChange={e=>changeItem('members',i,'name',e.target.value)}/></Field><Field label={st("Team member email")}><Input type="email" value={m.email||''} onChange={e=>changeItem('members',i,'email',e.target.value)}/></Field>{draft.multiLocation&&<Field label={st('Location')}><select className="input" value={m.locationIndexes?.[0]??-1} onChange={e=>setDraft(d=>({...d,members:d.members.map((x,j)=>i===j?{...x,locationIndexes:e.target.value==='-1'?[0]:[Number(e.target.value)]}:x)}))}><option value={-1}>{st('First location')}</option>{draft.locations.map((loc,li)=><option key={li} value={li}>{loc.name}</option>)}</select></Field>}<Button variant="ghost" onClick={()=>removeItem('members',i)}><Trash2 size={16}/>{st('Remove')}</Button></div>
        <label className="setup-check"><input type="checkbox" checked={m.providesServices!==false} onChange={e=>changeItem('members',i,'providesServices',e.target.checked)}/>{st("Provides bookable services")}</label>
        <label className="setup-check"><input type="checkbox" checked={m.canManageBookings===true} onChange={e=>setDraft(d=>({...d,members:d.members.map((x,j)=>i===j?{...x,canManageBookings:e.target.checked,canManageOwnBookings:e.target.checked?false:x.canManageOwnBookings}:x)}))}/>{st("Can create and manage colleagues’ bookings")}</label>
        <label className="setup-check"><input type="checkbox" checked={m.canManageOwnBookings===true} onChange={e=>setDraft(d=>({...d,members:d.members.map((x,j)=>i===j?{...x,canManageOwnBookings:e.target.checked,canManageBookings:e.target.checked?false:x.canManageBookings}:x)}))}/>{st("Can manage own bookings")}</label>
        <label className="setup-check"><input type="checkbox" checked={m.canApproveOwnAbsence===true} onChange={e=>changeItem('members',i,'canApproveOwnAbsence',e.target.checked)}/>{st("Can approve own availability changes")}</label>
      </div>)}<Button variant="secondary" onClick={()=>addItem('members')}><Plus size={16}/>{st("Add team member")}</Button></div>}
      {current==='services'&&<div className="stack"><p>{st('What will customers book?')}</p>{draft.services.map((s,i)=><div className="setup-item" key={i}><div className="form-grid"><Field label={st('Service name')}><Input value={s.name} onChange={e=>changeItem('services',i,'name',e.target.value)}/></Field><Field label={st('Duration in minutes')}><Input type="number" min={5} value={s.durationMinutes} onChange={e=>changeItem('services',i,'durationMinutes',Number(e.target.value))}/></Field><Field label={st('Price')}><Input type="number" min={0} step="0.01" value={s.price} onChange={e=>changeItem('services',i,'price',Number(e.target.value))}/></Field><Field label={st("Currency")}><select className="input" value={s.currency} onChange={e=>changeItem('services',i,'currency',e.target.value)}>{bookingCurrencies.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></Field></div>{template?.booking_model==='APPOINTMENT'&&<><label className="setup-check"><input type="checkbox" checked={s.customerCanChooseStaff===true} onChange={e=>changeItem('services',i,'customerCanChooseStaff',e.target.checked)}/>{st('Customer can choose all required staff members for this service')}</label><Field label={st('Staff members required at the same time')}><Input type="number" min={1} max={100} value={s.requiredStaffCount??1} onChange={e=>changeItem('services',i,'requiredStaffCount',Number(e.target.value))}/></Field></>}{draft.trackResources&&<label className="setup-check"><input type="checkbox" checked={s.customerCanChooseResource===true} onChange={e=>changeItem('services',i,'customerCanChooseResource',e.target.checked)}/>{st('Customer may select a specific resource for this service')}</label>}{draft.services.length>1&&<button className="text-button" onClick={()=>removeItem('services',i)}>{st('Remove')}</button>}</div>)}<Button variant="secondary" onClick={()=>addItem('services')}><Plus size={16}/>{st('Add service')}</Button></div>}
      {current==='resources'&&<div className="stack"><label className="setup-check"><input type="checkbox" checked={draft.trackResources} disabled={template?.booking_model==='RESOURCE'||template?.booking_model==='RENTAL'} onChange={e=>{patch('trackResources',e.target.checked);if(!e.target.checked)setDraft(d=>({...d,services:d.services.map(s=>({...s,customerCanChooseResource:false}))}));}}/>{st('Track individual resources')}</label><p className="muted">U služeb poskytovaných člověkem se pracovníci evidují automaticky. Další vybavení zapněte jen tehdy, pokud omezuje počet souběžných rezervací.</p>{draft.trackResources&&<div className="form-grid"><Field label={st('Resource name')}><Input value={draft.resourceName} onChange={e=>patch('resourceName',e.target.value)}/></Field><Field label={st('Units per location')}><Input type="number" min={1} max={500} value={draft.resourceCount} onChange={e=>patch('resourceCount',Number(e.target.value))}/></Field><Field label={st('Capacity per resource')}><Input type="number" min={1} max={1000} value={draft.resourceCapacity} onChange={e=>patch('resourceCapacity',Number(e.target.value))}/></Field></div>}</div>}
      {current==='events'&&<div className="stack"><Field label={st('Default class capacity')}><Input type="number" min={1} max={10000} value={draft.eventCapacity} onChange={e=>patch('eventCapacity',Number(e.target.value))}/></Field><p className="muted">Lekce a termíny zadáte po dokončení základního nastavení.</p></div>}
      {current==='hours'&&<div className="stack"><div className="setup-location-tabs">{draft.locations.map((loc,i)=><button type="button" key={i} className={locationTab===i?'selected':''} onClick={()=>setLocationTab(i)}><MapPin size={15}/>{loc.name||`Pobočka ${i+1}`}</button>)}</div><div className="setup-week">{DAYS.map((name,index)=>{const day=index+1;const slots=draft.openingHours.filter(x=>x.locationIndex===locationTab&&x.weekday===day).sort((a,b)=>a.start.localeCompare(b.start));return <div className="setup-day" key={day}><div className="setup-day-head"><label className="setup-check"><input type="checkbox" checked={slots.length>0} onChange={e=>toggleDay(day,e.target.checked)}/><strong>{name}</strong></label>{slots.length===0?<span className="muted">Zavřeno</span>:<button type="button" className="text-button" onClick={()=>addInterval(day)}><Plus size={14}/>Přidat interval</button>}</div>{slots.map((slot,i)=><div className="setup-hours-interval" key={`${slot.weekday}-${i}`}><label><span>Od</span><Input type="time" value={slot.start} onChange={e=>updateOpening(day,i,'start',e.target.value)}/></label><label><span>Do</span><Input type="time" value={slot.end} onChange={e=>updateOpening(day,i,'end',e.target.value)}/></label><button type="button" className="setup-hours-remove" title="Odstranit interval" onClick={()=>removeInterval(slot)}><Trash2 size={17}/></button></div>)}</div>})}</div></div>}
      {current==='summary'&&<div className="stack"><div className="setup-summary"><p><strong>{businessTypeLabel(draft.templateKey,template?.label)}</strong></p><p><MapPin size={15}/>{st('Locations')}: {draft.locations.map(x=>x.name).join(', ')}</p><p><Users size={15}/>{st('Team')}: {draft.members.length+(owner?1:0)} · {st('Bookable team members')}: {draft.members.filter(x=>x.providesServices!==false).length+(draft.ownerProvidesServices?1:0)}</p><p><Wrench size={15}/>{st('Equipment and capacity')}: {draft.trackResources?draft.resourceCount:'—'}</p><p><Coffee size={15}/>{st('Opening-hours intervals per week: {intervals}', {intervals: draft.openingHours.length})}</p></div><Notice kind="info" message={st('Finishing locks the primary booking model. Other settings can be changed later.')}/></div>}
      <div className="setup-actions"><Button variant="secondary" disabled={step===0||save.isPending} onClick={()=>{setError('');setStep(x=>x-1);}}><ChevronLeft size={16}/>{st('Back')}</Button><Button onClick={next} loading={save.isPending} disabled={current==='type'&&!templates?.length}>{current==='summary'?st('Finish setup'):current==='type'?st('Continue'):st('Save and continue')}<ChevronRight size={16}/></Button></div>
    </div></Card></div>;
}
