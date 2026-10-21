import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LanguageSelect } from '../components/PreferencesControls';
import { Button, Card, Field, Input, Loading, Notice, PageTitle } from '../components/UI';
import { bookEvent, cancelEventBooking, manageEvent, publicEvents, type EventOccurrence, type PublicRegistration } from '../lib/events';
import { safeErrorMessage } from '../lib/errors';
import { st } from '../lib/setupTranslations';
import { formatDate, money } from '../lib/utils';
import { publicMode } from '../lib/setup';
import { setActiveDateFormat } from '../lib/dateFormat';

export function PublicEventsPage(){
 const {publicId=''}=useParams();
 const {data:mode}=useQuery({queryKey:['booking-mode',publicId],queryFn:()=>publicMode(publicId)});
 useEffect(()=>{if(mode?.settings)setActiveDateFormat(mode.settings.dateFormat);},[mode]);
 const {data:events,isLoading,error}=useQuery({queryKey:['public-events',publicId],queryFn:()=>publicEvents(publicId)});
 const [locationFilter,setLocationFilter]=useState(0);
 const locationChoices=Array.from(new Map((events||[]).map(e=>[e.location_id,e.location_name||String(e.location_id)])).entries());
 const filteredEvents=(events||[]).filter(e=>!locationFilter||e.location_id===locationFilter);
 const [selected,setSelected]=useState<EventOccurrence|null>(null);const [form,setForm]=useState({customerName:'',customerEmail:'',customerPhone:'',seats:1});const [result,setResult]=useState<PublicRegistration|null>(null);const [errorText,setErrorText]=useState('');
 const book=useMutation({mutationFn:()=>bookEvent(publicId,selected!.id,form),onSuccess:r=>{setResult(r);setErrorText('');},onError:e=>setErrorText(safeErrorMessage(e))});
 return <div className="booking-page"><header className="booking-header container"><BrandLogo/><Link to="/">Bookanear</Link><LanguageSelect compact/></header><main className="container setup-public"><PageTitle eyebrow="BOOKANEAR" title={st('Skupinové události')} description={st('Rezervace události')}/>{locationChoices.length>1 && <div className="setup-location-filter"><Field label={st('Vyberte pobočku')}><select className="input" value={locationFilter} onChange={e=>setLocationFilter(Number(e.target.value))}><option value={0}>{st('Pobočky')}</option>{locationChoices.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></Field></div>}{isLoading?<Loading/>:error?<Notice message={safeErrorMessage(error)}/>:<div className="setup-event-grid">{filteredEvents.length?filteredEvents.map(e=><Card key={e.id}><div className="event-card-head"><CalendarDays size={20}/><h3>{e.title}</h3></div><p>{formatDate(e.starts_at)} · {new Date(e.starts_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p><p><MapPin size={15}/> {e.location_name}</p><p><Users size={15}/> {st('Volná místa')}: <strong>{e.available}/{e.capacity}</strong></p><div className="event-book-row"><strong>{money(Number(e.price||0),e.currency||'CZK')}</strong><Button disabled={e.available<1} onClick={()=>{setSelected(e);setResult(null);setErrorText('');}}>{e.available>0?st('Rezervovat místa'):st('Událost je plná')}</Button></div></Card>):<Card>{st('Žádné vypsané termíny')}</Card>}</div>}
 {selected && <div className="event-book-panel"><Card><div className="event-card-head"><h2>{selected.title}</h2><Button variant="ghost" onClick={()=>setSelected(null)}>×</Button></div>{result?<div className="stack"><CheckCircle2 size={36}/><h3>{st('Potvrzení rezervace')}</h3><p>{st('Rezervace byla vytvořena. Uložte si odkaz na správu.')}</p><a href={result.manageUrl}>{result.manageUrl}</a></div>:<form className="stack" onSubmit={(e:FormEvent)=>{e.preventDefault();if(form.seats>selected.available){setErrorText(st('Příliš mnoho požadovaných míst'));return;}book.mutate();}}><Notice message={errorText}/><Field label={st('Název')}><Input required value={form.customerName} onChange={e=>setForm(p=>({...p,customerName:e.target.value}))}/></Field><Field label={st('E-mail')}><Input type="email" required value={form.customerEmail} onChange={e=>setForm(p=>({...p,customerEmail:e.target.value}))}/></Field><Field label={st('Telefon')}><Input value={form.customerPhone} onChange={e=>setForm(p=>({...p,customerPhone:e.target.value}))}/></Field><Field label={st('Počet míst')}><Input type="number" min={1} max={Math.min(100,selected.available)} value={form.seats} onChange={e=>setForm(p=>({...p,seats:Number(e.target.value)}))}/></Field><Button type="submit" loading={book.isPending}>{st('Potvrdit rezervaci')}</Button></form>}</Card></div>}</main></div>;
}
export function ManageEventPage(){
 const {token=''}=useParams();const qc=useQueryClient();const {data,error,isLoading}=useQuery({queryKey:['manage-event',token],queryFn:()=>manageEvent(token)});const [err,setErr]=useState('');
 const cancel=useMutation({mutationFn:()=>cancelEventBooking(token),onSuccess:()=>qc.invalidateQueries({queryKey:['manage-event',token]}),onError:e=>setErr(safeErrorMessage(e))});
 return <div className="booking-page"><header className="booking-header container"><BrandLogo/><LanguageSelect compact/></header><main className="container setup-public"><PageTitle title={st('Moje rezervace události')}/><Card>{isLoading?<Loading/>:error?<Notice message={safeErrorMessage(error)}/>:<div className="stack"><h2>{data?.title}</h2><p>{data?.customer_name} · {data?.seats} {st('Počet míst')}</p><p>{data?.starts_at?formatDate(data.starts_at):''}</p><p>{data?.status}</p><Notice message={err}/>{data?.status==='confirmed' && <Button variant="danger" loading={cancel.isPending} onClick={()=>{if(window.confirm(st('Zrušit rezervaci')+'?'))cancel.mutate();}}>{st('Zrušit rezervaci')}</Button>}</div>}</Card></main></div>;
}
