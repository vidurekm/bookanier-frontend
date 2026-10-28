import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import { PreferencesProvider } from './lib/preferences';
import './styles.css';
import { installFrontendErrorHandlers } from './lib/frontendLogger';
import { installFormValidation } from './lib/formValidation';
import { currentUrlLanguage, DEFAULT_LANGUAGE, localizedPath, urlLocale } from './lib/locale';
import type { Language } from './lib/preferences';

// Explicit /pl/, /cs/, /sk/ or /en/ always wins. A legacy public link without
// a prefix uses this particular organization's configured default language,
// independent of the language chosen by the dashboard owner. Other unprefixed
// pages use the saved choice or English.
async function selectInitialLocale():Promise<void> {
  if (urlLocale(window.location.pathname)) return;
  let desired: Language = DEFAULT_LANGUAGE;
  const match=window.location.pathname.match(/^\/(?:rezervace|reservations)\/([0-9a-f-]{36})\/?$/i);
  if (match) {
    try {
      const res=await fetch(`/api/v1/public/organizations/${encodeURIComponent(match[1])}/booking-mode`,{credentials:'omit'});
      if (res.ok) {
        const mode=await res.json() as {settings?:string|Record<string,unknown>};
        const raw=typeof mode.settings==='string'?JSON.parse(mode.settings) as Record<string,unknown>:mode.settings;
        const configured=raw?.defaultPublicLanguage;
        if (configured==='cs'||configured==='pl'||configured==='sk'||configured==='en') desired=configured;
      }
    } catch { /* public API unavailable: use the English fallback, never block startup */ }
  } else {
    try {
      const saved=localStorage.getItem('bookanear_language_v1');
      if (saved==='cs'||saved==='pl'||saved==='sk'||saved==='en') desired=saved;
    } catch { /* restricted storage */ }
  }
  window.history.replaceState(window.history.state,'',localizedPath(window.location.pathname.replace(/^\/rezervace\//,'/reservations/'),desired)+window.location.search+window.location.hash);
}

installFrontendErrorHandlers();
installFormValidation();
async function start() {
  await selectInitialLocale();
  const localeBasename = '/' + currentUrlLanguage();
  const client=new QueryClient({defaultOptions:{queries:{retry:1,staleTime:20_000,refetchOnWindowFocus:false}}});
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><QueryClientProvider client={client}><BrowserRouter basename={localeBasename}><PreferencesProvider><ToastProvider><ConfirmProvider><AuthProvider><App/></AuthProvider></ConfirmProvider></ToastProvider></PreferencesProvider></BrowserRouter></QueryClientProvider></React.StrictMode>
  );
}
void start();
