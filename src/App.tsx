import type { ReactNode } from 'react';
import { usePreferences } from './lib/preferences';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AdminShell } from './components/AdminShell';
import { HomePage } from './pages/HomePage';
import { LoginPage, RegisterPage, VerifyPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import { PublicBookingPage } from './pages/PublicBookingPage';
import { PublicEventsPage, ManageEventPage } from './pages/PublicEventsPage';
import { AdminEvents } from './pages/AdminEvents';
import { useQuery } from '@tanstack/react-query';
import { publicMode } from './lib/setup';
import { Loading } from './components/UI';
import { ManageBookingPage } from './pages/ManageBookingPage';
import { AdminOverview } from './pages/AdminOverview';
import { AdminLocations } from './pages/AdminLocations';
import { AdminServices } from './pages/AdminServices';
import { AdminTeam } from './pages/AdminTeam';
import { AdminResources } from './pages/AdminResources';
import { AdminReservations } from './pages/AdminReservations';
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminSettings } from './pages/AdminSettings';
import { AdminAbsenceRequests } from './pages/AdminAbsenceRequests';

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
  return <Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route path="/verify-email" element={<VerifyPage/>}/>
    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
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
  </Routes>;
}
