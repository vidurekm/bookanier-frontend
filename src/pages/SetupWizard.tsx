import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ChevronLeft, ChevronRight, MapPin, Plus, Users, Wrench, Utensils, CalendarDays, PackageOpen, Trash2, UserRoundCheck, Info, Coffee } from 'lucide-react';
import { getTemplates, getSetupOwner, saveSetup, completeSetup, defaultSetup, defaultOpeningHours, type OpeningInterval, type SetupDraft, type BusinessTemplate } from '../lib/setup';
import { safeErrorMessage } from '../lib/errors';
import { st } from '../lib/setupTranslations';
import { Button, Card, Field, Input, Notice, Loading } from '../components/UI';
import { usePreferences } from '../lib/preferences';
import { Link } from 'react-router-dom';
import { AddressVerify } from '../components/AddressVerify';
import { bookingCurrencies, bookingLanguages } from '../lib/bookingOptions';
import { dateFormats } from '../lib/dateFormat';

const DAYS=['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];
const icons:Record<string,typeof CalendarClock>={SALON:CalendarClock,RESTAURANT:Utensils,RENTAL:PackageOpen,EVENTS:CalendarDays,GENERAL:UserRoundCheck};
const titles:Record<string,string>={locations:'Pobočky',team:'Tým',services:'Služby a produkty',resources:'Vybavení a kapacita',events:'Skupinové události',hours:'Otevírací doba'};
const descriptions:Record<string,string>={
  locations:'Zadejte místa, kde budete přijímat zákazníky. Každá pobočka má vlastní adresu, otevírací dobu a dostupné pracovníky.',
  team:'Zde určíte, koho si zákazník může rezervovat. Přístup do administrace a poskytování služeb jsou dvě různé věci.',
  services:'Přidejte konkrétní služby, jejich obvyklou délku a cenu. Zákazník si vybere službu a volný termín.',
  resources:'Zdrojem může být křeslo, místnost, masážní lehátko, stůl nebo kus vybavení. Systém hlídá, aby stejný zdroj nebyl rezervovaný dvakrát ve stejném čase.',
  events:'Skupinová lekce nebo událost má stanovenou kapacitu. Více lidí si může rezervovat místo na stejném termínu.',
  hours:'Jde o otevírací dobu provozovny, nikoli pracovní dobu zaměstnanců. Každý den může mít více intervalů (např. 9–12 a 13–18); pracovní dobu jednotlivých pracovníků upravíte později zvlášť.',
  summary:'Zkontrolujte své nastavení. Po dokončení můžete upravovat služby, zaměstnance i otevírací dobu.'
};
const types:Record<string,{headline:string;examples:string}>={
  SALON:{headline:'Zákazník si rezervuje pracovníka, službu a konkrétní čas.',examples:'Kadeřnictví, barber shop, kosmetika, manikúra, pedikúra, masáže, fyzioterapie a osobní konzultace.'},
  RESTAURANT:{headline:'Zákazník si rezervuje stůl, zasedací místnost nebo kancelář na určitý čas.',examples:'Restaurace, kavárny, vinárny, zasedací místnosti, kanceláře a coworkingové prostory s omezenou kapacitou.'},
  RENTAL:{headline:'Zákazník si půjčuje vybavení na vybranou dobu.',examples:'Půjčovny nářadí, sportovního vybavení, techniky nebo vozidel.'},
  EVENTS:{headline:'Zákazník si rezervuje místo v lekci nebo na události.',examples:'Kurzy, skupinové lekce, workshopy a zážitkové aktivity.'},
  GENERAL:{headline:'Zákazník si rezervuje službu a dostupný termín.',examples:'Individuální konzultace a ostatní služby s časovou rezervací.'}
};
function initialDraft(initial?:Record<string,unknown>):SetupDraft {
  if(!initial || typeof initial.templateKey!=='string') return {
    ...defaultSetup,
    locations:defaultSetup.locations.map(loc=>({...loc,name:st('Hlavní pobočka')})),
    resourceName:st('Křeslo'),
  };
  const raw={...defaultSetup,...initial} as SetupDraft;
  const openingHours=Array.isArray(initial.openingHours) ? initial.openingHours as OpeningInterval[]
    : raw.locations.flatMap((_,i)=>defaultOpeningHours(i).map(slot=>({...slot,start:raw.workingStart||'09:00',end:raw.workingEnd||'17:00'})));
  return {...raw,defaultPublicLanguage:raw.defaultPublicLanguage||'cs',defaultCurrency:raw.defaultCurrency||'CZK',dateFormat:raw.dateFormat||'DD.MM.YYYY',ownerProvidesServices:Boolean(raw.ownerProvidesServices),ownerLocationIndex:raw.ownerLocationIndex??0,openingHours,
    members:(raw.members||[]).filter(x=>x.name.trim()!=='').map(m=>({...m,providesServices:m.providesServices!==false}))};
}
function makeDefault(template:BusinessTemplate):SetupDraft {
  const defaults=template.defaults as Partial<SetupDraft> & {serviceName?:string;serviceDuration?:number};
  const displayPresets:Record<string,{resourceName?:string;serviceName?:string}>={
    SALON:{resourceName:st('Křeslo')},
    RESTAURANT:{resourceName:st('Stůl'),serviceName:st('Rezervace stolu')},
    RENTAL:{resourceName:st('Vybavení'),serviceName:st('Pronájem vybavení')},
  };
  const preset=displayPresets[template.template_key]||{};
  const draft:SetupDraft={...defaultSetup,...defaults,...preset,
    locations:defaultSetup.locations.map(x=>({...x,name:st('Hlavní pobočka')})),members:[],
    openingHours:defaultOpeningHours(0),services:defaultSetup.services.map(x=>({...x,currency:defaultSetup.defaultCurrency})),templateKey:template.template_key};
  if(template.booking_model==='EVENT') return {...draft,services:[]};
  if(template.booking_model==='RESOURCE'||template.booking_model==='RENTAL')
    return {...draft,services:[{name:preset.serviceName||defaults.serviceName||'',durationMinutes:defaults.serviceDuration||60,price:0,currency:draft.defaultCurrency}]};
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
  const steps=useMemo(()=>['type',...(template?.steps||[]).filter(x=>x.when==='always').map(x=>x.id),'summary'],[template]);
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
    if(key==='members')return {...d,members:[...d.members,{name:'',providesServices:true,canManageBookings:false,canApproveOwnAbsence:false,locationIndexes:[0]}]};
    return {...d,services:[...d.services,{name:'',durationMinutes:60,price:0,currency:d.defaultCurrency}]};
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
    if(current==='team'&&draft.members.some(x=>!x.name.trim())){setError('Vyplňte jména přidaných členů týmu.');return;}
    if(current==='hours'||current==='summary'){const e=validateHours();if(e){setError(e);return;}}
    if(current==='summary'&&template?.booking_model==='APPOINTMENT'&&!draft.ownerProvidesServices&&!draft.members.some(x=>x.providesServices!==false)){
      setError('Nastavte alespoň jednoho poskytovatele služeb – sebe nebo člena týmu.');return;
    }
    save.mutate(current==='summary');
  };
  if(isLoading)return <Loading/>;
  if(loadError)return <Notice message={safeErrorMessage(loadError)}/>;
  if(done)return <Card><div className="setup-done"><CalendarClock size={42}/><h2>{st('Nastavení bylo dokončeno.')}</h2><Link className="btn btn-primary" to="/admin/overview">Přejít do administrace</Link></div></Card>;
  return <div className="setup-page"><div className="setup-head"><span className="eyebrow">BOOKANEAR · {st('Průvodce nastavením')}</span><h1>{st('Nastavení Bookanear')}</h1><p>{st('Zvolte zaměření. Podle něj připravíme rezervace i administraci.')}</p></div>
    <div className="setup-progress">{steps.map((x,i)=><span key={x} className={i<=step?'active':''}/>)}</div><Card><div className="setup-card">
      <h2>{current==='type'?st('Jaký typ provozu máte?'):current==='summary'?st('Shrnutí'):st(titles[current]||current)}</h2>
      {current!=='type'&&<p className="setup-step-description"><Info size={18}/>{st(descriptions[current])}</p>}
      <Notice message={error}/>
      {current==='type'&&<div className="setup-types">{templates?.map(t=>{const Icon=icons[t.template_key]||Users;const explanation=types[t.template_key];return <button type="button" key={t.template_key} className={'setup-type '+(draft.templateKey===t.template_key?'selected':'')} onClick={()=>{setDraft(makeDefault(t));setLocationTab(0);setError('');}}><Icon size={29}/><strong>{t.template_key==='SALON'?'Služby s rezervací termínu':t.template_key==='RESTAURANT'?st('Rezervace prostorů a míst'):st(({
  RENTAL:'Půjčovna vybavení',EVENTS:'Skupinové lekce a události',GENERAL:'Jiné služby',
} as Record<string,string>)[t.template_key]||t.label)}</strong><span className="setup-type-headline">{explanation?.headline ? st(explanation.headline) : null}</span><small>{explanation?.examples ? st(explanation.examples) : null}</small></button>})}</div>}
      {current==='type'&&<div className="stack setup-preferences"><h3>{st("Veřejná rezervační stránka")}</h3><p className="muted">{st("Jazyk rezervací a měnu cen můžete nastavit nezávisle na jazyku administrace. Veřejný odkaz lze později sdílet i v jiném jazyce.")}</p><div className="form-grid"><Field label={st("Výchozí jazyk pro zákazníky")}><select className="input" value={draft.defaultPublicLanguage} onChange={e=>patch('defaultPublicLanguage',e.target.value)}>{bookingLanguages.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label={st("Výchozí měna ceníku")}><select className="input" value={draft.defaultCurrency} onChange={e=>setDraft(d=>({...d,defaultCurrency:e.target.value,services:d.services.map(x=>({...x,currency:e.target.value}))}))}>{bookingCurrencies.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label={st('Formát data')}><select className="input" value={draft.dateFormat} onChange={e=>patch('dateFormat',e.target.value)}>{dateFormats.map(x=><option key={x.value} value={x.value}>{x.label} ({x.value})</option>)}</select></Field></div></div>}
      {current==='locations'&&<div className="stack"><h3>{st('Máte více poboček?')}</h3><div className="setup-toggle"><button type="button" className={!draft.multiLocation?'selected':''} onClick={()=>{setDraft(d=>({...d,multiLocation:false,locations:d.locations.slice(0,1),openingHours:d.openingHours.filter(s=>s.locationIndex===0),ownerLocationIndex:0}));setLocationTab(0);}}>{st('Jedna pobočka')}</button><button type="button" className={draft.multiLocation?'selected':''} onClick={()=>patch('multiLocation',true)}>{st('Více poboček')}</button></div>{draft.locations.map((loc,i)=><div className="setup-item" key={i}><div className="form-grid"><Field label={st('Název pobočky')}><Input required value={loc.name} onChange={e=>changeItem('locations',i,'name',e.target.value)}/></Field><Field label={st('Adresa')}><Input value={loc.address} onChange={e=>setDraft(d=>({...d,locations:d.locations.map((x,j)=>j===i?{...x,address:e.target.value,latitude:null,longitude:null}:x)}))}/></Field></div><AddressVerify org={orgId} address={loc.address} latitude={loc.latitude} longitude={loc.longitude} onSelect={result=>setDraft(d=>({...d,locations:d.locations.map((x,j)=>i===j?{...x,address:result.address,latitude:result.latitude,longitude:result.longitude}:x)}))}/>{draft.multiLocation&&draft.locations.length>1&&<button type="button" className="text-button" onClick={()=>{
        setDraft(d=>({...d,locations:d.locations.filter((_,j)=>i!==j),openingHours:d.openingHours.filter(x=>x.locationIndex!==i).map(x=>({...x,locationIndex:x.locationIndex>i?x.locationIndex-1:x.locationIndex})),ownerLocationIndex:d.ownerLocationIndex===i?0:Math.max(0,d.ownerLocationIndex-(d.ownerLocationIndex>i?1:0)),members:d.members.map(m=>({...m,locationIndexes:m.locationIndexes?.filter(x=>x!==i).map(x=>x>i?x-1:x)}))}));setLocationTab(0);
      }}>{st('Odstranit')}</button>}</div>)}{draft.multiLocation&&<Button variant="secondary" onClick={()=>addItem('locations')}><Plus size={16}/>{st('Přidat pobočku')}</Button>}</div>}
      {current==='team'&&<div className="stack"><div className="setup-owner"><div className="setup-owner-head"><UserRoundCheck size={25}/><div><strong>{owner?.name||'Vlastník organizace'}</strong><small>{st("Vlastník · účet již existuje (nelze zde přejmenovat)")}</small></div></div><label className="setup-check"><input type="checkbox" checked={draft.ownerProvidesServices} onChange={e=>patch('ownerProvidesServices',e.target.checked)}/>{st("Také osobně poskytuji služby a zákazníci si mě mohou rezervovat.")}</label>{draft.ownerProvidesServices&&draft.multiLocation&&<Field label={st("Moje výchozí pobočka")}><select className="input" value={draft.ownerLocationIndex} onChange={e=>patch('ownerLocationIndex',Number(e.target.value))}>{draft.locations.map((loc,li)=><option key={li} value={li}>{loc.name}</option>)}</select></Field>}<p className="muted">{st("Vlastník má přístup do administrace vždy, bez ohledu na toto zaškrtnutí. Pro další pobočky upravíte jeho směny později.")}</p></div>
      {ownerError&&<Notice message={safeErrorMessage(ownerError)}/>}<h3>{st("Další členové týmu")}</h3><p className="muted">{st("Přidávejte jen další osoby, nikoli znovu sebe. Recepční nebo manažer může být členem týmu bez možnosti rezervace. Přístup do administrace se nastavuje samostatně. Každý vidí své rezervace; vybraným pracovníkům můžete povolit spravovat rezervace ostatních. U více poboček zvolte pro úvodní směny jednu pobočku; další rozvrhy doplníte později.")}</p>
      {draft.members.map((m,i)=><div className="setup-item" key={i}><div className="setup-inline"><Field label={st("Jméno člena týmu")}><Input value={m.name} onChange={e=>changeItem('members',i,'name',e.target.value)}/></Field>{draft.multiLocation&&<Field label="Pobočka"><select className="input" value={m.locationIndexes?.[0]??-1} onChange={e=>setDraft(d=>({...d,members:d.members.map((x,j)=>i===j?{...x,locationIndexes:e.target.value==='-1'?[0]:[Number(e.target.value)]}:x)}))}><option value={-1}>První pobočka</option>{draft.locations.map((loc,li)=><option key={li} value={li}>{loc.name}</option>)}</select></Field>}<Button variant="ghost" onClick={()=>removeItem('members',i)}><Trash2 size={16}/>{st('Odstranit')}</Button></div><label className="setup-check"><input type="checkbox" checked={m.providesServices!==false} onChange={e=>changeItem('members',i,'providesServices',e.target.checked)}/>{st("Poskytuje rezervovatelné služby")}</label><label className="setup-check"><input type="checkbox" checked={m.canManageBookings===true} onChange={e=>changeItem('members',i,'canManageBookings',e.target.checked)}/>{st("Smí vytvářet rezervace a spravovat rezervace kolegů")}</label><label className="setup-check"><input type="checkbox" checked={m.canApproveOwnAbsence===true} onChange={e=>changeItem('members',i,'canApproveOwnAbsence',e.target.checked)}/>{st("Smí sám schvalovat změny své dostupnosti")}</label></div>)}<Button variant="secondary" onClick={()=>addItem('members')}><Plus size={16}/>{st("Přidat člena týmu")}</Button></div>}
      {current==='team'&&<div className="stack"><h3>{st("Výběr pracovníka zákazníkem")}</h3><p className="muted">{st("Zákazník si může vybrat konkrétního člověka, nebo systém přidělí dostupného pracovníka automaticky. Toto nastavení později změníte v administraci.")}</p><label className="setup-check"><input type="checkbox" checked={draft.showStaffChoice} onChange={e=>patch('showStaffChoice',e.target.checked)}/>{st("Zákazník si může zvolit konkrétního pracovníka")}</label></div>}
      {current==='services'&&<div className="stack"><p>{st('Co si budou zákazníci rezervovat?')}</p>{draft.services.map((s,i)=><div className="setup-item" key={i}><div className="form-grid"><Field label={st('Název služby')}><Input value={s.name} onChange={e=>changeItem('services',i,'name',e.target.value)}/></Field><Field label={st('Délka v minutách')}><Input type="number" min={5} value={s.durationMinutes} onChange={e=>changeItem('services',i,'durationMinutes',Number(e.target.value))}/></Field><Field label={st('Cena')}><Input type="number" min={0} step="0.01" value={s.price} onChange={e=>changeItem('services',i,'price',Number(e.target.value))}/></Field><Field label={st("Měna")}><select className="input" value={s.currency} onChange={e=>changeItem('services',i,'currency',e.target.value)}>{bookingCurrencies.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></Field></div>{draft.services.length>1&&<button className="text-button" onClick={()=>removeItem('services',i)}>{st('Odstranit')}</button>}</div>)}<Button variant="secondary" onClick={()=>addItem('services')}><Plus size={16}/>{st('Přidat službu')}</Button></div>}
      {current==='resources'&&<div className="stack"><label className="setup-check"><input type="checkbox" checked={draft.trackResources} disabled={template?.booking_model==='RESOURCE'||template?.booking_model==='RENTAL'} onChange={e=>patch('trackResources',e.target.checked)}/>{st('Evidovat konkrétní zdroje')}</label><p className="muted">U služeb poskytovaných člověkem se pracovníci evidují automaticky. Další vybavení zapněte jen tehdy, pokud omezuje počet souběžných rezervací.</p>{draft.trackResources&&<><div className="form-grid"><Field label={st('Název zdroje')}><Input value={draft.resourceName} onChange={e=>patch('resourceName',e.target.value)}/></Field><Field label={st('Počet kusů na pobočku')}><Input type="number" min={1} max={500} value={draft.resourceCount} onChange={e=>patch('resourceCount',Number(e.target.value))}/></Field><Field label={st('Kapacita jednoho zdroje')}><Input type="number" min={1} max={1000} value={draft.resourceCapacity} onChange={e=>patch('resourceCapacity',Number(e.target.value))}/></Field></div><label className="setup-check"><input type="checkbox" checked={draft.customerSelectResource} onChange={e=>patch('customerSelectResource',e.target.checked)}/>{st('Zákazník si smí vybrat konkrétní zdroj')}</label></>}</div>}
      {current==='events'&&<div className="stack"><Field label={st('Výchozí kapacita lekce')}><Input type="number" min={1} max={10000} value={draft.eventCapacity} onChange={e=>patch('eventCapacity',Number(e.target.value))}/></Field><p className="muted">Lekce a termíny zadáte po dokončení základního nastavení.</p></div>}
      {current==='hours'&&<div className="stack"><div className="setup-location-tabs">{draft.locations.map((loc,i)=><button type="button" key={i} className={locationTab===i?'selected':''} onClick={()=>setLocationTab(i)}><MapPin size={15}/>{loc.name||`Pobočka ${i+1}`}</button>)}</div><div className="setup-week">{DAYS.map((name,index)=>{const day=index+1;const slots=draft.openingHours.filter(x=>x.locationIndex===locationTab&&x.weekday===day).sort((a,b)=>a.start.localeCompare(b.start));return <div className="setup-day" key={day}><div className="setup-day-head"><label className="setup-check"><input type="checkbox" checked={slots.length>0} onChange={e=>toggleDay(day,e.target.checked)}/><strong>{name}</strong></label>{slots.length===0?<span className="muted">Zavřeno</span>:<button type="button" className="text-button" onClick={()=>addInterval(day)}><Plus size={14}/>Přidat interval</button>}</div>{slots.map((slot,i)=><div className="setup-hours-interval" key={`${slot.weekday}-${i}`}><label><span>Od</span><Input type="time" value={slot.start} onChange={e=>updateOpening(day,i,'start',e.target.value)}/></label><label><span>Do</span><Input type="time" value={slot.end} onChange={e=>updateOpening(day,i,'end',e.target.value)}/></label><button type="button" className="setup-hours-remove" title="Odstranit interval" onClick={()=>removeInterval(slot)}><Trash2 size={17}/></button></div>)}</div>})}</div></div>}
      {current==='summary'&&<div className="stack"><div className="setup-summary"><p><strong>{draft.templateKey==='SALON'?'Služby s rezervací termínu':template?.label}</strong></p><p><MapPin size={15}/>{st('Pobočky')}: {draft.locations.map(x=>x.name).join(', ')}</p><p><Users size={15}/>{st('Tým')}: {draft.members.length+(owner?1:0)} · rezervovatelní: {draft.members.filter(x=>x.providesServices!==false).length+(draft.ownerProvidesServices?1:0)}</p><p><Wrench size={15}/>{st('Vybavení a kapacita')}: {draft.trackResources?draft.resourceCount:'—'}</p><p><Coffee size={15}/>Otevírací doba: nastavena pro {draft.locations.length} {draft.locations.length===1?'pobočku':'pobočky'} ({draft.openingHours.length} intervalů týdně)</p></div><Notice kind="info" message={st('Dokončením uzamknete hlavní typ rezervací. Ostatní nastavení lze později upravovat.')}/></div>}
      <div className="setup-actions"><Button variant="secondary" disabled={step===0||save.isPending} onClick={()=>{setError('');setStep(x=>x-1);}}><ChevronLeft size={16}/>{st('Zpět')}</Button><Button onClick={next} loading={save.isPending}>{current==='summary'?st('Dokončit nastavení'):current==='type'?st('Pokračovat'):st('Uložit a pokračovat')}<ChevronRight size={16}/></Button></div>
    </div></Card></div>;
}
