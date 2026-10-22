import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { Button, Card, Field, Input, Loading, Modal, Notice, PageTitle } from '../components/UI';
import { api, json } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { currentLanguage } from '../lib/preferences';
import { tr } from '../lib/translations';
import { useAuth } from '../contexts/AuthContext';

type Account = {name:string;email:string;pendingEmail:string|null};

export function AccountPage() {
    return <div className="account-page"><header className="booking-header container"><BrandLogo/><Link to="/admin/overview" className="back-link"><ArrowLeft size={17}/>{tr('Back to administration')}</Link></header><main className="container account-main">
        <PageTitle eyebrow={tr('PERSONAL ACCOUNT')} title={tr('My account')} description={tr('Manage your name, email address, and password.')}/>
        <AccountSettingsPanel/>
    </main></div>;
}

export function AccountSettingsPanel() {
    const queryClient=useQueryClient();
    const navigate=useNavigate();
    const {logout}=useAuth();
    const {data:account,isLoading,error:loadError}=useQuery({
        queryKey:['current-user'],
        queryFn:()=>api<Account>('/auth/me'),
        retry:false
    });
    const [name,setName]=useState('');
    const [email,setEmail]=useState('');
    const [emailPassword,setEmailPassword]=useState('');
    const [currentPassword,setCurrentPassword]=useState('');
    const [newPassword,setNewPassword]=useState('');
    const [emailOpen,setEmailOpen]=useState(false);
    const [passwordOpen,setPasswordOpen]=useState(false);
    const [message,setMessage]=useState('');
    const [error,setError]=useState('');
    useEffect(()=>{if(account)setName(account.name);},[account?.name]);
    const saveName=useMutation({
        mutationFn:()=>api<Account>('/auth/me',json('PUT',{name})),
        onSuccess:async updated=>{setName(updated.name);setMessage(tr('Your name has been updated.'));setError('');await queryClient.setQueryData(['current-user'],updated);}
    });
    const requestEmail=useMutation({
        mutationFn:()=>api('/auth/me/email',json('PUT',{email,currentPassword:emailPassword,language:currentLanguage()})),
        onSuccess:async()=>{setEmailPassword('');setEmail('');setEmailOpen(false);setMessage(tr('Check your new email address to confirm the change.'));setError('');await queryClient.invalidateQueries({queryKey:['current-user']});}
    });
    const changePassword=useMutation({
        mutationFn:()=>api('/auth/me/password',json('PUT',{currentPassword,newPassword})),
        onSuccess:()=>{logout();navigate('/login',{replace:true,state:{notice:tr('Password updated. Please sign in again.')}});}
    });
    function submitName(event:FormEvent){event.preventDefault();setError('');setMessage('');saveName.mutate(undefined,{onError:e=>setError(safeErrorMessage(e))});}
    function submitEmail(event:FormEvent){event.preventDefault();setError('');setMessage('');requestEmail.mutate(undefined,{onError:e=>setError(safeErrorMessage(e))});}
    function submitPassword(event:FormEvent){event.preventDefault();setError('');setMessage('');changePassword.mutate(undefined,{onError:e=>setError(safeErrorMessage(e))});}

    return <>
        <Notice message={error}/><Notice message={message} kind="success"/>
        {isLoading?<Loading/>:loadError?<Notice message={safeErrorMessage(loadError)}/>:account&&<div className="account-grid">
            <Card><div className="card-heading"><UserRound size={20}/><h2>{tr('Name')}</h2></div><form className="stack" onSubmit={submitName}><Field label={tr('Full name')}><Input required maxLength={200} value={name} onChange={e=>setName(e.target.value)}/></Field><Button type="submit" loading={saveName.isPending}>{tr('Save name')}</Button></form></Card>
            <Card><div className="card-heading"><Mail size={20}/><h2>{tr('Email address')}</h2></div><div className="stack"><p>{tr('Current email')}: <strong>{account.email}</strong></p>{account.pendingEmail&&<Notice kind="info" message={`${tr('Waiting for confirmation')}: ${account.pendingEmail}`}/>}<Button variant="secondary" onClick={()=>{setEmailOpen(true);setError('');setMessage('');}}>{tr('Change email address')}</Button></div></Card>
            <Card><div className="card-heading"><ShieldCheck size={20}/><h2>{tr('Password')}</h2></div><div className="stack"><p className="muted small">{tr('Changing your password signs you out of all sessions.')}</p><Button variant="secondary" onClick={()=>{setPasswordOpen(true);setError('');setMessage('');}}>{tr('Change password')}</Button></div></Card>
        </div>}
        {emailOpen&&<Modal title={tr('Change email address')} onClose={()=>setEmailOpen(false)}><form className="stack" onSubmit={submitEmail}><Notice message={error}/><Field label={tr('New email address')}><Input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label={tr('Current password')}><Input required type="password" autoComplete="current-password" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)}/></Field><p className="muted small">{tr('We will change your email only after you confirm the link sent to the new address.')}</p><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setEmailOpen(false)}>{tr('Cancel')}</Button><Button type="submit" loading={requestEmail.isPending}>{tr('Send confirmation email')}</Button></div></form></Modal>}
        {passwordOpen&&<Modal title={tr('Change password')} onClose={()=>setPasswordOpen(false)}><form className="stack" onSubmit={submitPassword}><Notice message={error}/><Field label={tr('Current password')}><Input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></Field><Field label={tr('New password')}><Input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></Field><p className="muted small">{tr('Changing your password signs you out of all sessions.')}</p><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setPasswordOpen(false)}>{tr('Cancel')}</Button><Button type="submit" loading={changePassword.isPending}>{tr('Update password')}</Button></div></form></Modal>}
    </>;
}

export function ConfirmAccountEmailPage() {
    const [params]=useSearchParams();
    const token=params.get('token')||'';
    const [done,setDone]=useState(false);
    const [error,setError]=useState('');
    const confirm=useMutation({
        mutationFn:()=>api('/auth/email/confirm',json('POST',{token})),
        onSuccess:()=>{setDone(true);setError('');},
        onError:e=>setError(safeErrorMessage(e))
    });
    return <div className="account-page"><header className="booking-header container"><BrandLogo/></header><main className="container account-main account-confirm"><Card><PageTitle eyebrow={tr('PERSONAL ACCOUNT')} title={tr('Confirm email change')}/>{done?<><Notice kind="success" message={tr('Your email address has been updated.')}/><Link className="btn btn-primary" to="/login">{tr('Sign in')}</Link></>:<div className="stack"><p>{tr('Confirm the new email address for your Bookanear account.')}</p><Notice message={error}/><Button disabled={!token||confirm.isPending} loading={confirm.isPending} onClick={()=>confirm.mutate()}>{tr('Confirm new email address')}</Button></div>}</Card></main></div>;
}
