import { AppearanceSelect, LanguageSelect, ThemeSelect } from './PreferencesControls';
import { BrandLogo } from './BrandLogo';
import { usePreferences } from '../lib/preferences';
import { tr } from '../lib/translations';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, ChevronRight, CircleHelp, ContactRound, DoorOpen, LayoutDashboard, LogOut, MapPin, Menu, Settings2, UsersRound, Wrench, X, CircleUserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, organizations, orgApi } from '../lib/api';
import type { Organization } from '../lib/types';
import { Button, ErrorState, Loading } from './UI';
import { getSetup } from '../lib/setup';
import { setActiveDateFormat } from '../lib/dateFormat';
import { myAccess } from '../lib/access';
import { SetupWizard } from '../pages/SetupWizard';
import { CalendarRange } from 'lucide-react';
import { HelpChat } from './HelpChat';
const links = [{ path: 'overview', name: 'Přehled', icon: LayoutDashboard }, { path: 'reservations', name: 'Rezervace', icon: CalendarDays }, { path: 'locations', name: 'Pobočky', icon: MapPin }, { path: 'services', name: 'Služby', icon: DoorOpen }, { path: 'team', name: 'Tým a pracovní doba', icon: UsersRound }, { path: 'absence-requests', name: 'Žádosti o volno', icon: CalendarDays }, { path: 'resources', name: 'Zdroje', icon: Wrench }, { path: 'booking-customers', name: 'Customers', icon: ContactRound }, { path: 'settings', name: 'Nastavení', icon: Settings2 }];
export function AdminShell() {
    const { logout } = useAuth();
    const { theme, appearance } = usePreferences();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobile, setMobile] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [orgId, setOrgId] = useState<number>(() => Number(sessionStorage.getItem('bookanear_org_id') || 0));
    const orgSelectionInitialized = useRef(false);
    const [manual, setManual] = useState('');
    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => api<{name:string;email:string}>('/auth/me'),
        retry: false
    });
    const { data: orgs, error: orgError, isLoading } = useQuery({ queryKey: ['organizations'], queryFn: () => organizations(), retry: false });
    useEffect(() => {
        if (!orgs || orgSelectionInitialized.current) return;
        orgSelectionInitialized.current = true;
        const initialOrg = orgs.items.find(org => org.id === orgId) || orgs.items.find(org =>
            org.setup_status === 'draft' && ['owner', 'admin'].includes(org.my_role || '')
        ) || orgs.items[0];
        if (initialOrg && initialOrg.id !== orgId) {
            setOrgId(initialOrg.id);
            sessionStorage.setItem('bookanear_org_id', String(initialOrg.id));
        }
    }, [orgId, orgs]);
    useEffect(() => setMobile(false), [location.pathname]);
    const { data: org, error: orgDetailError } = useQuery({ queryKey: ['organization', orgId], queryFn: () => orgApi<Organization>(orgId, ''), enabled: orgId > 0, retry: false });
    const {data:setup,isLoading:setupLoading,error:setupError,refetch:refetchSetup}=useQuery({queryKey:['setup',orgId],queryFn:()=>getSetup(orgId),enabled:orgId>0,retry:false});
    useEffect(()=>{setActiveDateFormat((setup?.settings as Record<string,unknown>|undefined)?.dateFormat);},[setup]);
    const {data:access}=useQuery({queryKey:['access',orgId],queryFn:()=>myAccess(orgId),enabled:orgId>0,retry:false});
    const switchOrg = (id: number) => { setOrgId(id); sessionStorage.setItem('bookanear_org_id', String(id)); };
    const current = [...links,{path:'events',name:'Lekce a termíny'}].find(l => location.pathname.includes('/' + l.path));
    const model=setup?.booking_model;
    const settings=(setup?.settings||{}) as Record<string,unknown>;
    const visibleLinks=links.filter(l=>{
      if(access&&!access.canWrite&&!['overview','reservations','absence-requests','settings'].includes(l.path))return false;
      if(l.path==='team')return model==='APPOINTMENT'||model==='EVENT';
      if(l.path==='services')return model!=='EVENT';
      if(l.path==='resources')return model==='RENTAL'||model==='RESOURCE'||settings.trackResources===true;
      if(l.path==='reservations')return model!=='EVENT';
      return true;
    });
    if(model==='EVENT')visibleLinks.splice(1,0,{path:'events',name:'Lekce a termíny',icon:CalendarRange});
    if(orgId>0&&!setupLoading&&setupError&&!orgDetailError)return <div className="admin-layout" data-theme={theme} data-appearance={appearance}><main className="admin-main"><ErrorState error={setupError}/><Button variant="secondary" onClick={()=>void refetchSetup()}>{tr("Try again")}</Button></main></div>;
    const side = <><BrandLogo compact light to="/admin/overview"/><div className="sidebar-label">{tr("WORKSPACE")}</div><nav className="sidebar-nav">{(setup?.setup_status==='draft'?[]:visibleLinks).map(l => <NavLink key={l.path} to={`/admin/${l.path}`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><l.icon size={19}/><span>{tr(l.name)}</span>{location.pathname.endsWith('/' + l.path) && <ChevronRight size={15} className="sidebar-chevron"/>}</NavLink>)}</nav><div className="sidebar-bottom"><button className="sidebar-support" onClick={() => setHelpOpen(true)} aria-haspopup="dialog"><CircleHelp size={20}/><div><strong>{tr("Need help?")}</strong><small>{tr("Ask the Bookanear assistant")}</small></div><ChevronRight size={16}/></button><button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }}><LogOut size={19}/>{tr("Sign out")}</button></div></>;
    return <div className="admin-layout" data-theme={theme} data-appearance={appearance}><aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>{side}</aside>{mobile && <div className="sidebar-scrim" onClick={() => setMobile(false)}/>}<div className="admin-content"><header className="admin-topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobile(!mobile)} aria-label={tr("Open menu")}>{mobile ? <X size={22}/> : <Menu size={22}/>}</button><span className="breadcrumb">{tr("Workspace ")}<ChevronRight size={15}/> <strong>{tr(current?.name || 'Administrace')}</strong></span></div><div className="topbar-right"><div className="topbar-preferences"><LanguageSelect compact/><ThemeSelect compact/><AppearanceSelect compact/></div><Link className="btn btn-secondary" to="/register">{tr("Create organization")}</Link>{currentUser && <Link className="admin-account" to={orgId > 0 && setup?.setup_status !== 'draft' ? '/admin/settings?tab=user' : '/account'} title={currentUser.email}><CircleUserRound size={18}/><span>{currentUser.name}</span></Link>}<div className="org-switch"><span className="org-avatar">{(org?.name || 'O').charAt(0).toUpperCase()}</span><select aria-label={tr("Select organization")} value={orgId || ''} onChange={e => switchOrg(Number(e.target.value))}>{orgId > 0 && !orgs?.items.some(o => o.id === orgId) && <option value={orgId}>{org?.name || `${tr('ORGANIZATION')} #${orgId}`}</option>}{orgs?.items.map(o => <option value={o.id} key={o.id}>{o.name}</option>)}{!orgId && <option value="">{tr("Choose an organization")}</option>}</select><ChevronDown size={15}/></div></div></header><div className="admin-main">{!orgId ? <div className="org-empty"><h2>{tr("Choose an organization")}</h2><p>{tr("Organizations where you have active memberships will appear here.")}</p>{isLoading ? <Loading /> : <form onSubmit={e => { e.preventDefault(); if (Number(manual) > 0)
        switchOrg(Number(manual)); }} className="manual-org"><input type="number" min="1" placeholder={tr("Organization ID")} value={manual} onChange={e => setManual(e.target.value)}/><Button type="submit">{tr("Open")}</Button></form>}{orgError && <p className="muted small">{tr("The organization list is unavailable for this account. You can enter an ID manually.")}</p>}</div> : orgDetailError ? <div><ErrorState error={orgDetailError}/><Button variant="secondary" onClick={() => switchOrg(0)}>{tr("Change organization")}</Button></div> : setupLoading ? <Loading/> : setup?.setup_status==='draft' ? <SetupWizard orgId={orgId} initial={setup.settings as Record<string,unknown>}/> : <Outlet context={{ orgId, org }}/>}</div></div>{helpOpen && <HelpChat onClose={() => setHelpOpen(false)}/>}</div>;
}
export function useAdmin() { return useOutletContext<{
    orgId: number;
    org?: Organization;
}>(); }
