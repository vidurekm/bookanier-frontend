import { lazy, Suspense, type ReactNode } from 'react';
import { usePreferences } from './lib/preferences';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AdminShell } from './components/AdminShell';
import { useQuery } from '@tanstack/react-query';
import { publicMode } from './lib/setup';
import { Loading } from './components/UI';

const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.RegisterPage })));
const VerifyPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.VerifyPage })));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.ResetPasswordPage })));
const AcceptInvitePage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.AcceptInvitePage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(module => ({ default: module.AccountPage })));
const ConfirmAccountEmailPage = lazy(() => import('./pages/AccountPage').then(module => ({ default: module.ConfirmAccountEmailPage })));
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage').then(module => ({ default: module.PublicBookingPage })));
const PublicEventsPage = lazy(() => import('./pages/PublicEventsPage').then(module => ({ default: module.PublicEventsPage })));
const ManageEventPage = lazy(() => import('./pages/PublicEventsPage').then(module => ({ default: module.ManageEventPage })));
const ManageBookingPage = lazy(() => import('./pages/ManageBookingPage').then(module => ({ default: module.ManageBookingPage })));
const AdminOverview = lazy(() => import('./pages/AdminOverview').then(module => ({ default: module.AdminOverview })));
const AdminReservations = lazy(() => import('./pages/AdminReservations').then(module => ({ default: module.AdminReservations })));
const AdminEvents = lazy(() => import('./pages/AdminEvents').then(module => ({ default: module.AdminEvents })));
const AdminLocations = lazy(() => import('./pages/AdminLocations').then(module => ({ default: module.AdminLocations })));
const AdminServices = lazy(() => import('./pages/AdminServices').then(module => ({ default: module.AdminServices })));
const AdminTeam = lazy(() => import('./pages/AdminTeam').then(module => ({ default: module.AdminTeam })));
const AdminResources = lazy(() => import('./pages/AdminResources').then(module => ({ default: module.AdminResources })));
const AdminCustomers = lazy(() => import('./pages/AdminCustomers').then(module => ({ default: module.AdminCustomers })));
const AdminBookingCustomers = lazy(() => import('./pages/AdminBookingCustomers').then(module => ({ default: module.AdminBookingCustomers })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminAbsenceRequests = lazy(() => import('./pages/AdminAbsenceRequests').then(module => ({ default: module.AdminAbsenceRequests })));

function RequireAuth({children}:{children:ReactNode}){
  const {token}=useAuth(); const location=useLocation();
  return token?children:<Navigate to="/login" state={{from:location.pathname}} replace/>;
}
function PublicBookingRouter(){
  const {publicId=''}=useParams();
  const {data,isLoading}=useQuery({queryKey:['booking-mode',publicId],queryFn:()=>publicMode(publicId),retry:false});
  if(isLoading)return <Loading/>;
  return data?.booking_model==='EVENT'?<PublicEventsPage/>:<PublicBookingPage/>;
}
// Previously shared Czech URLs keep working but point to canonical English route names.
function OldLink({to}:{to:string}){
  const params=useParams();const loc=useLocation();
  const destination=to.replace(/:([a-zA-Z]+)/g,(_,name:string)=>encodeURIComponent(params[name]||''));
  return <Navigate replace to={destination+loc.search+loc.hash}/>;
}
export default function App(){
  usePreferences();
  return <Suspense fallback={<Loading/>}><Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route path="/verify-email" element={<VerifyPage/>}/>
    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
    <Route path="/accept-invite" element={<AcceptInvitePage/>}/>
    <Route path="/verify-account-email" element={<ConfirmAccountEmailPage/>}/>
    <Route path="/account" element={<RequireAuth><AccountPage/></RequireAuth>}/>
    <Route path="/reservations/:publicId" element={<PublicBookingRouter/>}/>
    <Route path="/events/manage/:token" element={<ManageEventPage/>}/>
    <Route path="/manage/:token" element={<ManageBookingPage/>}/>
    <Route path="/admin" element={<RequireAuth><AdminShell/></RequireAuth>}>
      <Route index element={<Navigate to="overview" replace/>}/>
      <Route path="overview" element={<AdminOverview/>}/>
      <Route path="reservations" element={<AdminReservations/>}/>
      <Route path="events" element={<AdminEvents/>}/>
      <Route path="locations" element={<AdminLocations/>}/>
      <Route path="services" element={<AdminServices/>}/>
      <Route path="team" element={<AdminTeam/>}/>
      <Route path="resources" element={<AdminResources/>}/>
      <Route path="customers" element={<AdminCustomers/>}/>
      <Route path="booking-customers" element={<AdminBookingCustomers/>}/>
      <Route path="settings" element={<AdminSettings/>}/>
      <Route path="absence-requests" element={<AdminAbsenceRequests/>}/>
      {[
        ['prehled','overview'],['rezervace','reservations'],['udalosti','events'],
        ['pobocky','locations'],['sluzby','services'],['tym','team'],
        ['zdroje','resources'],['zakaznici','customers'],['nastaveni','settings'],
        ['zadosti-o-volno','absence-requests']
      ].map(([previous,canonical])=><Route key={previous} path={previous} element={<OldLink to={'/admin/'+canonical}/>}/>)}
    </Route>
    <Route path="/prihlaseni" element={<OldLink to="/login"/>}/>
    <Route path="/registrace" element={<OldLink to="/register"/>}/>
    <Route path="/overeni" element={<OldLink to="/verify-email"/>}/>
    <Route path="/rezervace/:publicId" element={<OldLink to="/reservations/:publicId"/>}/>
    <Route path="/udalost/sprava/:token" element={<OldLink to="/events/manage/:token"/>}/>
    <Route path="/sprava/:token" element={<OldLink to="/manage/:token"/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense>;
}
