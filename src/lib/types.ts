export type Id = number;
export type Dict = Record<string, unknown>;
export interface Page<T> { items: T[]; page: number; size: number; totalElements: number; totalPages: number }
export interface Organization { id: number; public_id?: string; name: string; email?: string; phone?: string; default_timezone?: string; booking_enabled?: boolean; registration_status?: string; setup_status?: 'draft'|'complete'; my_role?: 'owner'|'admin'|'worker' }
export interface Location { id: number; name: string; address?: string; timezone: string; active: boolean; latitude?: number | null; longitude?: number | null }
export interface Service { id: number; name: string; description?: string; active: boolean }
export interface Member { id: number; user_id?: number; email?: string; display_name: string; role: 'owner'|'admin'|'worker'; active: boolean; can_manage_bookings?: boolean; can_approve_own_absence?: boolean }
export interface Customer { id: number; name: string; email?: string; phone?: string; notes?: string }
export interface Reservation { id: number; customer_name: string; status: string; total_amount: number; currency: string; created_at: string; location_id?: number }
export interface ResourceType { id: number; code: string; name: string; category: 'staff'|'space'|'equipment'|'other'; active: boolean }
export interface Resource { id: number; name: string; resource_type_id: number; resource_type: string; resource_type_name: string; category: string; location_id: number; capacity: number; member_id?: number; inventory_code?: string; resource_state: 'available'|'maintenance'|'retired'; active: boolean }
export interface Version { id: number; valid_from: string; valid_to?: string; duration_minutes: number; slot_interval_minutes: number; buffer_before_minutes: number; buffer_after_minutes: number; price: number; currency: string; duration_mode: 'FIXED'|'CUSTOM'; max_duration_minutes?: number }
export interface ImageInfo { id: number; url: string; contentType: string; width: number; height: number; sortOrder: number; primary: boolean }
export interface PublicLocation { id: number; name: string; address?: string; timezone: string; latitude?: number | null; longitude?: number | null }
export interface PublicRequirement { service_id: number; resource_type_id: number; quantity: number; min_capacity?: number; category: string; type_code: string; type_name: string }
export interface PublicService { id: number; name: string; description?: string; duration_minutes: number; slot_interval_minutes: number; price: number; currency: string; duration_mode: 'FIXED'|'CUSTOM'; max_duration_minutes?: number; locationIds: number[]; requirements: PublicRequirement[] }
export interface PublicMember { id: number; display_name: string; location_id: number; service_id: number }
export interface PublicCatalog { id: number; publicId: string; name: string; bookingEnabled: boolean; locations: PublicLocation[]; services: PublicService[]; members: PublicMember[] }
export interface PublicSlot { time: string; startsAt: string; memberIds: number[] }
export interface PublicSlots { date: string; locationId: number; serviceId: number; durationMode: string; slots: PublicSlot[]; note: string }
export interface BookingResult { id: number; status: string; startsAt: string; endsAt: string; price: number; currency: string; manageUrl: string }
