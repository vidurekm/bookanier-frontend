import { BrandLogo } from '../components/BrandLogo';
import { safeErrorMessage } from '../lib/errors';
import { LanguageSelect } from '../components/PreferencesControls';
import { tr } from '../lib/translations';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, json } from '../lib/api';
import { Button, Field, Input, Notice } from '../components/UI';
export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(tr("")); try {
        await login(email, password);
        navigate('/admin/overview', { replace: true });
    }
    catch (err) {
        setError(safeErrorMessage(err));
    }
    finally {
        setBusy(false);
    } }
    return <AuthLayout title={tr("V\u00EDtejte zp\u011Bt")} subtitle={tr("Přihlaste se do správy svého provozu.")}><form onSubmit={submit} className="stack"><Notice message={error}/><Field label={tr("E-mail")}><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={tr("vas@email.cz")} required autoComplete="username"/></Field><Field label={tr("Heslo")}><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tr("Zadejte heslo")} required autoComplete="current-password"/></Field><Button loading={busy} type="submit" className="btn-full">{tr("P\u0159ihl\u00E1sit se ")}<ArrowRight size={17}/></Button><p className="auth-footer"><Link to="/forgot-password">{tr("Zapomněli jste heslo?")}</Link></p><p className="auth-footer">{tr("Nem\u00E1te \u00FA\u010Det? ")}<Link to="/register">{tr("Vytvo\u0159it organizaci")}</Link></p></form></AuthLayout>;
}
export function RegisterPage() {
    const [data, setData] = useState({ organizationName: '', ownerName: '', email: '', password: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const update = (k: keyof typeof data, v: string) => setData(p => ({ ...p, [k]: v }));
    async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(tr("")); try {
        await api('/registration', json('POST', data), false);
        setSuccess(tr("Registrace prob\u011Bhla. Zkontrolujte e-mail a potvr\u010Fte sv\u016Fj \u00FA\u010Det."));
    }
    catch (err) {
        setError(safeErrorMessage(err));
    }
    finally {
        setBusy(false);
    } }
    return <AuthLayout title={tr("Za\u010Dn\u011Bte bookanearvat")} subtitle={tr("Vytvořte organizaci a nastavte své pobočky.")}><form className="stack" onSubmit={submit}><Notice message={error}/><Notice message={success} kind="success"/><Field label={tr("N\u00E1zev organizace")}><Input value={data.organizationName} onChange={e => update('organizationName', e.target.value)} placeholder={tr("Nap\u0159. Studio Aurora")} required/></Field><Field label={tr("Va\u0161e jm\u00E9no")}><Input value={data.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder={tr("Jana Nov\u00E1kov\u00E1")} required/></Field><Field label={tr("E-mail")}><Input type="email" value={data.email} onChange={e => update('email', e.target.value)} required/></Field><Field label={tr("Heslo (min. 12 znak\u016F)")}><Input type="password" minLength={12} value={data.password} onChange={e => update('password', e.target.value)} autoComplete="new-password" required/></Field><Button loading={busy} type="submit" className="btn-full">{tr("Vytvo\u0159it \u00FA\u010Det ")}<ArrowRight size={17}/></Button><p className="auth-footer">{tr("U\u017E m\u00E1te \u00FA\u010Det? ")}<Link to="/login">{tr("P\u0159ihl\u00E1sit se")}</Link></p></form></AuthLayout>;
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
    return <AuthLayout title={tr("Ov\u011B\u0159en\u00ED e-mailu")} subtitle={tr("Potvrďte svou e-mailovou adresu.")}>{done ? <div className="success-panel"><CheckCircle2 size={36}/><h3>{tr("\u00DA\u010Det je ov\u011B\u0159en\u00FD")}</h3><p>{tr("Nyn\u00ED se m\u016F\u017Eete p\u0159ihl\u00E1sit do administrace.")}</p><Link className="btn btn-primary" to="/login">{tr("P\u0159ej\u00EDt na p\u0159ihl\u00E1\u0161en\u00ED")}</Link></div> : <form className="stack" onSubmit={submit}><Notice message={error}/><p className="muted">Kliknutím na tlačítko ověříte e-mail a aktivujete účet. Odkaz lze použít pouze jednou.</p><Button loading={busy} type="submit">{tr("Ov\u011B\u0159it e-mail")}</Button></form>}</AuthLayout>;
}
export function ForgotPasswordPage() {
    const [email,setEmail]=useState('');
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const [sent,setSent]=useState(false);
    async function submit(e:FormEvent) {
        e.preventDefault();setBusy(true);setError('');
        try {await api('/auth/password/forgot',json('POST',{email}),false);setSent(true);}
        catch(err) {setError(safeErrorMessage(err));}
        finally {setBusy(false);}
    }
    return <AuthLayout title={tr('Obnovení hesla')} subtitle={tr('Pošleme vám odkaz pro nastavení nového hesla.')}>
      {sent ? <div className="success-panel"><Mail size={36}/><h3>{tr('Zkontrolujte svou e-mailovou schránku')}</h3><p>{tr('Pokud pro zadaný e-mail existuje účet, poslali jsme odkaz pro změnu hesla.')}</p><Link className="btn btn-primary" to="/login">{tr('Přejít na přihlášení')}</Link></div>
      : <form className="stack" onSubmit={submit}><Notice message={error}/><Field label={tr('E-mail')}><Input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></Field><Button loading={busy} className="btn-full" type="submit">{tr('Poslat odkaz na obnovu hesla')}</Button><p className="auth-footer"><Link to="/login">{tr('Zpět na přihlášení')}</Link></p></form>}
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
        if(password!==confirmation) {setError(tr('Hesla se neshodují.'));return;}
        setBusy(true);setError('');
        try {
            await api('/auth/password/reset',json('POST',{token,newPassword:password}),false);
            setDone(true);setPassword('');setConfirmation('');
        }catch(err){setError(safeErrorMessage(err));}
        finally{setBusy(false);}
    }
    return <AuthLayout title={tr('Nastavení nového hesla')} subtitle={tr('Zadejte nové heslo pro svůj účet Bookanear.')}>
      {done ? <div className="success-panel"><CheckCircle2 size={36}/><h3>{tr('Heslo bylo změněno')}</h3><p>{tr('Nyní se můžete přihlásit novým heslem.')}</p><Link className="btn btn-primary" to="/login">{tr('Přejít na přihlášení')}</Link></div>
      : !/^[A-Za-z0-9_-]{32,128}$/.test(token) ? <div className="stack"><Notice message={tr('Odkaz pro obnovu hesla je neplatný. Požádejte o nový.')}/><Link className="btn btn-primary" to="/forgot-password">{tr('Požádat o nový odkaz')}</Link></div>
      : <form className="stack" onSubmit={submit}><Notice message={error}/><Field label={tr('Nové heslo (min. 12 znaků)')}><Input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></Field><Field label={tr('Zopakujte nové heslo')}><Input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></Field><Button className="btn-full" type="submit" loading={busy}>{tr('Uložit nové heslo')}</Button><p className="auth-footer"><Link to="/forgot-password">{tr('Požádat o nový odkaz')}</Link></p></form>}
    </AuthLayout>;
}
function AuthLayout({ title, subtitle, children }: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) { return <div className="auth-page"><div className="auth-brand"><BrandLogo light tagline/><div className="auth-brand-copy"><span className="eyebrow eyebrow-light">{tr("JEDNO M\u00CDSTO PRO V\u0160ECHNY REZERVACE")}</span><h1>{tr("V\u00EDce \u010Dasu na to,")}<br />{tr("co v\u00E1s bav\u00ED.")}</h1><p>{tr("Rezervace, pobo\u010Dky, t\u00FDm a z\u00E1kazn\u00EDci p\u0159ehledn\u011B na jednom m\u00EDst\u011B.")}</p></div><div className="auth-brand-benefits"><span><ShieldCheck size={17}/>{tr("Bezpe\u010Dn\u00E1 spr\u00E1va dat")}</span><span><Mail size={17}/>{tr("V\u0161e pod kontrolou")}</span><span><LockKeyhole size={17}/>{tr("P\u0159\u00EDstup podle rol\u00ED")}</span></div></div><main className="auth-main"><div className="auth-box"><div className="auth-language"><LanguageSelect compact/></div><span className="auth-kicker">BOOKANEAR BACKOFFICE</span><h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{children}</div><div className="auth-copyright">© {new Date().getFullYear()}{tr("Bookanear \u00B7 ")}<Link to="/">{tr("\u00DAvodn\u00ED str\u00E1nka")}</Link></div></main></div>; }
