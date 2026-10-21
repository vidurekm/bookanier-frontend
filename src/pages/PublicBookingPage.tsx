import { publicMode, publicResources } from '../lib/setup';
import { setActiveDateFormat } from '../lib/dateFormat';
import { st } from '../lib/setupTranslations';
import { safeErrorMessage } from '../lib/errors';
import { UiError } from '../lib/errors';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, MapPin, Minus, Plus, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { createLegacy, createUniversal, publicCatalog, publicImages, publicSlots, publicUuidFromManageUrl } from '../lib/api';
import type { PublicSlot, BookingResult } from '../lib/types';
import { addDays, dateWithZone, formatDate, money, today } from '../lib/utils';
import { Button, Card, Empty, ErrorState, Field, Input, Loading, Notice } from '../components/UI';
import { mapUrl } from '../components/AddressVerify';
function PublicPhoto({ org, kind, id }: {
    org: number;
    kind: string;
    id: number;
}) {
    const { data } = useQuery({ queryKey: ['public-image', org, kind, id], queryFn: () => publicImages(org, kind, id), retry: false, staleTime: 120000 });
    const image = data?.find(i => i.primary) || data?.[0];
    return image ? <img className="choice-photo" src={image.url} alt={tr("Fotografie")} loading="lazy"/> : <div className="choice-placeholder">{kind === 'location' ? <MapPin size={29}/> : <CalendarDays size={29}/>}</div>;
}
export function PublicBookingPage() {
    const { publicId = '' } = useParams();
    const [date, setDate] = useState(addDays(today(), 1));
    const [locationId, setLocationId] = useState<number | null>(null);
    const [serviceId, setServiceId] = useState<number | null>(null);
    const [slot, setSlot] = useState<PublicSlot | null>(null);
    const [step, setStep] = useState(0);
    const [partySize, setPartySize] = useState(2);
    const [quantity, setQuantity] = useState(1);
    const [preferredResourceId,setPreferredResourceId]=useState<number|null>(null);
    const [memberId, setMemberId] = useState<number | null>(null);
    const [returnDate, setReturnDate] = useState(addDays(today(), 2));
    const [returnTime, setReturnTime] = useState('16:00');
    const [contact, setContact] = useState({ customerName: '', customerEmail: '', customerPhone: '' });
    const [error, setError] = useState('');
    const [result, setResult] = useState<BookingResult | null>(null);
    const { data: catalog, isLoading, error: catalogError } = useQuery({ queryKey: ['public-catalog', publicId, date], queryFn: () => publicCatalog(publicId, date), enabled: !!publicId, retry: false });
    const {data:mode}=useQuery({queryKey:['booking-mode',publicId],queryFn:()=>publicMode(publicId),retry:false});
    useEffect(()=>{if(mode?.settings)setActiveDateFormat(mode.settings.dateFormat);},[mode]);
    const location = catalog?.locations.find(l => l.id === locationId);
    const service = catalog?.services.find(s => s.id === serviceId);
    const availableServices = catalog?.services.filter(s => s.locationIds.some(x => Number(x) === locationId)) || [];
    const needsParty = !!service?.requirements.some(r => r.category === 'space');
    const needsQuantity = service?.requirements.length === 1 && service.requirements[0].category === 'equipment';
    const needsStaff=!!service?.requirements.some(r=>r.category==='staff');
    const isLegacy = service?.requirements.length === 0;
    const unsupportedCustomLegacy = !!isLegacy && service?.duration_mode === 'CUSTOM';
    const canPickResource=mode?.settings?.customerSelectResource===true && service?.requirements.length===1;
    const {data:availableResources}=useQuery({queryKey:['public-resources',publicId,locationId,serviceId],queryFn:()=>publicResources(publicId,locationId!,serviceId!),enabled:!!canPickResource&&!!locationId&&!!serviceId});
    const staff = catalog?.members.filter(m => m.location_id === locationId && m.service_id === serviceId).filter((m, i, all) => all.findIndex(x => x.id === m.id) === i) || [];
    const { data: slots, isLoading: slotsLoading, error: slotsError } = useQuery({ queryKey: ['public-slots', publicId, locationId, serviceId, date, needsParty ? partySize : undefined, needsQuantity ? quantity : undefined], queryFn: () => publicSlots(publicId, locationId!, serviceId!, date, needsParty ? partySize : undefined, needsQuantity ? quantity : undefined), enabled: !!locationId && !!serviceId && step >= 2, retry: false });
    useEffect(()=>{if(catalog?.locations.length===1 && !locationId){setLocationId(catalog.locations[0].id);setStep(x=>x===0?1:x);}},[catalog,locationId]);
    useEffect(() => { setSlot(null); setMemberId(null); }, [locationId, serviceId, date, partySize, quantity]);
    useEffect(() => { if (returnDate < date)
        setReturnDate(date); }, [date, returnDate]);
    useEffect(()=>{if(mode?.settings?.showStaffChoice===false && isLegacy && slot?.memberIds.length)setMemberId(slot.memberIds[0]);},[mode,slot,isLegacy]);
    const canNext = step === 0 ? !!locationId : step === 1 ? !!serviceId : step === 2 ? !!slot && !unsupportedCustomLegacy && (!isLegacy || !!memberId || (mode?.settings?.showStaffChoice===false && !!slot?.memberIds.length)) && (!needsStaff || mode?.settings?.showStaffChoice===false || !!memberId) : true;
    const booking = useMutation({ mutationFn: async () => {
            if (!catalog || !location || !service || !slot)
                throw new UiError('Vyberte všechny údaje rezervace.');
            const base = { organizationId: catalog.id, locationId: location.id, serviceId: service.id, startsAt: slot.startsAt, ...contact };
            if (isLegacy) {
                const assignedMemberId=mode?.settings?.showStaffChoice===false?(slot.memberIds[0]||memberId):memberId;
                if (!assignedMemberId) throw new UiError('Na termín není dostupný pracovník.');
                return createLegacy({ ...base, memberId:assignedMemberId });
            }
            const extra: Record<string, unknown> = {};
            if (preferredResourceId && canPickResource) extra.preferredResourceId=preferredResourceId;
            if (needsStaff && memberId && mode?.settings?.showStaffChoice!==false) extra.preferredMemberId=memberId;
            if (needsParty)
                extra.partySize = partySize;
            if (needsQuantity)
                extra.quantity = quantity;
            if (service.duration_mode === 'CUSTOM') {
                const endsAt = dateWithZone(returnDate, returnTime, location.timezone);
                if (new Date(endsAt) <= new Date(slot.startsAt))
                    throw new UiError('Čas vrácení musí být po začátku rezervace.');
                extra.endsAt = endsAt;
            }
            return createUniversal({ ...base, ...extra });
        }, onSuccess: r => { setError(tr("")); setResult(r); setStep(4); }, onError: e => setError(safeErrorMessage(e)) });
    const next = () => { setError(tr("")); if (canNext)
        setStep(x => Math.min(x + 1, 3)); };
    const stepNames = [tr('Pobočka'), tr('Služba'), tr('Termín'), tr('Kontaktní údaje')];
    return <div className="booking-page"><header className="booking-header container"><BrandLogo/><Link to="/" className="back-link"><ArrowLeft size={17}/>{tr("Zp\u011Bt na \u00FAvod")}</Link><LanguageSelect compact/></header><div className="booking-hero"><div className="container"><span className="eyebrow eyebrow-light">{tr("ONLINE REZERVACE")}</span><h1>{catalog?.name || tr('Rezervace termínu')}</h1><p>{tr("Vyberte si slu\u017Ebu a \u010Das, kter\u00FD v\u00E1m vyhovuje. Hotovo b\u011Bhem p\u00E1r okam\u017Eik\u016F.")}</p></div></div><main className="booking-main container">
    {catalogError ? <Card><ErrorState error={catalogError}/><p className="muted">{tr('Rezervační stránku se nepodařilo načíst. Zkuste to prosím později.')}</p></Card> : isLoading ? <Loading /> : catalog && !catalog.bookingEnabled ? <Card><Empty title={tr("Rezervace jsou do\u010Dasn\u011B pozastaven\u00E9")} description={tr("Kontaktujte provozovnu.")}/></Card> : catalog && <>
      {step < 4 && <div className="steps">{stepNames.map((s, i) => catalog.locations.length===1 && i===0?null:<div key={s} className={`step ${step === i ? 'step-active' : ''} ${step > i ? 'step-done' : ''}`}><span>{step > i ? <Check size={15}/> : i + 1}</span><strong>{s}</strong></div>)}</div>}
      <div className="booking-layout"><div className="booking-workspace">
        {step === 0 && catalog.locations.length!==1 && <><div className="section-title"><span className="eyebrow">{tr("KROK 01")}</span><h2>{tr("Kde n\u00E1s nav\u0161t\u00EDv\u00EDte?")}</h2><p>{tr("Vyberte pobo\u010Dku, kter\u00E1 v\u00E1m nejl\u00E9pe vyhovuje.")}</p></div>{catalog.locations.length === 0 ? <Empty title={tr("\u017D\u00E1dn\u00E9 dostupn\u00E9 pobo\u010Dky")}/> : <div className="choice-grid">{catalog.locations.map(l => <button key={l.id} onClick={() => { setLocationId(l.id); setServiceId(null); }} className={`choice-card ${locationId === l.id ? 'selected' : ''}`}><PublicPhoto org={catalog.id} kind="location" id={l.id}/><div className="choice-content"><strong>{l.name}</strong><span><MapPin size={14}/>{l.address || tr('Adresa není uvedena')}</span></div><span className="choice-check">{locationId === l.id && <Check size={15}/>}</span></button>)}</div>}</>}
        {step === 1 && <><div className="section-title"><span className="eyebrow">{tr("KROK 02")}</span><h2>{tr("Jakou slu\u017Ebu si p\u0159ejete?")}</h2><p>{tr("Vyberte slu\u017Ebu z nab\u00EDdky pobo\u010Dky ")}{location?.name}.</p></div><div className="service-date-field"><Field label={tr("Datum pl\u00E1novan\u00E9 rezervace")}><Input type="date" min={today()} value={date} onChange={e => { setDate(e.target.value); setServiceId(null); }}/></Field></div>{availableServices.length === 0 ? <Empty title={tr("Pro tuto pobo\u010Dku zat\u00EDm nejsou slu\u017Eby")} description={tr('Zatím zde nejsou k dispozici žádné služby. Zkuste jinou pobočku nebo datum.')}/> : <div className="service-choices">{availableServices.map(s => <button key={s.id} className={`service-choice ${serviceId === s.id ? 'selected' : ''}`} onClick={() => { setServiceId(s.id); setQuantity(s.requirements[0]?.quantity || 1); }}><PublicPhoto org={catalog.id} kind="service" id={s.id}/><div className="service-choice-content"><strong>{s.name}</strong><p>{s.description || tr('Profesionální služba pro vás.')}</p><span><Clock3 size={14}/> {s.duration_mode === 'CUSTOM' ? tr('Délka dle výběru') : `${s.duration_minutes} min`}</span></div><div className="service-choice-price"><b>{money(s.price, s.currency)}</b><span className="choice-radio">{serviceId === s.id && <Check size={13}/>}</span></div></button>)}</div>}</>}
        {step === 2 && <><div className="section-title"><span className="eyebrow">{tr("KROK 03")}</span><h2>{tr("Vyberte datum a \u010Das")}</h2><p>{tr("Najd\u011Bte si term\u00EDn, kter\u00FD se v\u00E1m hod\u00ED.")}</p></div><Card className="date-card"><div className="date-navigation"><button onClick={() => setDate(d => addDays(d, -1))} disabled={date <= today()} aria-label={tr("P\u0159edchoz\u00ED den")}><ChevronLeft size={18}/></button><div><CalendarDays size={19}/><strong>{formatDate(date)}</strong></div><button onClick={() => setDate(d => addDays(d, 1))} aria-label={tr("Dal\u0161\u00ED den")}><ChevronRight size={18}/></button></div><input aria-label={tr("Vybrat datum")} className="date-native" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)}/></Card>
          {needsParty && <Card className="capacity-card"><div><strong>{tr("Po\u010Det osob")}</strong><p>{tr("Najdeme vhodn\u00FD prostor pro va\u0161i skupinu.")}</p></div><div className="counter"><button onClick={() => setPartySize(v => Math.max(1, v - 1))} aria-label={tr("M\u00E9n\u011B osob")}><Minus size={16}/></button><strong>{partySize}</strong><button onClick={() => setPartySize(v => Math.min(100, v + 1))} aria-label={tr("V\u00EDce osob")}><Plus size={16}/></button></div></Card>}
          {needsQuantity && <Card className="capacity-card"><div><strong>{tr("Po\u010Det kus\u016F")}</strong><p>{tr("Kolik kus\u016F vybaven\u00ED pot\u0159ebujete?")}</p></div><div className="counter"><button onClick={() => setQuantity(v => Math.max(service?.requirements[0]?.quantity || 1, v - 1))}><Minus size={16}/></button><strong>{quantity}</strong><button onClick={() => setQuantity(v => Math.min(100, v + 1))}><Plus size={16}/></button></div></Card>}
          <div className="slot-section"><h3>{tr("Dostupn\u00E9 za\u010D\u00E1tky")}</h3>{slotsLoading ? <Loading label={tr("Hled\u00E1m term\u00EDny\u2026")}/> : slotsError ? <ErrorState error={slotsError}/> : !slots?.slots.length ? <Empty title={tr("Pro tento den nejsou voln\u00E9 term\u00EDny")} description={tr("Zkuste jin\u00E9 datum nebo pobo\u010Dku.")}/> : <div className="slot-grid">{slots.slots.map(s => <button key={s.startsAt} onClick={() => { setSlot(s); setMemberId(null); }} className={`slot-button ${slot?.startsAt === s.startsAt ? 'selected' : ''}`}>{s.time.slice(0, 5)}</button>)}</div>}</div>
          {unsupportedCustomLegacy && <Notice message={tr("Pro slu\u017Ebu s volitelnou d\u00E9lkou je pot\u0159eba v administraci nastavit po\u017Eadavky na zdroje.")} kind="info"/>}
          {canPickResource && !!availableResources?.length && <div className="member-picker"><h3>{st('Zákazník si smí vybrat konkrétní zdroj')}</h3><select className="input" value={preferredResourceId??''} onChange={e=>setPreferredResourceId(e.target.value?Number(e.target.value):null)}><option value="">{tr('Kdokoliv dostupný')}</option>{availableResources.map(r=><option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}</select></div>}
          {(isLegacy||needsStaff) && slot && mode?.settings?.showStaffChoice!==false && <div className="member-picker"><h3>{tr("Vyberte pracovn\u00EDka")}</h3><div className="member-options">{staff.filter(m => slot.memberIds.some(id => Number(id) === m.id)).map(m => <button className={memberId === m.id ? 'selected' : ''} key={m.id} onClick={() => setMemberId(m.id)}><UserRound size={17}/>{m.display_name}{memberId === m.id && <Check size={16}/>}</button>)}</div></div>}
          {service?.duration_mode === 'CUSTOM' && slot && <Card className="return-card"><h3>{tr("Datum a \u010Das vr\u00E1cen\u00ED")}</h3><p className="muted">{tr("U p\u016Fj\u010Doven zvolte konec pron\u00E1jmu. Fin\u00E1ln\u00ED dostupnost se ov\u011B\u0159\u00ED p\u0159i odesl\u00E1n\u00ED.")}</p><div className="form-grid"><Field label={tr("Datum vr\u00E1cen\u00ED")}><Input type="date" min={date} value={returnDate < date ? date : returnDate} onChange={e => setReturnDate(e.target.value)}/></Field><Field label={tr("\u010Cas vr\u00E1cen\u00ED")}><Input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)}/></Field></div></Card>}
          {slots?.slots.length ? <p className="muted small"><ShieldCheck size={14}/>{tr("Term\u00EDn se p\u0159i potvrzen\u00ED znovu ov\u011B\u0159\u00ED. M\u016F\u017Ee se mezit\u00EDm obsadit.")}</p> : null}
        </>}
        {step === 3 && <><div className="section-title"><span className="eyebrow">{tr("KROK 04")}</span><h2>{tr("Je\u0161t\u011B p\u00E1r \u00FAdaj\u016F")}</h2><p>{tr("Kam v\u00E1m m\u016F\u017Eeme poslat potvrzen\u00ED rezervace?")}</p></div><form id="booking-contact" className="contact-form" onSubmit={e => { e.preventDefault(); booking.mutate(); }}><Notice message={error}/><Field label={tr("Jm\u00E9no a p\u0159\u00EDjmen\u00ED")}><Input value={contact.customerName} onChange={e => setContact(p => ({ ...p, customerName: e.target.value }))} placeholder={tr("Jan Nov\u00E1k")} required minLength={2}/></Field><Field label={tr("E-mail")}><Input type="email" value={contact.customerEmail} onChange={e => setContact(p => ({ ...p, customerEmail: e.target.value }))} placeholder={tr("jan@email.cz")} required/></Field><Field label={tr("Telefon (voliteln\u00E9)")}><Input type="tel" value={contact.customerPhone} onChange={e => setContact(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+420 777 123 456"/></Field><p className="muted small"><ShieldCheck size={15}/>{tr("Va\u0161e \u00FAdaje budou pou\u017Eity pouze pro zpracov\u00E1n\u00ED rezervace.")}</p><Button type="submit" loading={booking.isPending} className="btn-full">{tr("Potvrdit rezervaci ")}<ArrowRight size={18}/></Button></form></>}
        {step === 4 && result && <div className="booking-success"><div className="success-ring"><CheckCircle2 size={44}/></div><span className="eyebrow">{tr("HOTOVO!")}</span><h2>{tr("Rezervace je potvrzena")}</h2><p>{tr("Va\u0161e rezervace \u010D\u00EDslo ")}<strong>#{result.id}</strong>{tr("byla \u00FAsp\u011B\u0161n\u011B vytvo\u0159ena.")}</p><Card><div className="summary-row"><span>{tr("Datum a \u010Das")}</span><strong>{formatDate(date)}, {slot?.time.slice(0, 5)}</strong></div><div className="summary-row"><span>{tr("Pobo\u010Dka")}</span><strong>{location?.name}</strong></div><div className="summary-row"><span>{tr("Slu\u017Eba")}</span><strong>{service?.name}</strong></div><div className="summary-row"><span>{tr("Cena")}</span><strong>{money(result.price, result.currency)}</strong></div></Card><Link className="btn btn-primary" to={`/manage/${publicUuidFromManageUrl(result.manageUrl)}`}>{tr("Spravovat rezervaci ")}<ArrowRight size={17}/></Link><p className="muted small">{tr("Odkaz na spr\u00E1vu si ulo\u017Ete. Obsahuje tajn\u00FD p\u0159\u00EDstupov\u00FD token.")}</p></div>}
        {step > 0 && step < 4 && <div className="wizard-actions"><Button variant="secondary" disabled={step===1 && catalog.locations.length===1} onClick={() => { setError(tr("")); setStep(x => x===1 && catalog.locations.length===1 ? 1 : x - 1); }}><ArrowLeft size={17}/>{tr("Zp\u011Bt")}</Button>{step < 3 && <Button disabled={!canNext} onClick={next}>{tr("Pokra\u010Dovat ")}<ArrowRight size={17}/></Button>}</div>}
      </div>{step < 4 && <aside className="booking-summary"><div className="summary-top"><span className="eyebrow">{tr("VA\u0160E REZERVACE")}</span><h3>{tr("Souhrn objedn\u00E1vky")}</h3></div><div className="summary-content"><div className="summary-item"><span className="summary-icon"><MapPin size={18}/></span><div><small>{tr("Pobo\u010Dka")}</small><strong>{location?.name || tr('Zatím nevybráno')}</strong>{location?.latitude!=null && location?.longitude!=null && <a className="geo-public-map" href={mapUrl(location.latitude,location.longitude)} target="_blank" rel="noopener noreferrer">{tr('Zobrazit na mapě')} ↗</a>}</div></div><div className="summary-item"><span className="summary-icon"><CalendarDays size={18}/></span><div><small>{tr("Slu\u017Eba")}</small><strong>{service?.name || tr('Zatím nevybráno')}</strong></div></div><div className="summary-item"><span className="summary-icon"><Clock3 size={18}/></span><div><small>{tr("Term\u00EDn")}</small><strong>{slot ? `${formatDate(date)}, ${slot.time.slice(0, 5)}` : tr('Zatím nevybráno')}</strong></div></div>{needsParty && <div className="summary-item"><span className="summary-icon"><UsersRound size={18}/></span><div><small>{tr("Po\u010Det osob")}</small><strong>{partySize}</strong></div></div>}</div><div className="summary-total"><span>{tr("Celkov\u00E1 cena")}</span><strong>{service ? money(service.price, service.currency) : '—'}</strong></div><div className="summary-bottom"><ShieldCheck size={17}/>{tr("Bezpe\u010Dn\u00E1 rezervace bez registrace")}</div></aside>}</div>
    </>}
  </main><footer className="booking-footer container">{tr("Rezerva\u010Dn\u00ED syst\u00E9m ")}<Link to="/">Bookanear</Link> · {new Date().getFullYear()}</footer></div>;
}
