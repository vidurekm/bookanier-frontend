import { orgApi, api, json } from './api';
export type BookingModel = 'APPOINTMENT' | 'RESOURCE' | 'RENTAL' | 'EVENT';
export type SetupStatus = 'draft' | 'complete';
export interface BusinessTemplate { template_key:string; booking_model:BookingModel; label:string; steps:{id:string;when:string}[]; defaults:Record<string,unknown> }
export interface OpeningInterval { locationIndex:number; weekday:number; start:string; end:string }
export interface SetupOwner { id:number; name:string }
export interface SetupDraft {
  templateKey:string; multiLocation:boolean; locations:{name:string;address:string;timezone:string;latitude?:number|null;longitude?:number|null}[];
  members:{name:string;email:string;locationIndexes?:number[];providesServices?:boolean;canManageBookings?:boolean;canApproveOwnAbsence?:boolean}[]; services:{name:string;durationMinutes:number;price:number;currency:string}[];
  trackResources:boolean; resourceCount:number; resourceCapacity:number; resourceName:string;
  customerSelectResource:boolean;showStaffChoice:boolean;useWaitlist:boolean;eventCapacity:number;
  workingStart:string;workingEnd:string;ownerProvidesServices:boolean;ownerLocationIndex:number;openingHours:OpeningInterval[];
  defaultPublicLanguage:string;defaultCurrency:string;dateFormat:string;
}
export interface BookingConfig { organization_id:number;template_key:string|null;booking_model:BookingModel|null;setup_status:SetupStatus;settings:SetupDraft|Record<string,unknown>;locked_at?:string }
export interface PublicBookingMode { booking_model:BookingModel|null;template_key:string|null;setup_status:SetupStatus;settings:{defaultPublicLanguage?:string;defaultCurrency?:string;dateFormat?:string;showStaffChoice?:boolean;customerSelectResource?:boolean;maxAdvanceDays?:number;[key:string]:unknown};location_count:number }
export const defaultOpeningHours=(locationIndex:number):OpeningInterval[]=>Array.from({length:5},(_,i)=>({locationIndex,weekday:i+1,start:'09:00',end:'17:00'}));
export const defaultSetup:SetupDraft={templateKey:'SALON',multiLocation:false,locations:[{name:'Hlavní pobočka',address:'',timezone:'Europe/Prague'}],members:[],services:[{name:'',durationMinutes:60,price:0,currency:'CZK'}],trackResources:false,resourceCount:1,resourceCapacity:1,resourceName:'Křeslo',customerSelectResource:false,showStaffChoice:true,useWaitlist:false,eventCapacity:12,workingStart:'09:00',workingEnd:'17:00',defaultPublicLanguage:'cs',defaultCurrency:'CZK',dateFormat:'DD.MM.YYYY',ownerProvidesServices:false,ownerLocationIndex:0,openingHours:defaultOpeningHours(0)};
const decodeJson=(value:unknown):Record<string,unknown>=>{if(typeof value==='string'){try{return JSON.parse(value) as Record<string,unknown>;}catch{return {};}}return value&&typeof value==='object'?value as Record<string,unknown>:{};};
export const getSetup=async(org:number)=>{const x=await orgApi<BookingConfig>(org,'/setup');return {...x,settings:decodeJson(x.settings)};};
export const getSetupOwner=(org:number)=>orgApi<SetupOwner>(org,'/setup/owner');
export const getTemplates=async(org:number)=>{const x=await orgApi<BusinessTemplate[]>(org,'/setup/templates');return x.map((t:BusinessTemplate):BusinessTemplate=>({...t,steps:Array.isArray(t.steps)?t.steps:JSON.parse(t.steps as unknown as string) as BusinessTemplate['steps'],defaults:decodeJson(t.defaults)}));};
export const saveSetup=(org:number,data:SetupDraft)=>orgApi<BookingConfig>(org,'/setup',json('PUT',data));
export const completeSetup=(org:number,data:SetupDraft)=>orgApi<BookingConfig>(org,'/setup/complete',json('POST',data));
export const publicMode=async(uuid:string)=>{const x=await api<PublicBookingMode>(`/public/organizations/${encodeURIComponent(uuid)}/booking-mode`,{},false);return {...x,settings:decodeJson(x.settings)};};

export const publicResources=(uuid:string,location:number,service:number)=>api<{id:number;name:string;capacity:number}[]>(`/public/organizations/${encodeURIComponent(uuid)}/resources?locationId=${location}&serviceId=${service}`,{},false);

export const updateSetupOptions=(org:number,options:{customerSelectResource:boolean;showStaffChoice:boolean;eventCapacity:number;defaultPublicLanguage:string;defaultCurrency:string;dateFormat:string;maxAdvanceDays:number})=>orgApi<BookingConfig>(org,'/setup/options',json('PUT',options));
