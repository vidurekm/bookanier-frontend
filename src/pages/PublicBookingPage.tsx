import { publicMode, publicResources } from '../lib/setup';
import { setActiveDateFormat } from '../lib/dateFormat';
import { st } from '../lib/setupTranslations';
import { safeErrorMessage } from '../lib/errors';
import { UiError } from '../lib/errors';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSelect } from '../components/PreferencesControls';
import { tr, translateWith } from '../lib/translations';
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
    return image ? <img className="choice-photo" src={image.url} alt={tr("Photos")} loading="lazy"/> : <div className="choice-placeholder">{kind === 'location' ? <MapPin size={29}/> : <CalendarDays size={29}/>}</div>;
}
function PublicOrganizationBranding({ org }: { org: number }) {
    const {data:logo}=useQuery({queryKey:['public-image',org,'organization-logo',org],queryFn:()=>publicImages(org,'organization-logo',org),enabled:org>0,retry:false,staleTime:120000});
    const {data:photos}=useQuery({queryKey:['public-image',org,'organization',org],queryFn:()=>publicImages(org,'organization',org),enabled:org>0,retry:false,staleTime:120000});
    const orderedPhotos=[...(photos||[])].sort((a,b)=>Number(b.primary)-Number(a.primary)||a.sortOrder-b.sortOrder);
    return <>
        {logo?.[0] && <img className="public-organization-logo" src={logo[0].url} alt={tr('Organization logo')} />}
        {!!orderedPhotos.length && <div className="public-organization-photos">{orderedPhotos.map((image,index)=><img key={image.id} className={index===0?'public-organization-photo primary':'public-organization-photo'} src={image.url} alt={tr('Organization photos')} loading="lazy"/>)}</div>}
    </>;
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
    const [preferredMemberIds,setPreferredMemberIds]=useState<number[]>([]);
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
    const maxBookingDate = addDays(today(), Number(mode?.settings?.maxAdvanceDays ?? 180));
    const nonStaffRequirements=service?.requirements.filter(r=>r.category!=='staff')??[];
    const needsParty = !!service?.requirements.some(r => r.category === 'space');
    const needsQuantity = nonStaffRequirements.length === 1 && nonStaffRequirements[0].category === 'equipment';
    const needsStaff=!!service?.requirements.some(r=>r.category==='staff');
    const isLegacy = service?.requirements.length === 0;
    const unsupportedCustomLegacy = !!isLegacy && service?.duration_mode === 'CUSTOM';
    const canPickResource=service?.customer_can_choose_resource===true && nonStaffRequirements.length===1 && nonStaffRequirements[0].quantity===1;
    const {data:availableResources}=useQuery({queryKey:['public-resources',publicId,locationId,serviceId],queryFn:()=>publicResources(publicId,locationId!,serviceId!),enabled:!!canPickResource&&!!locationId&&!!serviceId});
    const staff = catalog?.members.filter(m => m.location_id === locationId && m.service_id === serviceId).filter((m, i, all) => all.findIndex(x => x.id === m.id) === i) || [];
    const requiredStaffCount=service?.required_staff_count??1;
    const { data: slots, isLoading: slotsLoading, error: slotsError } = useQuery({ queryKey: ['public-slots', publicId, locationId, serviceId, date, needsParty ? partySize : undefined, needsQuantity ? quantity : undefined], queryFn: () => publicSlots(publicId, locationId!, serviceId!, date, needsParty ? partySize : undefined, needsQuantity ? quantity : undefined), enabled: !!locationId && !!serviceId && step >= 2, retry: false });
    useEffect(()=>{if(catalog?.locations.length===1 && !locationId){setLocationId(catalog.locations[0].id);setStep(x=>x===0?1:x);}},[catalog,locationId]);
    useEffect(() => { setSlot(null); setMemberId(null); setPreferredMemberIds([]); setPreferredResourceId(null); }, [locationId, serviceId, date, partySize, quantity]);
    useEffect(() => { if (returnDate < date)
        setReturnDate(date); }, [date, returnDate]);
    useEffect(()=>{if(service?.customer_can_choose_staff!==true && isLegacy && slot?.memberIds.length)setMemberId(slot.memberIds[0]);},[service,isLegacy,slot]);
    const canNext = step === 0 ? !!locationId : step === 1 ? !!serviceId : step === 2 ? !!slot && !unsupportedCustomLegacy && (!service?.customer_can_choose_staff || preferredMemberIds.length===requiredStaffCount) && (!isLegacy || service?.customer_can_choose_staff===true || !!slot.memberIds.length) : true;
    const booking = useMutation({ mutationFn: async () => {
            if (!catalog || !location || !service || !slot)
                throw new UiError('Complete all booking details.');
            const base = { organizationId: catalog.id, locationId: location.id, serviceId: service.id, startsAt: slot.startsAt, ...contact };
            if (isLegacy) {
                const assignedMemberId=service.customer_can_choose_staff===true?preferredMemberIds[0]:slot.memberIds[0]||memberId;
                if (!assignedMemberId) throw new UiError('No staff member is available for this time.');
                return createLegacy({ ...base, memberId:assignedMemberId });
            }
            const extra: Record<string, unknown> = {};
            if (preferredResourceId && canPickResource) extra.preferredResourceId=preferredResourceId;
            if (needsStaff && service.customer_can_choose_staff===true) extra.preferredMemberIds=preferredMemberIds;
            if (needsParty)
                extra.partySize = partySize;
            if (needsQuantity)
                extra.quantity = quantity;
            if (service.duration_mode === 'CUSTOM') {
                const endsAt = dateWithZone(returnDate, returnTime, location.timezone);
                if (new Date(endsAt) <= new Date(slot.startsAt))
                    throw new UiError('The return time must be after the booking start.');
                extra.endsAt = endsAt;
            }
            return createUniversal({ ...base, ...extra });
        }, onSuccess: r => { setError(tr("")); setResult(r); setStep(4); }, onError: e => setError(safeErrorMessage(e)) });
    const next = () => { setError(tr("")); if (canNext)
        setStep(x => Math.min(x + 1, 3)); };
    const stepNames = [tr('Location'), tr('Service'), tr('Appointment'), tr('Contact details')];
    return <div className="booking-page"><header className="booking-header container"><BrandLogo/><Link to="/" className="back-link"><ArrowLeft size={17}/>{tr("Back to home")}</Link><LanguageSelect compact/></header><div className="booking-hero"><div className="container"><span className="eyebrow eyebrow-light">{tr("ONLINE BOOKING")}</span>{catalog&&<PublicOrganizationBranding org={catalog.id}/>}<h1>{catalog?.name || tr('Book an appointment')}</h1><p>{tr("Choose a service and a time that suits you. It only takes a moment.")}</p></div></div><main className="booking-main container">
    {catalogError ? <Card><ErrorState error={catalogError}/><p className="muted">{tr('The booking page could not be loaded. Please try again later.')}</p></Card> : isLoading ? <Loading /> : catalog && !catalog.bookingEnabled ? <Card><Empty title={tr("Bookings are temporarily paused")} description={tr("Contact the business.")}/></Card> : catalog && <>
      {step < 4 && <div className="steps">{stepNames.map((s, i) => catalog.locations.length===1 && i===0?null:<div key={s} className={`step ${step === i ? 'step-active' : ''} ${step > i ? 'step-done' : ''}`}><span>{step > i ? <Check size={15}/> : i + 1}</span><strong>{s}</strong></div>)}</div>}
      <div className="booking-layout"><div className="booking-workspace">
        {step === 0 && catalog.locations.length!==1 && <><div className="section-title"><span className="eyebrow">{tr("STEP 01")}</span><h2>{tr("Where will you visit us?")}</h2><p>{tr("Choose the location that suits you best.")}</p></div>{catalog.locations.length === 0 ? <Empty title={tr("No available locations")}/> : <div className="choice-grid">{catalog.locations.map(l => <button key={l.id} onClick={() => { setLocationId(l.id); setServiceId(null); }} className={`choice-card ${locationId === l.id ? 'selected' : ''}`}><PublicPhoto org={catalog.id} kind="location" id={l.id}/><div className="choice-content"><strong>{l.name}</strong><span><MapPin size={14}/>{l.address || tr('Address not provided')}</span></div><span className="choice-check">{locationId === l.id && <Check size={15}/>}</span></button>)}</div>}</>}
        {step === 1 && <><div className="section-title"><span className="eyebrow">{tr("STEP 02")}</span><h2>{tr("Which service would you like?")}</h2><p>{tr("Choose a service at ")}{location?.name}.</p></div><div className="service-date-field"><Field label={tr("Planned booking date")}><Input type="date" min={today()} max={maxBookingDate} value={date} onChange={e => { setDate(e.target.value); setServiceId(null); }}/></Field></div>{availableServices.length === 0 ? <Empty title={tr("No services at this location yet")} description={tr('There are no services available yet. Try another location or date.')}/> : <div className="service-choices">{availableServices.map(s => <button key={s.id} className={`service-choice ${serviceId === s.id ? 'selected' : ''}`} onClick={() => { setServiceId(s.id); setQuantity(s.requirements.find(r=>r.category!=='staff')?.quantity || 1); }}><PublicPhoto org={catalog.id} kind="service" id={s.id}/><div className="service-choice-content"><strong>{s.name}</strong><p>{s.description || tr('Professional service for you.')}</p><span><Clock3 size={14}/> {s.duration_mode === 'CUSTOM' ? tr('Custom duration') : `${s.duration_minutes} min`}</span></div><div className="service-choice-price"><b>{money(s.price, s.currency)}</b><span className="choice-radio">{serviceId === s.id && <Check size={13}/>}</span></div></button>)}</div>}</>}
        {step === 2 && <><div className="section-title"><span className="eyebrow">{tr("STEP 03")}</span><h2>{tr("Choose date and time")}</h2><p>{tr("Find a time that works for you.")}</p></div><Card className="date-card"><div className="date-navigation"><button onClick={() => setDate(d => addDays(d, -1))} disabled={date <= today()} aria-label={tr("Previous day")}><ChevronLeft size={18}/></button><div><CalendarDays size={19}/><strong>{formatDate(date)}</strong></div><button onClick={() => setDate(d => addDays(d, 1))} disabled={date >= maxBookingDate} aria-label={tr("Next day")}><ChevronRight size={18}/></button></div><input aria-label={tr("Choose date")} className="date-native" type="date" min={today()} max={maxBookingDate} value={date} onChange={e => setDate(e.target.value)}/></Card>
          {needsParty && <Card className="capacity-card"><div><strong>{tr("Party size")}</strong><p>{tr("We'll find a suitable space for your group.")}</p></div><div className="counter"><button onClick={() => setPartySize(v => Math.max(1, v - 1))} aria-label={tr("Fewer people")}><Minus size={16}/></button><strong>{partySize}</strong><button onClick={() => setPartySize(v => Math.min(100, v + 1))} aria-label={tr("More people")}><Plus size={16}/></button></div></Card>}
          {needsQuantity && <Card className="capacity-card"><div><strong>{tr("Quantity")}</strong><p>{tr("How many items do you need?")}</p></div><div className="counter"><button onClick={() => setQuantity(v => Math.max(nonStaffRequirements[0]?.quantity || 1, v - 1))}><Minus size={16}/></button><strong>{quantity}</strong><button onClick={() => setQuantity(v => Math.min(100, v + 1))}><Plus size={16}/></button></div></Card>}
          <div className="slot-section"><h3>{tr("Available start times")}</h3>{slotsLoading ? <Loading label={tr("Finding available times…")}/> : slotsError ? <ErrorState error={slotsError}/> : !slots?.slots.length ? <Empty title={tr("No availability on this day")} description={tr("Try another date or location.")}/> : <div className="slot-grid">{slots.slots.map(s => <button key={s.startsAt} onClick={() => { setSlot(s); setMemberId(null); setPreferredMemberIds([]); }} className={`slot-button ${slot?.startsAt === s.startsAt ? 'selected' : ''}`}>{s.time.slice(0, 5)}</button>)}</div>}</div>
          {unsupportedCustomLegacy && <Notice message={tr("For variable-duration services, resource requirements must be configured in the admin area.")} kind="info"/>}
          {canPickResource && !!availableResources?.length && <div className="member-picker"><h3>{st('Customer may select a specific resource')}</h3><select className="input" value={preferredResourceId??''} onChange={e=>setPreferredResourceId(e.target.value?Number(e.target.value):null)}><option value="">{tr('Anyone available')}</option>{availableResources.map(r=><option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}</select></div>}
          {(isLegacy||needsStaff) && slot && service?.customer_can_choose_staff===true && <div className="member-picker"><h3>{requiredStaffCount>1?translateWith("Choose {count} staff members",{count:requiredStaffCount}):tr("Choose a staff member")}</h3><div className="member-options">{staff.filter(m => slot.memberIds.some(id => Number(id) === m.id)).map(m => {const selected=preferredMemberIds.includes(m.id);return <button className={selected ? 'selected' : ''} key={m.id} disabled={!selected&&preferredMemberIds.length>=requiredStaffCount} onClick={() => {const next=selected?preferredMemberIds.filter(id=>id!==m.id):[...preferredMemberIds,m.id];setPreferredMemberIds(next);setMemberId(next[0]??null);}}><UserRound size={17}/>{m.display_name}{selected && <Check size={16}/>}</button>})}</div></div>}
          {service?.duration_mode === 'CUSTOM' && slot && <Card className="return-card"><h3>{tr("Return date and time")}</h3><p className="muted">{tr("For rentals, select the end of the rental period. Availability is checked when you submit.")}</p><div className="form-grid"><Field label={tr("Return date")}><Input type="date" min={date} value={returnDate < date ? date : returnDate} onChange={e => setReturnDate(e.target.value)}/></Field><Field label={tr("Return time")}><Input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)}/></Field></div></Card>}
          {slots?.slots.length ? <p className="muted small"><ShieldCheck size={14}/>{tr("Availability will be checked again on confirmation. The slot may be taken in the meantime.")}</p> : null}
        </>}
        {step === 3 && <><div className="section-title"><span className="eyebrow">{tr("STEP 04")}</span><h2>{tr("Just a few details")}</h2><p>{tr("Where can we send your booking confirmation?")}</p></div><form id="booking-contact" className="contact-form" onSubmit={e => { e.preventDefault(); booking.mutate(); }}><Notice message={error}/><Field label={tr("Full name")}><Input value={contact.customerName} onChange={e => setContact(p => ({ ...p, customerName: e.target.value }))} placeholder={tr("John Smith")} required minLength={2}/></Field><Field label={tr("Email")}><Input type="email" value={contact.customerEmail} onChange={e => setContact(p => ({ ...p, customerEmail: e.target.value }))} placeholder={tr("jan@email.cz")} required/></Field><Field label={tr("Phone (optional)")}><Input type="tel" value={contact.customerPhone} onChange={e => setContact(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+420 777 123 456"/></Field><p className="muted small"><ShieldCheck size={15}/>{tr("Your details will only be used to process your booking.")}</p><Button type="submit" loading={booking.isPending} className="btn-full">{tr("Confirm booking ")}<ArrowRight size={18}/></Button></form></>}
        {step === 4 && result && <div className="booking-success"><div className="success-ring"><CheckCircle2 size={44}/></div><span className="eyebrow">{tr("DONE!")}</span><h2>{tr("Booking confirmed")}</h2><p>{tr("Your booking number ")}<strong>#{result.id}</strong>{tr("has been created successfully.")}</p><Card><div className="summary-row"><span>{tr("Date and time")}</span><strong>{formatDate(date)}, {slot?.time.slice(0, 5)}</strong></div><div className="summary-row"><span>{tr("Location")}</span><strong>{location?.name}</strong></div><div className="summary-row"><span>{tr("Service")}</span><strong>{service?.name}</strong></div><div className="summary-row"><span>{tr("Price")}</span><strong>{money(result.price, result.currency)}</strong></div></Card><Link className="btn btn-primary" to={`/manage/${publicUuidFromManageUrl(result.manageUrl)}`}>{tr("Manage booking ")}<ArrowRight size={17}/></Link><p className="muted small">{tr("Save the management link. It contains a private access token.")}</p></div>}
        {step > 0 && step < 4 && <div className="wizard-actions"><Button variant="secondary" disabled={step===1 && catalog.locations.length===1} onClick={() => { setError(tr("")); setStep(x => x===1 && catalog.locations.length===1 ? 1 : x - 1); }}><ArrowLeft size={17}/>{tr("Back")}</Button>{step < 3 && <Button disabled={!canNext} onClick={next}>{tr("Continue ")}<ArrowRight size={17}/></Button>}</div>}
      </div>{step < 4 && <aside className="booking-summary"><div className="summary-top"><span className="eyebrow">{tr("YOUR BOOKING")}</span><h3>{tr("Booking summary")}</h3></div><div className="summary-content"><div className="summary-item"><span className="summary-icon"><MapPin size={18}/></span><div><small>{tr("Location")}</small><strong>{location?.name || tr('Not selected yet')}</strong>{location?.latitude!=null && location?.longitude!=null && <a className="geo-public-map" href={mapUrl(location.latitude,location.longitude)} target="_blank" rel="noopener noreferrer">{tr('Show on map')} ↗</a>}</div></div><div className="summary-item"><span className="summary-icon"><CalendarDays size={18}/></span><div><small>{tr("Service")}</small><strong>{service?.name || tr('Not selected yet')}</strong></div></div><div className="summary-item"><span className="summary-icon"><Clock3 size={18}/></span><div><small>{tr("Appointment")}</small><strong>{slot ? `${formatDate(date)}, ${slot.time.slice(0, 5)}` : tr('Not selected yet')}</strong></div></div>{needsParty && <div className="summary-item"><span className="summary-icon"><UsersRound size={18}/></span><div><small>{tr("Party size")}</small><strong>{partySize}</strong></div></div>}</div><div className="summary-total"><span>{tr("Total price")}</span><strong>{service ? money(service.price, service.currency) : '—'}</strong></div><div className="summary-bottom"><ShieldCheck size={17}/>{tr("Secure booking without registration")}</div></aside>}</div>
    </>}
  </main><footer className="booking-footer container">{tr("Booking system ")}<Link to="/">Bookanear</Link> · {new Date().getFullYear()}</footer></div>;
}
