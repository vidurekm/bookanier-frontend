import { safeErrorMessage } from '../lib/errors';
import { AppearanceSelect, LanguageSelect, ThemeSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, UserRound } from 'lucide-react';
import { useAdmin } from '../components/AdminShell';
import { json, orgApi } from '../lib/api';
import { Button, Card, Field, Input, Notice, PageTitle, Select } from '../components/UI';
import { useQuery } from '@tanstack/react-query';
import { getSetup, updateSetupOptions } from '../lib/setup';
import { st } from '../lib/setupTranslations';
import { bookingCurrencies, bookingLanguages } from '../lib/bookingOptions';
import { dateFormats, setActiveDateFormat } from '../lib/dateFormat';
import { MediaGallery } from '../components/MediaGallery';
import { AccountSettingsPanel } from './AccountPage';
import { myAccess } from '../lib/access';
import { useSearchParams } from 'react-router-dom';
export function AdminSettings() {
    const { orgId, org } = useAdmin();
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') === 'user' ? 'user' : 'organization';
    const {data:access}=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId),enabled:orgId>0,retry:false});
    const {data:setup}=useQuery({queryKey:['setup',orgId],queryFn:()=>getSetup(orgId)});
    const [form, setForm] = useState({ name: '', email: '', phone: '', defaultTimezone: 'Europe/Prague', bookingEnabled: true });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useEffect(() => {
        if (access && !access.canWrite && tab !== 'user') setSearchParams({tab:'user'}, {replace:true});
    }, [access, setSearchParams, tab]);
    useEffect(() => { if (org)
        setForm({ name: org.name, email: org.email || '', phone: org.phone || '', defaultTimezone: org.default_timezone || 'Europe/Prague', bookingEnabled: org.booking_enabled ?? true }); }, [org]);
    const save = useMutation({ mutationFn: () => orgApi(orgId, '', json('PUT', form)), onSuccess: () => { setError(tr("")); setSuccess(tr("Organization settings saved.")); qc.invalidateQueries({ queryKey: ['organization', orgId] }); qc.invalidateQueries({ queryKey: ['organizations'] }); }, onError: e => setError(safeErrorMessage(e)) });
    const [opts,setOpts]=useState({customerSelectResource:false,showStaffChoice:true,eventCapacity:12,defaultPublicLanguage:'cs',defaultCurrency:'CZK',dateFormat:'DD.MM.YYYY',maxAdvanceDays:180});
    useEffect(()=>{if(setup?.settings){const x=setup.settings as Record<string,unknown>;setOpts({customerSelectResource:x.customerSelectResource===true,showStaffChoice:x.showStaffChoice!==false,eventCapacity:Number(x.eventCapacity||12),defaultPublicLanguage:String(x.defaultPublicLanguage||'cs'),defaultCurrency:String(x.defaultCurrency||'CZK'),dateFormat:String(x.dateFormat||'DD.MM.YYYY'),maxAdvanceDays:Number(x.maxAdvanceDays||180)});}},[setup]);
    const saveOpts=useMutation({mutationFn:()=>updateSetupOptions(orgId,opts),onSuccess:()=>{setActiveDateFormat(opts.dateFormat);setSuccess(tr('Organization settings saved.'));setError('');qc.invalidateQueries({queryKey:['setup',orgId]});},onError:e=>setError(safeErrorMessage(e))});
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
                <Card>
                    <div className="card-heading"><div><h2>{tr("Organization details")}</h2><p>{tr("This information is used to manage your business.")}</p></div></div>
                    <form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }}>
                        <Notice message={error}/><Notice message={success} kind="success"/>
                        <Field label={tr("Organization name")}><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field>
                        <div className="form-grid">
                            <Field label={tr("Contact email")}><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/></Field>
                            <Field label={tr("Phone")}><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}/></Field>
                        </div>
                        <Field label={tr("Default time zone")}><Input required value={form.defaultTimezone} onChange={e => setForm(p => ({ ...p, defaultTimezone: e.target.value }))}/></Field>
                        <Field label={tr("Public bookings")}><Select value={String(form.bookingEnabled)} onChange={e => setForm(p => ({ ...p, bookingEnabled: e.target.value === 'true' }))}><option value="true">{tr("Enabled")}</option><option value="false">{tr("Paused")}</option></Select></Field>
                        <div className="form-actions"><Button type="submit" loading={save.isPending}>{tr("Save settings")}</Button></div>
                    </form>
                    <div className="organization-media stack">
                        <MediaGallery org={orgId} kind="organization-logo" target={orgId} single/>
                        <MediaGallery org={orgId} kind="organization" target={orgId}/>
                    </div>
                </Card>
                <div className="stack">
                    <Card>
                        <div className="card-heading"><div><span className="eyebrow">{tr("FOR CUSTOMERS")}</span><h2>{tr("Customers")}</h2></div></div>
                        <div className="stack">
                        <label className="setup-check"><input type="checkbox" checked={opts.customerSelectResource} onChange={e=>setOpts(p=>({...p,customerSelectResource:e.target.checked}))}/>{tr("Customers can choose specific equipment or a room")}</label>
                        <label className="setup-check"><input type="checkbox" checked={opts.showStaffChoice} onChange={e=>setOpts(p=>({...p,showStaffChoice:e.target.checked}))}/>{tr("Customers can choose a specific staff member")}</label>
                        <p className="muted small">{tr("When staff selection is disabled, an available worker is assigned automatically. Equipment selection is configured separately.")}</p>
                        <Field label={tr("Default public page language")}><Select value={opts.defaultPublicLanguage} onChange={e=>setOpts(p=>({...p,defaultPublicLanguage:e.target.value}))}>{bookingLanguages.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</Select></Field>
                        <Field label={tr("Default currency for new services")}><Select value={opts.defaultCurrency} onChange={e=>setOpts(p=>({...p,defaultCurrency:e.target.value}))}>{bookingCurrencies.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</Select></Field>
                        <Field label={tr('Date format')}><Select value={opts.dateFormat} onChange={e=>setOpts(p=>({...p,dateFormat:e.target.value}))}>{dateFormats.map(x=><option key={x.value} value={x.value}>{x.label} ({x.value})</option>)}</Select></Field>
                        <Field label={tr('Maximum number of days in advance for bookings')}><Input type="number" min={1} max={3650} required value={opts.maxAdvanceDays} onChange={e=>setOpts(p=>({...p,maxAdvanceDays:Number(e.target.value)}))}/></Field>
                        <p className="muted small">{tr('Customers can book up to this many days ahead.')}</p><p className="muted small">{tr("Changing currency will not convert existing prices. Add a new price version for an existing service.")}</p>
                        <Field label={st('Default class capacity')}><Input type="number" min={1} max={10000} value={opts.eventCapacity} onChange={e=>setOpts(p=>({...p,eventCapacity:Number(e.target.value)}))}/></Field>
                        <Button loading={saveOpts.isPending} onClick={()=>saveOpts.mutate()}>{tr('Save settings')}</Button>
                        </div>
                    </Card>
                </div>
            </div>}
    </>;
}
