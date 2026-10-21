import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Users, Plus, CalendarDays } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { Button, Card, Field, Input, Notice, Loading, PageTitle, Select } from '../components/UI';
import { locations } from '../lib/api';
import { getSetup } from '../lib/setup';
import { createEventOccurrence, createEventSeries, updateEventSeries, cancelEventOccurrence, eventOccurrences, eventRegistrations, eventSeries, type EventOccurrence } from '../lib/events';
import { safeErrorMessage } from '../lib/errors';
import { st } from '../lib/setupTranslations';
import { formatDate } from '../lib/utils';

export function AdminEvents() {
 const {orgId}=useAdmin(); const qc=useQueryClient();
 const {data:setup}=useQuery({queryKey:['setup',orgId],queryFn:()=>getSetup(orgId)});
 const {data:locs}=useQuery({queryKey:['event-locations',orgId],queryFn:()=>locations(orgId)});
 const {data:series,isLoading}=useQuery({queryKey:['event-series',orgId],queryFn:()=>eventSeries(orgId)});
 const {data:occurrences}=useQuery({queryKey:['event-occurrences',orgId],queryFn:()=>eventOccurrences(orgId)});
 const [error,setError]=useState('');const [success,setSuccess]=useState('');
 const [selected,setSelected]=useState<EventOccurrence|null>(null);
 const [newSeries,setNewSeries]=useState({locationId:0,title:'',description:'',capacity:12,price:0,currency:'CZK'});
 useEffect(()=>{const n=Number((setup?.settings as Record<string,unknown>|undefined)?.eventCapacity);if(n>0)setNewSeries(p=>({...p,capacity:n}));},[setup]);
 const [newOccurrence,setNewOccurrence]=useState({seriesId:0,startsAt:'',endsAt:''});
 const [editingSeries,setEditingSeries]=useState<number|null>(null);
 const [editingCapacity,setEditingCapacity]=useState(12);
 const saveCapacity=useMutation({mutationFn:()=>{const original=series?.find(x=>x.id===editingSeries);if(!original)throw new Error('not found');return updateEventSeries(orgId,original.id,{locationId:original.location_id,title:original.title,description:original.description||'',capacity:editingCapacity,price:original.price,currency:original.currency});},onSuccess:()=>{setEditingSeries(null);setError('');refresh();},onError:e=>setError(safeErrorMessage(e))});
 const cancelOccurrence=useMutation({mutationFn:(id:number)=>cancelEventOccurrence(orgId,id),onSuccess:()=>refresh(),onError:e=>setError(safeErrorMessage(e))});
 const [showSeries,setShowSeries]=useState(false);const [showOccurrence,setShowOccurrence]=useState(false);
 const refresh=()=>{qc.invalidateQueries({queryKey:['event-series',orgId]});qc.invalidateQueries({queryKey:['event-occurrences',orgId]});};
 const createS=useMutation({mutationFn:()=>createEventSeries(orgId,{...newSeries,locationId:newSeries.locationId||locs?.items[0]?.id}),onSuccess:()=>{setShowSeries(false);setSuccess(st('Vytvořit lekci'));setError('');refresh();},onError:e=>setError(safeErrorMessage(e))});
 const createO=useMutation({mutationFn:()=>createEventOccurrence(orgId,newOccurrence.seriesId||series?.[0]?.id||0,{startsAt:new Date(newOccurrence.startsAt).toISOString(),endsAt:new Date(newOccurrence.endsAt).toISOString(),capacityOverride:null}),onSuccess:()=>{setShowOccurrence(false);setSuccess(st('Vypsat termín'));setError('');refresh();},onError:e=>setError(safeErrorMessage(e))});
 const {data:attendees}=useQuery({queryKey:['event-registrations',orgId,selected?.id],queryFn:()=>eventRegistrations(orgId,selected!.id),enabled:!!selected});
 return <><PageTitle eyebrow="BOOKANEAR" title={st('Lekce a termíny')} description={st('Skupinové události')} action={<><Button variant="secondary" onClick={()=>setShowSeries(x=>!x)}><Plus size={16}/>{st('Vytvořit lekci')}</Button><Button onClick={()=>setShowOccurrence(x=>!x)}><CalendarPlus size={16}/>{st('Vypsat termín')}</Button></>}/><Notice message={error}/><Notice message={success} kind="success"/>
 {showSeries && <Card><h3>{st('Vytvořit lekci')}</h3><form className="stack" onSubmit={(e:FormEvent)=>{e.preventDefault();createS.mutate();}}><Field label={st('Název lekce')}><Input required value={newSeries.title} onChange={e=>setNewSeries(p=>({...p,title:e.target.value}))}/></Field><Field label={st('Vyberte pobočku')}><Select value={newSeries.locationId||locs?.items[0]?.id||''} onChange={e=>setNewSeries(p=>({...p,locationId:Number(e.target.value)}))}>{locs?.items.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field><div className="form-grid"><Field label={st('Kapacita')}><Input type="number" min={1} value={newSeries.capacity||Number((setup?.settings as Record<string,unknown>)?.eventCapacity)||12} onChange={e=>setNewSeries(p=>({...p,capacity:Number(e.target.value)}))}/></Field><Field label={st('Cena')}><Input type="number" min={0} value={newSeries.price} onChange={e=>setNewSeries(p=>({...p,price:Number(e.target.value)}))}/></Field></div><Button type="submit" loading={createS.isPending}>{st('Vytvořit lekci')}</Button></form></Card>}
 {series?.length ? <Card><h3>{st('Skupinové události')}</h3>{series.map(s=><div className="event-attendee" key={s.id}><strong>{s.title}</strong>{editingSeries===s.id?<div className="setup-inline"><Input type="number" min={1} max={10000} value={editingCapacity} onChange={e=>setEditingCapacity(Number(e.target.value))}/><Button loading={saveCapacity.isPending} onClick={()=>saveCapacity.mutate()}>{st('Pokračovat')}</Button></div>:<span>{st('Kapacita')}: {s.capacity}</span>}<Button variant="ghost" onClick={()=>{setEditingSeries(s.id);setEditingCapacity(s.capacity);}}>{st('Kapacita')}</Button></div>)}</Card>:null}
 {showOccurrence && <Card><h3>{st('Vypsat termín')}</h3><form className="stack" onSubmit={(e:FormEvent)=>{e.preventDefault();if(new Date(newOccurrence.endsAt)<=new Date(newOccurrence.startsAt)){setError(st('Konec'));return;}createO.mutate();}}><Field label={st('Název lekce')}><Select value={newOccurrence.seriesId||series?.[0]?.id||''} onChange={e=>setNewOccurrence(p=>({...p,seriesId:Number(e.target.value)}))}>{series?.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</Select></Field><div className="form-grid"><Field label={st('Začátek')}><Input type="datetime-local" required value={newOccurrence.startsAt} onChange={e=>setNewOccurrence(p=>({...p,startsAt:e.target.value}))}/></Field><Field label={st('Konec')}><Input type="datetime-local" required value={newOccurrence.endsAt} onChange={e=>setNewOccurrence(p=>({...p,endsAt:e.target.value}))}/></Field></div><Button type="submit" disabled={!series?.length} loading={createO.isPending}>{st('Vypsat termín')}</Button></form></Card>}
 {isLoading?<Loading/>:<div className="setup-event-grid">{occurrences?.length?occurrences.map(e=><Card key={e.id}><div className="event-card-head"><CalendarDays size={19}/><h3>{e.title}</h3></div><p>{formatDate(e.starts_at)} · {new Date(e.starts_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p><p className="muted">{st('Obsazenost')}: <strong>{e.reserved}/{e.capacity}</strong> · {st('Volná místa')}: {e.available}</p><Button variant="secondary" onClick={()=>setSelected(e)}><Users size={16}/>{st('Přihlášení účastníci')}</Button>{e.status==='scheduled' && <Button variant="ghost" loading={cancelOccurrence.isPending} onClick={()=>{if(window.confirm(st('Zrušit rezervaci')+'?'))cancelOccurrence.mutate(e.id);}}>{st('Zrušit rezervaci')}</Button>}</Card>):<Card><p>{st('Žádné vypsané termíny')}</p></Card>}</div>}
 {selected && <Card><div className="event-card-head"><h3>{st('Přihlášení účastníci')} · {selected.title}</h3><Button variant="ghost" onClick={()=>setSelected(null)}>×</Button></div>{attendees?.length?attendees.map(r=><div className="event-attendee" key={r.id}><strong>{r.customer_name}</strong><span>{r.customer_email}</span><span>{r.seats} · {r.status}</span></div>):<p className="muted">—</p>}</Card>}
 </>;
}
