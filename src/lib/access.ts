import { orgApi } from './api';
export interface OrganizationAccess {
  ownMemberId:number|null;
  canWrite:boolean;
  isOwner:boolean;
  canManageBookings:boolean;
  canApproveOwnAbsence:boolean;
}
export const myAccess=(org:number)=>orgApi<OrganizationAccess>(org,'/access');
