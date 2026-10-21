import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearToken, getToken, json, setToken } from '../lib/api';

interface AuthValue { token:string|null; login:(email:string,password:string)=>Promise<void>; logout:()=>void }
const AuthContext = createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}) {
  const [token,setCurrent] = useState<string|null>(getToken());
  const queryClient=useQueryClient();
  const logout=()=>{clearToken();setCurrent(null);queryClient.clear();};
  useEffect(()=>{window.addEventListener('bookanear:unauthorized',logout);return ()=>window.removeEventListener('bookanear:unauthorized',logout);});
  const login=async(email:string,password:string)=>{
    const result=await api<{accessToken:string}>('/auth/login',json('POST',{email,password}),false);
    setToken(result.accessToken);setCurrent(result.accessToken);queryClient.clear();
  };
  return <AuthContext.Provider value={{token,login,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const v=useContext(AuthContext);if(!v)throw new Error('AuthProvider missing');return v;}
