import { BrandLogo } from '../components/BrandLogo';
import { safeErrorMessage } from '../lib/errors';
import { LanguageSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { currentLanguage } from '../lib/preferences';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, json } from '../lib/api';
import { Button, Field, Input, Notice } from '../components/UI';
export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(tr("")); try {
        await login(email, password);
        const from = (location.state as {from?:string}|null)?.from;
        navigate(from || '/admin/overview', { replace: true });
    }
    catch (err) {
        setError(safeErrorMessage(err));
    }
    finally {
        setBusy(false);
    } }
    const notice=(location.state as {notice?:string}|null)?.notice;
    return <AuthLayout title={tr("Welcome back")} subtitle={tr("Sign in to manage your business.")}><form onSubmit={submit} className="stack"><Notice message={notice} kind="success"/><Notice message={error}/><Field label={tr("Email")}><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={tr("your@email.com")} required autoComplete="username"/></Field><Field label={tr("Password")}><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tr("Enter password")} required autoComplete="current-password"/></Field><Button loading={busy} type="submit" className="btn-full">{tr("Sign in ")}<ArrowRight size={17}/></Button><p className="auth-footer"><Link to="/forgot-password">{tr("Forgot your password?")}</Link></p><p className="auth-footer">{tr("Don't have an account? ")}<Link to="/register">{tr("Create account")}</Link></p></form></AuthLayout>;
}
export function AcceptInvitePage() {
    const [params] = useSearchParams();
    const [token] = useState(params.get('token') || '');
    const [info, setInfo] = useState<{organizationId:number;email:string;displayName:string;organizationName:string;role:string;accountExists:boolean}|null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const { token: sessionToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return;
        api<typeof info>(`/invitations?token=${encodeURIComponent(token)}`, {}, false)
          .then(setInfo).catch(err => setError(safeErrorMessage(err)));
    }, [token]);
    async function accept(e: FormEvent) {
        e.preventDefault(); setBusy(true); setError('');
        try {
            await api('/invitations/accept', json('POST', {token, password: password || undefined}));
            if (info) sessionStorage.setItem('bookanear_org_id', String(info.organizationId));
            setDone(true);
        } catch (err) { setError(safeErrorMessage(err)); }
        finally { setBusy(false); }
    }
    const returnTo = location.pathname + location.search;
    return <AuthLayout title={tr('Invitation acceptance')} subtitle={tr('Join the team and use your account across organizations.')}>
      {done ? <div className="success-panel"><CheckCircle2 size={36}/><h3>{tr('Invitation accepted')}</h3><p>{sessionToken ? tr('You can now open the organization.') : tr('Now sign in to your account and open the workspace.')}</p><Link className="btn btn-primary" to={sessionToken?'/admin/overview':'/login'}>{sessionToken ? tr('Open organization') : tr('Go to sign in')}</Link></div>
      : !/^[A-Za-z0-9_-]{32,128}$/.test(token) ? <Notice message={tr('This invitation link is invalid or expired.')}/>
      : <form className="stack" onSubmit={accept}><Notice message={error}/>{info ? <><p>{tr('Invitation to organization')} <strong>{info.organizationName}</strong></p><p className="muted">{info.displayName} · {info.email} · {roleLabelText(info.role)}</p>{sessionToken ? <Button className="btn-full" type="submit" loading={busy}>{tr('Accept invitation')}</Button> : info.accountExists ? <><p className="muted">{tr('This email already has an account. Sign in to accept the invitation.')}</p><Button type="button" className="btn-full" onClick={()=>navigate('/login',{state:{from:returnTo}})}>{tr('Sign in')}</Button></> : <><Field label={tr('Create a password (min. 8 characters)')}><Input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></Field><Button className="btn-full" type="submit" loading={busy}>{tr('Create account and accept invitation')}</Button></>}</> : !error && <p className="muted">{tr('Checking invitation?')}</p>}</form>}
    </AuthLayout>;
}
function roleLabelText(role: string) { return role === 'owner' ? tr('Owner') : role === 'admin' ? tr('Administrator') : tr('Employee'); }
export function RegisterPage() {
    const [data, setData] = useState({ organizationName: '', ownerName: '', email: '', password: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const update = (k: keyof typeof data, v: string) => setData(p => ({ ...p, [k]: v }));
    async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(tr("")); try {
        await api('/registration', json('POST', { ...data, language: currentLanguage() }), false);
        setData({ organizationName: '', ownerName: '', email: '', password: '' });
        setSuccess(tr("Registration successful. Check your email to verify your account."));
    }
    catch (err) {
        setError(safeErrorMessage(err));
    }
    finally {
        setBusy(false);
    } }
    return <AuthLayout title={tr("Start taking bookings")} subtitle={tr("Create an organization and set up your locations.")}><form className="stack" onSubmit={submit}><Notice message={error}/><Notice message={success} kind="success"/><Field label={tr("Organization name")}><Input value={data.organizationName} onChange={e => update('organizationName', e.target.value)} placeholder={tr("e.g. Aurora Studio")} required/></Field><Field label={tr("Your name")}><Input value={data.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder={tr("Jane Smith")} required/></Field><Field label={tr("Email")}><Input type="email" value={data.email} onChange={e => update('email', e.target.value)} required/></Field><Field label={tr("Password (min. 8 characters)")}><Input type="password" minLength={8} maxLength={128} value={data.password} onChange={e => update('password', e.target.value)} autoComplete="new-password" required/></Field><Button loading={busy} type="submit" className="btn-full">{tr("Create account ")}<ArrowRight size={17}/></Button><p className="auth-footer">{tr("Already have an account? ")}<Link to="/login">{tr("Sign in")}</Link></p></form></AuthLayout>;
}
export function VerifyPage() {
    const [params] = useSearchParams();
    const [token] = useState(params.get('token') || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(tr("")); try {
        await api('/registration/verify', json('POST', { token }), false);
        setDone(true);
    }
    catch (err) {
        setError(safeErrorMessage(err));
    }
    finally {
        setBusy(false);
    } }
    return <AuthLayout title={tr("Email verification")} subtitle={tr("Confirm your email address.")}>{done ? <div className="success-panel"><CheckCircle2 size={36}/><h3>{tr("Account verified")}</h3><p>{tr("You can now sign in to the admin area.")}</p><Link className="btn btn-primary" to="/login">{tr("Go to sign in")}</Link></div> : <form className="stack" onSubmit={submit}><Notice message={error}/><p className="muted">Kliknutím na tlačítko ověříte e-mail a aktivujete účet. Odkaz lze použít pouze jednou.</p><Button loading={busy} type="submit">{tr("Verify email")}</Button></form>}</AuthLayout>;
}
export function ForgotPasswordPage() {
    const [email,setEmail]=useState('');
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const [sent,setSent]=useState(false);
    async function submit(e:FormEvent) {
        e.preventDefault();setBusy(true);setError('');
        try {await api('/auth/password/forgot',json('POST',{email,language:currentLanguage()}),false);setSent(true);}
        catch(err) {setError(safeErrorMessage(err));}
        finally {setBusy(false);}
    }
    return <AuthLayout title={tr('Password recovery')} subtitle={tr('We\'ll email you a link to set a new password.')}>
      {sent ? <div className="success-panel"><Mail size={36}/><h3>{tr('Check your inbox')}</h3><p>{tr('If an account exists, we have emailed a password reset link.')}</p><Link className="btn btn-primary" to="/login">{tr('Go to sign in')}</Link></div>
      : <form className="stack" onSubmit={submit}><Notice message={error}/><Field label={tr('Email')}><Input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></Field><Button loading={busy} className="btn-full" type="submit">{tr('Send password reset link')}</Button><p className="auth-footer"><Link to="/login">{tr('Back to login')}</Link></p></form>}
    </AuthLayout>;
}
export function ResetPasswordPage() {
    const [params]=useSearchParams();
    const [token]=useState(params.get('token')||'');
    const [password,setPassword]=useState('');
    const [confirmation,setConfirmation]=useState('');
    const [error,setError]=useState('');
    const [done,setDone]=useState(false);
    const [busy,setBusy]=useState(false);
    async function submit(e:FormEvent) {
        e.preventDefault();
        if(password!==confirmation) {setError(tr('Passwords do not match.'));return;}
        setBusy(true);setError('');
        try {
            await api('/auth/password/reset',json('POST',{token,newPassword:password}),false);
            setDone(true);setPassword('');setConfirmation('');
        }catch(err){setError(safeErrorMessage(err));}
        finally{setBusy(false);}
    }
    return <AuthLayout title={tr('Set a new password')} subtitle={tr('Choose a new password for your Bookanear account.')}>
      {done ? <div className="success-panel"><CheckCircle2 size={36}/><h3>{tr('Password changed')}</h3><p>{tr('You can now log in with your new password.')}</p><Link className="btn btn-primary" to="/login">{tr('Go to sign in')}</Link></div>
      : !/^[A-Za-z0-9_-]{32,128}$/.test(token) ? <div className="stack"><Notice message={tr('This password reset link is invalid. Request a new one.')}/><Link className="btn btn-primary" to="/forgot-password">{tr('Request a new link')}</Link></div>
      : <form className="stack" onSubmit={submit}><Notice message={error}/><Field label={tr('New password (min. 8 characters)')}><Input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></Field><Field label={tr('Confirm new password')}><Input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></Field><Button className="btn-full" type="submit" loading={busy}>{tr('Save new password')}</Button><p className="auth-footer"><Link to="/forgot-password">{tr('Request a new link')}</Link></p></form>}
    </AuthLayout>;
}
function AuthLayout({ title, subtitle, children }: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) { return <div className="auth-page"><div className="auth-brand"><BrandLogo light tagline/><div className="auth-brand-copy"><span className="eyebrow eyebrow-light">{tr("ONE PLACE FOR ALL BOOKINGS")}</span><h1>{tr("More time for")}<br />{tr("what you love.")}</h1><p>{tr("Bookings, locations, staff, and customers in one place.")}</p></div><div className="auth-brand-benefits"><span><ShieldCheck size={17}/>{tr("Secure data management")}</span><span><Mail size={17}/>{tr("Everything under control")}</span><span><LockKeyhole size={17}/>{tr("Role-based access")}</span></div></div><main className="auth-main"><div className="auth-box"><div className="auth-language"><LanguageSelect compact/></div><span className="auth-kicker">BOOKANEAR BACKOFFICE</span><h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{children}</div><div className="auth-copyright">© {new Date().getFullYear()}{' '}{tr("Bookanear")} · <Link to="/">{tr("Home page")}</Link></div></main></div>; }
