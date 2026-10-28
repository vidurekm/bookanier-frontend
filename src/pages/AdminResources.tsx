import { resourceTypeLabel } from '../lib/resourceTypeLabels';
import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Layers3, Pencil, Trash2, Wrench } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { json, locations, orgApi, resourceTypes, resources } from '../lib/api';
import type { Resource, ResourceType } from '../lib/types';
import { AddButton, Badge, Card, Empty, ErrorState, Field, Input, Loading, Modal, PageTitle, Select, SortableHeader, SubmitRow } from '../components/UI';
import { MediaGallery } from '../components/MediaGallery';
import { singleActiveLocationId } from '../lib/locationSelection';
import { useConfirm } from '../contexts/ConfirmContext';
import { getSetup } from '../lib/setup';
import { useFormDraft } from '../lib/useFormDraft';
import { useToast } from '../contexts/ToastContext';
const categories: Record<string, string> = { space: 'Space / table', equipment: 'Equipment', other: 'Other' };
function sortRows<T>(rows: T[], field: string, direction: 'asc' | 'desc', value: (row: T, field: string) => string | number | boolean) {
    return [...rows].sort((a, b) => {
        const left = value(a, field);
        const right = value(b, field);
        const comparison = typeof left === 'number' && typeof right === 'number'
            ? left - right
            : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
        return direction === 'asc' ? comparison : -comparison;
    });
}
export function AdminResources() {
    const confirm = useConfirm();
    const notify=useToast();
    const { orgId } = useAdmin();
    const qc = useQueryClient();
    const [tab, setTab] = useState<'resources' | 'types'>('resources');
    const [loc, setLoc] = useState(0);
    const [resourceSort, setResourceSort] = useState({ field: 'name', direction: 'asc' as 'asc' | 'desc' });
    const [typeSort, setTypeSort] = useState({ field: 'name', direction: 'asc' as 'asc' | 'desc' });
    const [edit, setEdit] = useState<Resource | null | undefined>(undefined);
    const [editType, setEditType] = useState<ResourceType | null | undefined>(undefined);
    const [editTab, setEditTab] = useState<'details' | 'photos'>('details');
    const locs = useQuery({ queryKey: ['locations', orgId], queryFn: () => locations(orgId) });
    const activeLocations = locs.data?.items.filter(location => location.active) || [];
    const selectedLocation = loc || singleActiveLocationId(activeLocations) || 0;
    const setup = useQuery({ queryKey: ['setup', orgId], queryFn: () => getSetup(orgId) });
    const types = useQuery({ queryKey: ['resource-types', orgId], queryFn: () => resourceTypes(orgId) });
    const all = useQuery({ queryKey: ['resources', orgId, selectedLocation], queryFn: () => resources(orgId, selectedLocation), enabled: selectedLocation > 0 });
    const visibleTypes = types.data?.filter(type => type.category !== 'staff') ?? [];
    const visibleResources = all.data?.filter(resource => resource.category !== 'staff') ?? [];
    const sortedResources = sortRows(visibleResources, resourceSort.field, resourceSort.direction, (resource, field) =>
        field === 'type' ? resourceTypeLabel({ code: resource.resource_type, name: resource.resource_type_name })
            : field === 'capacity' ? resource.capacity
            : field === 'status' ? resource.resource_state
            : resource.name);
    const sortedTypes = sortRows(visibleTypes, typeSort.field, typeSort.direction, (type, field) =>
        field === 'category' ? tr(categories[type.category] || type.category)
            : field === 'active' ? type.active
            : resourceTypeLabel(type));
    const changeResourceSort = (field: string) => setResourceSort(current => ({
        field,
        direction: field === current.field ? current.direction === 'asc' ? 'desc' : 'asc' : 'asc',
    }));
    const changeTypeSort = (field: string) => setTypeSort(current => ({
        field,
        direction: field === current.field ? current.direction === 'asc' ? 'desc' : 'asc' : 'asc',
    }));
    const appointment = setup.data?.booking_model === 'APPOINTMENT';
    const typeCategories = Object.entries(categories).filter(([category]) =>
        !appointment || category === 'equipment' || (editType?.category === category));
    const [form, setForm, dirty, resetForm] = useFormDraft({ name: '', locationId: 0, resourceTypeId: 0, capacity: 1, inventoryCode: '', active: true, resourceState: 'available' });
    const [typeForm, setTypeForm, typeDirty, resetTypeForm] = useFormDraft({ name: '', category: 'equipment', active: true });
    const open = (r: Resource | null) => { setEditTab('details'); setEdit(r); resetForm({ name: r?.name || '', locationId: r?.location_id || selectedLocation, resourceTypeId: r?.resource_type_id || visibleTypes[0]?.id || 0, capacity: r?.capacity || 1, inventoryCode: r?.inventory_code || '', active: r?.active ?? true, resourceState: r?.resource_state || 'available' }); };
    const openType = (t: ResourceType | null) => { setEditTab('details'); setEditType(t); resetTypeForm({ name: t?.name || '', category: t?.category || 'equipment', active: t?.active ?? true }); };
    const save = useMutation({ mutationFn: () => orgApi(orgId, edit ? `/locations/${edit.location_id}/resources/${edit.id}` : '/resources', json(edit ? 'PUT' : 'POST', edit ? { name: form.name, capacity: form.capacity, active: form.active, resourceState: form.resourceState } : { name: form.name, locationId: form.locationId, resourceTypeId: form.resourceTypeId, capacity: form.capacity, memberId: null, inventoryCode: form.inventoryCode || null })), onSuccess: () => { notify(tr(edit ? 'Resource updated successfully.' : 'Resource created successfully.')); setEdit(undefined); qc.invalidateQueries({ queryKey: ['resources', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const remove = useMutation({ mutationFn: ({ locationId, id }: { locationId: number; id: number }) => orgApi(orgId, `/locations/${locationId}/resources/${id}`, { method: 'DELETE' }), onSuccess: () => { notify(tr('Resource deleted successfully.')); qc.invalidateQueries({ queryKey: ['resources', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const removeType = useMutation({ mutationFn: (id: number) => orgApi(orgId, `/resource-types/${id}`, { method: 'DELETE' }), onSuccess: () => { notify(tr('Resource type deleted successfully.')); qc.invalidateQueries({ queryKey: ['resource-types', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    const saveType = useMutation({ mutationFn: () => orgApi(orgId, editType ? `/resource-types/${editType.id}` : '/resource-types', json(editType ? 'PUT' : 'POST', editType ? typeForm : { name: typeForm.name, category: typeForm.category })), onSuccess: () => { notify(tr(editType ? 'Resource type updated successfully.' : 'Resource type created successfully.')); setEditType(undefined); qc.invalidateQueries({ queryKey: ['resource-types', orgId] }); }, onError: e => notify(safeErrorMessage(e),'error') });
    return <>
        <PageTitle eyebrow={tr("CAPACITY & EQUIPMENT")} title={tr("Resources")} description={tr("Manage rooms, tables, and equipment.")}
            action={<AddButton label={tab === 'types' ? tr('New resource type') : tr('New resource')}
                onClick={() => tab === 'types' ? openType(null) : open(null)}/>}/>
        <div className="tabs page-tabs">
            <button className={tab === 'resources' ? 'active' : ''} onClick={() => setTab('resources')}><Wrench size={17}/>{tr("Resources")}</button>
            <button className={tab === 'types' ? 'active' : ''} onClick={() => setTab('types')}><Layers3 size={17}/>{tr("Resource types")}</button>
        </div>
        {tab === 'resources' ? <Card>
            <div className="table-toolbar">
                <Field label={tr("Location")}><Select value={selectedLocation} onChange={e => setLoc(Number(e.target.value))}>
                    <option value="0">{tr("Choose location")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select></Field>

            </div>
            {selectedLocation === 0 ? <Empty title={tr("Choose location")} description={tr("Its bookable resources will be shown.")}/>
                : all.isLoading ? <Loading/> : all.error ? <ErrorState error={all.error}/>
                : !visibleResources.length ? <Empty title={tr("No resources yet")} description={tr("Add your first table or equipment.")} action={<AddButton onClick={() => open(null)}/>}
                /> : <div className="table-scroll"><table className="data-table">
                    <thead><tr><SortableHeader label={tr("Resource")} active={resourceSort.field === 'name'} direction={resourceSort.direction} onClick={() => changeResourceSort('name')}/><SortableHeader label={tr("Type")} active={resourceSort.field === 'type'} direction={resourceSort.direction} onClick={() => changeResourceSort('type')}/><SortableHeader label={tr("Capacity")} active={resourceSort.field === 'capacity'} direction={resourceSort.direction} onClick={() => changeResourceSort('capacity')}/><SortableHeader label={tr("Status")} active={resourceSort.field === 'status'} direction={resourceSort.direction} onClick={() => changeResourceSort('status')}/><th/></tr></thead>
                    <tbody>{sortedResources.map(r => <tr key={r.id}>
                        <td><div className="cell-name"><span className="cell-icon"><Wrench size={18}/></span><strong>{r.name}</strong></div></td>
                        <td>{resourceTypeLabel({code:r.resource_type,name:r.resource_type_name})}</td><td>{r.capacity}</td>
                        <td><Badge tone={r.active && r.resource_state === 'available' ? 'green' : 'orange'}>
                            {r.resource_state === 'available' ? tr('Available') : r.resource_state === 'maintenance' ? tr('Maintenance') : tr('Retired')}
                        </Badge></td>
                        <td><div className="table-actions">
                            <button className="icon-button" title={tr("Edit")} onClick={() => open(r)}><Pencil size={17}/></button>
                            <button className="icon-button" title={tr("Delete resource")} aria-label={tr("Delete resource")} disabled={remove.isPending}
                                onClick={async()=>{if(await confirm(tr("Delete this resource? Resources used in reservations cannot be deleted.")))remove.mutate({locationId:r.location_id,id:r.id});}}><Trash2 size={17}/></button>
                        </div></td>
                    </tr>)}</tbody>
                </table></div>}
        </Card> : <Card>
            {types.isLoading ? <Loading/> : types.error ? <ErrorState error={types.error}/>
                : !visibleTypes.length ? <Empty title={tr("No resource types yet")} action={<AddButton onClick={() => openType(null)}/>}
                /> : <div className="table-scroll"><table className="data-table">
                    <thead><tr><SortableHeader label={tr("Type")} active={typeSort.field === 'name'} direction={typeSort.direction} onClick={() => changeTypeSort('name')}/><SortableHeader label={tr("Category")} active={typeSort.field === 'category'} direction={typeSort.direction} onClick={() => changeTypeSort('category')}/><SortableHeader label={tr("Status")} active={typeSort.field === 'active'} direction={typeSort.direction} onClick={() => changeTypeSort('active')}/><th/></tr></thead>
                    <tbody>{sortedTypes.map(t => <tr key={t.id}>
                        <td><div className="cell-name"><span className="cell-icon"><Layers3 size={18}/></span><strong>{resourceTypeLabel(t)}</strong></div></td>
                        <td>{tr(categories[t.category] || t.category)}</td>
                        <td><Badge tone={t.active ? 'green' : 'neutral'}>{t.active ? tr('Active') : tr('Inactive')}</Badge></td>
                        <td><div className="table-actions">
                            <button className="icon-button" title={tr("Edit")} onClick={() => openType(t)}><Pencil size={17}/></button>
                            <button className="icon-button" title={tr("Delete resource type")} aria-label={tr("Delete resource type")} disabled={removeType.isPending}
                                onClick={async()=>{if(await confirm(tr("Delete this resource type?")))removeType.mutate(t.id);}}><Trash2 size={17}/></button>
                        </div></td>
                    </tr>)}</tbody>
                </table></div>}
        </Card>}
        {edit !== undefined && <Modal title={edit ? tr('Edit resource') : tr('New resource')} onClose={() => setEdit(undefined)} wide>
            {edit && <div className="tabs">
                <button className={editTab === 'details' ? 'active' : ''} onClick={() => setEditTab('details')}>{tr('Details')}</button>
                <button className={editTab === 'photos' ? 'active' : ''} onClick={() => setEditTab('photos')}><Camera size={16}/>{tr('Photos')}</button>
            </div>}
            <div style={{display:editTab==='details'||!edit?undefined:'none'}}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}>
                <Field label={tr("Name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field>
                {!edit && <>
                    <Field label={tr("Location")}><Select required value={form.locationId || ''} onChange={e => setForm(p => ({ ...p, locationId: Number(e.target.value) }))}>
                        <option value="">{tr("Choose location")}</option>{locs.data?.items.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select></Field>
                    <Field label={tr("Resource type")}><Select required value={form.resourceTypeId || ''} onChange={e => setForm(p => ({ ...p, resourceTypeId: Number(e.target.value), capacity: 1 }))}>
                        <option value="">{tr("Select type")}</option>{visibleTypes.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{resourceTypeLabel(t)} ({tr(categories[t.category])})</option>)}
                    </Select></Field>
                </>}
                <Field label={tr("Capacity (people per resource)")}><Input type="number" min="1" required value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))}/></Field>
                {!edit && <Field label={tr("Inventory code (optional)")}><Input value={form.inventoryCode} onChange={e => setForm(p => ({ ...p, inventoryCode: e.target.value }))}/></Field>}
                {edit && <>
                    <Field label={tr("Status")}><Select value={form.resourceState} onChange={e => setForm(p => ({ ...p, resourceState: e.target.value }))}>
                        <option value="available">{tr("Available")}</option><option value="maintenance">{tr("Maintenance")}</option><option value="retired">{tr("Retired")}</option>
                    </Select></Field>
                    <Field label={tr("Activity")}><Select value={String(form.active)} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'true' }))}>
                        <option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option>
                    </Select></Field>
                </>}
                <SubmitRow busy={save.isPending} dirty={dirty}/>
            </form></div>
            {edit && <div style={{display:editTab==='photos'?undefined:'none'}}><MediaGallery org={orgId} kind="resource" target={edit.id} onSaved={() => setEdit(undefined)}/></div>}
        </Modal>}
        {editType !== undefined && <Modal title={editType ? tr('Edit resource type') : tr('New resource type')} onClose={() => setEditType(undefined)} wide>
            {editType && <div className="tabs">
                <button className={editTab === 'details' ? 'active' : ''} onClick={() => setEditTab('details')}>{tr('Details')}</button>
                <button className={editTab === 'photos' ? 'active' : ''} onClick={() => setEditTab('photos')}><Camera size={16}/>{tr('Photos')}</button>
            </div>}
            <div style={{display:editTab==='details'||!editType?undefined:'none'}}><form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (typeDirty && !saveType.isPending) saveType.mutate(); }}>
                <Field label={tr("Type name")}><Input required value={typeForm.name} onChange={e => setTypeForm(p => ({ ...p, name: e.target.value }))}/></Field>
                <Field label={tr("Category")}><Select value={typeForm.category} onChange={e => setTypeForm(p => ({ ...p, category: e.target.value }))}>
                    {typeCategories.map(([k, v]) => <option value={k} key={k}>{tr(v)}</option>)}
                </Select></Field>
                {editType && <Field label={tr("Status")}><Select value={String(typeForm.active)} onChange={e => setTypeForm(p => ({ ...p, active: e.target.value === 'true' }))}>
                    <option value="true">{tr("Active")}</option><option value="false">{tr("Inactive")}</option>
                </Select></Field>}
                <SubmitRow busy={saveType.isPending} dirty={typeDirty}/>
            </form></div>
            {editType && <div style={{display:editTab==='photos'?undefined:'none'}}><MediaGallery org={orgId} kind="resource-type" target={editType.id} onSaved={() => setEditType(undefined)}/></div>}
        </Modal>}
    </>;
}
