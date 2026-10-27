import type { Page, Organization, Location, Service, Member, Customer, Reservation, Resource, ResourceType, PublicCatalog, PublicSlots, BookingResult, Version, ImageInfo, Dict } from './types';

import { ApiError, knownErrorCode, statusErrorCode } from './errors';
import { reportFrontendError } from './frontendLogger';
export { ApiError } from './errors';

const ROOT = '/api/v1';
const AUTH_KEY = 'bookanear_access_token';
export const getToken = () => sessionStorage.getItem(AUTH_KEY);
export const setToken = (token: string) => sessionStorage.setItem(AUTH_KEY, token);
export const clearToken = () => sessionStorage.removeItem(AUTH_KEY);

export function queryString(params: Record<string, string|number|boolean|undefined|null> = {}) {
  const p = new URLSearchParams();
  for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  return p.toString() ? '?' + p.toString() : '';
}
export async function api<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (authenticated && getToken()) headers.set('Authorization', `Bearer ${getToken()}`);
  let response: Response;
  try { response = await fetch(ROOT + path, { ...options, headers, credentials: 'omit' }); }
  catch {
    reportFrontendError({type: 'api-network', message: `${options.method || 'GET'} ${path.split('?')[0]} -> NETWORK_ERROR`, status: 0});
    throw new ApiError(0, 'NETWORK_ERROR');
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const obj = data && typeof data === 'object' ? data as Record<string,unknown> : {};
    // Only accept explicitly allowlisted machine codes; NEVER display API messages.
    const code = knownErrorCode(obj.code) ||
      (path === '/auth/login' && response.status === 401 ? 'INVALID_CREDENTIALS' :
       path === '/auth/login' && response.status === 403 ? 'EMAIL_NOT_VERIFIED' :
       statusErrorCode(response.status));
    const requestId = response.headers.get('X-Request-ID') || undefined;
    reportFrontendError({type: 'api-request', message: `${options.method || 'GET'} ${path.split('?')[0]} -> ${code}`,
      status: response.status, requestId});
    if (response.status === 401 && authenticated) window.dispatchEvent(new Event('bookanear:unauthorized'));
    throw new ApiError(response.status, code, requestId);
  }
  return data as T;
}
export const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
export const orgPath = (org: number) => `/backoffice/organizations/${org}`;
export const orgApi = <T,>(org: number, path: string, options?: RequestInit) => api<T>(orgPath(org) + path, options);
export const list = <T,>(org: number, path: string, params?: Record<string,string|number|boolean|undefined|null>) => orgApi<Page<T>>(org, path + queryString({page:0,size:100,...params}));
export const organizations = (params?: Record<string,string|number|undefined>) => api<Page<Organization>>('/backoffice/organizations' + queryString({size:100,...params}));
export const locations = (org:number) => list<Location>(org,'/locations');
export const services = (org:number) => list<Service>(org,'/services');
export const members = (org:number) => list<Member>(org,'/members');
export const customers = (org:number,params?:Record<string,string|number|undefined>) => list<Customer>(org,'/customers',params);
export const reservations = (org:number,params?:Record<string,string|number|boolean|undefined>) => list<Reservation>(org,'/reservations',params);
export const resourceTypes = (org:number) => orgApi<ResourceType[]>(org,'/resource-types');
export const resources = (org:number,loc:number) => orgApi<Resource[]>(org,`/locations/${loc}/resources`);
export const versions = (org:number,id:number) => orgApi<Version[]>(org,`/services/${id}/versions`);
export const publicCatalog = (uuid:string,date:string) => api<PublicCatalog>(`/public/organizations/${encodeURIComponent(uuid)}/catalog${queryString({date})}`,{},false);
export const publicSlots = (uuid:string,loc:number,svc:number,date:string,partySize?:number,quantity?:number) => api<PublicSlots>(`/public/organizations/${encodeURIComponent(uuid)}/slots${queryString({locationId:loc,serviceId:svc,date,partySize,quantity})}`,{},false);
export const createUniversal = (body:Dict) => api<BookingResult>('/bookings/universal',json('POST',body),false);
export const createLegacy = (body:Dict) => api<BookingResult>('/bookings',json('POST',body),false);
export const publicReservation = (token:string) => api<{id:number;status:string;customerName:string;totalAmount:number;currency:string}>(`/public/reservations/${encodeURIComponent(token)}`,{},false);
export const cancelReservation = (token:string) => api<{id:number;status:string}>(`/public/reservations/${encodeURIComponent(token)}/cancel`,{method:'POST'},false);
export const mediaImages = (org:number,kind:string,target:number) => orgApi<ImageInfo[]>(org,`/images/${kind}/${target}`);
export const publicImages = (org:number,kind:string,target:number) => api<ImageInfo[]>(`/public/organizations/${org}/images/${kind}/${target}`,{},false);
export const absoluteMedia = (url:string) => url.startsWith('/') ? url : (url.startsWith('http') ? url : `/api/v1/public/media/${url}`);
export const publicUuidFromManageUrl = (url:string) => { try { return new URL(url).pathname.split('/').filter(Boolean).at(-1) || ''; } catch { return url.split('/').at(-1)||''; } };
