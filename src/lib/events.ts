import { api, orgApi, json } from './api';
export interface EventSeries { id:number;organization_id:number;location_id:number;title:string;description?:string;capacity:number;price:number;currency:string;active:boolean }
export interface EventOccurrence { id:number;series_id:number;title:string;description?:string;location_id:number;location_name?:string;starts_at:string;ends_at:string;capacity:number;reserved:number;available:number;price?:number;currency?:string;status?:string }
export interface EventRegistration { id:number;customer_name:string;customer_email:string;customer_phone?:string;seats:number;status:string;created_at:string }
export interface PublicRegistration {id:number;seats:number;status:string;manageUrl:string}
export const eventSeries=(org:number)=>orgApi<EventSeries[]>(org,'/event-series');
export const createEventSeries=(org:number,data:unknown)=>orgApi<EventSeries>(org,'/event-series',json('POST',data));
export const updateEventSeries=(org:number,id:number,data:unknown)=>orgApi<EventSeries>(org,`/event-series/${id}`,json('PUT',data));
export const eventOccurrences=(org:number)=>orgApi<EventOccurrence[]>(org,'/events');
export const createEventOccurrence=(org:number,series:number,data:unknown)=>orgApi<EventOccurrence>(org,`/event-series/${series}/occurrences`,json('POST',data));
export const eventRegistrations=(org:number,id:number)=>orgApi<EventRegistration[]>(org,`/events/${id}/registrations`);
export const cancelEventOccurrence=(org:number,id:number)=>orgApi(org,`/events/${id}/cancel`,{method:'POST'});
export const publicEvents=(uuid:string)=>api<EventOccurrence[]>(`/public/organizations/${encodeURIComponent(uuid)}/events`,{},false);
export const bookEvent=(uuid:string,id:number,data:unknown)=>api<PublicRegistration>(`/public/organizations/${encodeURIComponent(uuid)}/events/${id}/registrations`,json('POST',data),false);
export const manageEvent=(token:string)=>api<{id:number;customer_name:string;seats:number;status:string;starts_at:string;title:string}>(`/public/events/manage/${encodeURIComponent(token)}`,{},false);
export const cancelEventBooking=(token:string)=>api<{id:number;status:string}>(`/public/events/manage/${encodeURIComponent(token)}/cancel`,{method:'POST'},false);
