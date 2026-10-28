import { createContext, useContext, useEffect } from 'react';

export type MemberDetailSave = () => Promise<void>;
type RegisterSave = (key: string, order: number, save: MemberDetailSave | null) => void;

const MemberDetailSaveContext = createContext<RegisterSave | null>(null);

export const MemberDetailSaveProvider = MemberDetailSaveContext.Provider;

export function useMemberDetailSave(key: string, order: number, dirty: boolean, save: MemberDetailSave) {
    const registerSave = useContext(MemberDetailSaveContext);
    useEffect(() => {
        registerSave?.(key, order, dirty ? save : null);
        return () => registerSave?.(key, order, null);
    }, [dirty, key, order, registerSave, save]);
}
