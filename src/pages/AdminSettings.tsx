import { safeErrorMessage } from '../lib/errors';
import { AppearanceSelect, LanguageSelect, ThemeSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { timeZoneLabel, timeZoneOptions } from '../lib/utils';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, UserRound } from 'lucide-react';
import { useAdmin } from '../lib/useAdmin';
import { json, orgApi } from '../lib/api';
import { Button, Card, Field, Input, Modal, PageTitle, Select } from '../components/UI';
import { useQuery } from '@tanstack/react-query';
import { getSetup, updateSetupOptions } from '../lib/setup';
import { businessTypeLabel, st } from '../lib/setupTranslations';
import { bookingCurrencies, bookingLanguages } from '../lib/bookingOptions';
import { dateFormats, setActiveDateFormat } from '../lib/dateFormat';
import { MediaGallery } from '../components/MediaGallery';
import { AccountSettingsPanel } from './AccountPage';
import { myAccess } from '../lib/access';
import { useSearchParams } from 'react-router-dom';
import { useFormDraft } from '../lib/useFormDraft';
import { useToast } from '../contexts/ToastContext';
export function AdminSettings() {
    const { orgId, org } = useAdmin();
    const notify=useToast();
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') === 'user' ? 'user' : 'organization';
    const {data:access}=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId),enabled:orgId>0,retry:false});
    const {data:setup}=useQuery({queryKey:['setup',orgId],queryFn:()=>getSetup(orgId)});
    const [form, setForm, dirty, resetForm] = useFormDraft({ name: '', email: '', phone: '', defaultTimezone: 'Europe/Prague', bookingEnabled: true });
    const [deleteOrganizationOpen, setDeleteOrganizationOpen] = useState(false);
    const [deleteOrganizationName, setDeleteOrganizationName] = useState('');
    useEffect(() => {
        if (access && !access.canWrite && tab !== 'user') setSearchParams({tab:'user'}, {replace:true});
    }, [access, setSearchParams, tab]);
    useEffect(() => { if (org)
        resetForm({ name: org.name, email: org.email || '', phone: org.phone || '', defaultTimezone: org.default_timezone || 'Europe/Prague', bookingEnabled: org.booking_enabled ?? true }); }, [org]);
    const save = useMutation({ mutationFn: () => orgApi(orgId, '', json('PUT', form)), onSuccess: () => { notify(tr("Organization settings saved.")); return Promise.all([qc.invalidateQueries({ queryKey: ['organization', orgId] }), qc.invalidateQueries({ queryKey: ['organizations'] })]); }, onError: e => notify(safeErrorMessage(e), 'error') });
    const deleteOrganization = useMutation({
        mutationFn: () => orgApi<void>(orgId, '', { method: 'DELETE' }),
        onSuccess: () => {
            notify(tr('Organization deleted successfully.'));
            sessionStorage.removeItem('bookanear_org_id');
            window.setTimeout(() => window.location.reload(), 6000);
        },
        onError: e => notify(safeErrorMessage(e),'error')
    });
    const [opts,setOpts]=useState({customerSelectResource:false,showStaffChoice:true,eventCapacity:12,defaultPublicLanguage:'cs',defaultCurrency:'CZK',dateFormat:'DD.MM.YYYY',maxAdvanceDays:180,trackResources:false,weekStartsOn:1});
    const [savedOpts,setSavedOpts]=useState(opts);
    useEffect(()=>{if(setup?.settings){const x=setup.settings as Record<string,unknown>;const weekStartsOn=Number(x.weekStartsOn);const next={customerSelectResource:x.customerSelectResource===true,showStaffChoice:x.showStaffChoice!==false,eventCapacity:Number(x.eventCapacity||12),defaultPublicLanguage:String(x.defaultPublicLanguage||'cs'),defaultCurrency:String(x.defaultCurrency||'CZK'),dateFormat:String(x.dateFormat||'DD.MM.YYYY'),maxAdvanceDays:Number(x.maxAdvanceDays||180),trackResources:x.trackResources===true||setup.booking_model==='RESOURCE'||setup.booking_model==='RENTAL',weekStartsOn:Number.isInteger(weekStartsOn)&&weekStartsOn>=1&&weekStartsOn<=7?weekStartsOn:1};setOpts(next);setSavedOpts(next);}},[setup]);
    const calendarSettingsDirty=!!setup&&opts.weekStartsOn!==savedOpts.weekStartsOn;
    const resourceSettingsDirty=!!setup&&opts.trackResources!==savedOpts.trackResources;
    const customerSettingsDirty=!!setup&&(['defaultPublicLanguage','defaultCurrency','dateFormat','maxAdvanceDays','eventCapacity'] as const).some(key=>opts[key]!==savedOpts[key]);
    const saveOpts=useMutation({
        mutationFn:(_section:'resources'|'customers'|'calendar')=>updateSetupOptions(orgId,opts),
        onSuccess:(_data,section)=>{
            setActiveDateFormat(opts.dateFormat);
            if(section==='resources')notify(st('Equipment and capacity settings saved.'));
            else if(section==='calendar')notify(tr('Calendar settings saved.'));
            else notify(tr('Customer booking settings saved.'));
            return qc.invalidateQueries({queryKey:['setup',orgId]});
        },
        onError:e=>notify(safeErrorMessage(e),'error')
    });
    return <>
        <PageTitle eyebrow={tab === 'user' ? tr('PERSONAL ACCOUNT') : tr("ORGANIZATION")} title={tr("Settings")} description={tab === 'user' ? tr('Manage your name, email address, and password.') : tr("Manage your organization details, customers, and public booking images.")}/>
        <div className="tabs page-tabs">
            {access?.canWrite !== false && <>
                <button className={tab === 'organization' ? 'active' : ''} onClick={() => setSearchParams({tab:'organization'})}><Settings2 size={17}/>{tr("Organization")}</button>
            </>}
            <button className={tab === 'user' ? 'active' : ''} onClick={() => setSearchParams({tab:'user'})}><UserRound size={17}/>{tr("User")}</button>
        </div>
        {tab === 'user' ? <div className="stack">
            <Card><h3>{tr("Appearance & language")}</h3><p className="muted small">{tr("Choose your interface language and admin color theme. Preferences are saved in this browser.")}</p><div className="settings-preferences"><LanguageSelect/><ThemeSelect/><AppearanceSelect/></div></Card>
            <AccountSettingsPanel/>
        </div> : <div className="settings-grid">
                <div className="stack">
                <Card>
                    <div className="card-heading"><div><span className="eyebrow">{tr("Calendar")}</span><h2>{tr("Start of working week")}</h2></div></div>
                    <div className="stack">
                        <Field label={tr("Start of working week")}>
                            <Select value={opts.weekStartsOn} onChange={event=>setOpts(p=>({...p,weekStartsOn:Number(event.target.value)}))}>
                                {[['Monday',1],['Tuesday',2],['Wednesday',3],['Thursday',4],['Friday',5],['Saturday',6],['Sunday',7]].map(([label,value])=><option key={value} value={value}>{tr(String(label))}</option>)}
                            </Select>
                        </Field>
                        <div className="settings-button-row"><Button loading={saveOpts.isPending} disabled={!calendarSettingsDirty} onClick={()=>saveOpts.mutate('calendar')}>{tr('Save settings')}</Button></div>
                    </div>
                </Card>
                <Card>
                    <div className="card-heading"><div><h2>{tr("Organization details")}</h2><p>{tr("This information is used to manage your business.")}</p></div></div>
                    <form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); if (dirty && !save.isPending) save.mutate(); }}>
                        <Field label={st('Booking type')} hint={st('The booking type cannot be changed after setup.')}>
                            <Input value={businessTypeLabel(setup?.template_key)} readOnly/>
                        </Field>
                        <Field label={tr("Organization name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field>
                        <div className="form-grid">
                            <Field label={tr("Contact email")}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/></Field>
                            <Field label={tr("Phone")}><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}/></Field>
                        </div>
                        <Field label={tr("Default time zone")}><Select required value={form.defaultTimezone} onChange={e => setForm(p => ({ ...p, defaultTimezone: e.target.value }))}>{timeZoneOptions(form.defaultTimezone).map(zone => <option key={zone} value={zone}>{timeZoneLabel(zone)}</option>)}</Select></Field>
                        <Field label={tr("Public bookings")}><Select value={String(form.bookingEnabled)} onChange={e => setForm(p => ({ ...p, bookingEnabled: e.target.value === 'true' }))}><option value="true">{tr("Enabled")}</option><option value="false">{tr("Paused")}</option></Select></Field>
                        <div className="form-actions"><Button type="submit" loading={save.isPending} disabled={!dirty}>{tr("Save settings")}</Button></div>
                    </form>
                    <div className="organization-media stack">
                        <MediaGallery org={orgId} kind="organization-logo" target={orgId} single/>
                        <MediaGallery org={orgId} kind="organization" target={orgId}/>
                    </div>
                </Card>
                        {access?.isOwner && <Card className="danger-zone">
                            <div><h3>{tr('Delete organization')}</h3><p className="muted small">{tr('Permanently delete this organization and all its data. This cannot be undone.')}</p></div>
                            <div className="settings-button-row"><Button type="button" variant="danger" onClick={() => { setDeleteOrganizationName(''); setDeleteOrganizationOpen(true); }}>{tr('Delete organization')}</Button></div>
                        </Card>}
                </div>
                <div className="stack">
                    <Card>
                        <div className="card-heading"><div><span className="eyebrow">{tr("BOOKING CAPACITY")}</span><h2>{st("Equipment and capacity")}</h2></div></div>
                        <div className="stack">
                            <label className="setup-check"><input type="checkbox" checked={opts.trackResources} disabled={!setup||setup.booking_model==='RESOURCE'||setup.booking_model==='RENTAL'} onChange={e=>setOpts(p=>({...p,trackResources:e.target.checked}))}/>{st('Track individual resources')}</label>
                            <p className="muted small">{st('Enable this when equipment, rooms, or other resources limit how many bookings can happen at once. You can manage individual resources on the Resources page.')}</p>
                            <div className="settings-button-row"><Button loading={saveOpts.isPending} disabled={!resourceSettingsDirty} onClick={()=>saveOpts.mutate('resources')}>{tr('Save settings')}</Button></div>
                        </div>
                        </Card>
                        <Card>
                            <div className="card-heading"><div><span className="eyebrow">{tr("FOR CUSTOMERS")}</span><h2>{tr("Customers")}</h2></div></div>
                            <div className="stack">
                        <p className="muted small">{tr("Customer choices of staff and resources are configured separately for each service.")}</p>
                        <Field label={tr("Default public page language")}><Select value={opts.defaultPublicLanguage} onChange={e=>setOpts(p=>({...p,defaultPublicLanguage:e.target.value}))}>{bookingLanguages.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</Select></Field>
                        <Field label={tr("Default currency for new services")}><Select value={opts.defaultCurrency} onChange={e=>setOpts(p=>({...p,defaultCurrency:e.target.value}))}>{bookingCurrencies.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</Select></Field>
                        <Field label={tr('Date format')}><Select value={opts.dateFormat} onChange={e=>setOpts(p=>({...p,dateFormat:e.target.value}))}>{dateFormats.map(x=><option key={x.value} value={x.value}>{x.label} ({x.value})</option>)}</Select></Field>
                        <Field label={tr('Maximum number of days in advance for bookings')}><Input type="number" min={1} max={3650} required value={opts.maxAdvanceDays} onChange={e=>setOpts(p=>({...p,maxAdvanceDays:Number(e.target.value)}))}/></Field>
                        <p className="muted small">{tr('Customers can book up to this many days ahead.')}</p><p className="muted small">{tr("Changing currency will not convert existing prices. Add a new price version for an existing service.")}</p>
                        {setup?.booking_model==='EVENT'&&<Field label={st('Default class capacity')}><Input type="number" min={1} max={10000} value={opts.eventCapacity} onChange={e=>setOpts(p=>({...p,eventCapacity:Number(e.target.value)}))}/></Field>}
                        <div className="settings-button-row"><Button loading={saveOpts.isPending} disabled={!customerSettingsDirty} onClick={()=>saveOpts.mutate('customers')}>{tr('Save settings')}</Button></div>
                        </div>
                    </Card>
                </div>
            </div>}
        {deleteOrganizationOpen && org && <Modal title={tr('Delete organization')} onClose={() => setDeleteOrganizationOpen(false)}>
            <form className="stack" onSubmit={event => { event.preventDefault(); if (deleteOrganizationName === org.name) deleteOrganization.mutate(); }}>
                <p>{tr('Permanently delete this organization and all its data. This cannot be undone.')}</p>
                <Field label={tr('Type the organization name to confirm')}><Input required autoComplete="off" value={deleteOrganizationName} onChange={event => setDeleteOrganizationName(event.target.value)}/></Field>
                <div className="form-actions"><Button type="button" variant="secondary" onClick={() => setDeleteOrganizationOpen(false)}>{tr('Cancel')}</Button><Button type="submit" variant="danger" loading={deleteOrganization.isPending} disabled={deleteOrganizationName !== org.name}>{tr('Delete organization')}</Button></div>
            </form>
        </Modal>}
    </>;
}
