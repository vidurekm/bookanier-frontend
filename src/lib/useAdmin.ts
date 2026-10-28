import { useOutletContext } from 'react-router-dom';
import type { Organization } from './types';

export function useAdmin() {
    return useOutletContext<{
        orgId: number;
        org?: Organization;
    }>();
}
