import { safeErrorMessage } from '../lib/errors';
import { UiError } from '../lib/errors';
import { tr } from '../lib/translations';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Star, Trash2 } from 'lucide-react';
import { api, json, mediaImages, orgPath } from '../lib/api';
import type { ImageInfo } from '../lib/types';
import { Button, Empty, ErrorState, Loading, Notice } from './UI';
export function MediaGallery({ org, kind, target }: {
    org: number;
    kind: string;
    target: number;
}) {
    const qc = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const key = ['media', org, kind, target];
    const { data, isLoading, error: queryError } = useQuery({ queryKey: key, queryFn: () => mediaImages(org, kind, target), retry: false });
    const mutation = useMutation({ mutationFn: async (file: File) => {
            if (!['image/jpeg', 'image/png'].includes(file.type))
                throw new UiError('Použij JPEG nebo PNG.');
            if (file.size > 10 * 1024 * 1024)
                throw new UiError('Soubor je větší než 10 MB.');
            const body = new FormData();
            body.append('file', file);
            const image = await api<ImageInfo>(`${orgPath(org)}/media`, { method: 'POST', body });
            try {
                await api(`${orgPath(org)}/images/${kind}/${target}`, json('POST', { mediaId: image.id, sortOrder: (data?.length || 0), primary: !data?.length }));
            }
            catch (e) {
                await api(`${orgPath(org)}/media/${image.id}`, { method: 'DELETE' }).catch(() => { });
                throw e;
            }
        }, onSuccess: () => { setError(tr("")); setSuccess(tr("Obr\u00E1zek byl nahr\u00E1n.")); qc.invalidateQueries({ queryKey: key }); }, onError: (e) => setError(safeErrorMessage(e)) });
    const action = useMutation({ mutationFn: async ({ image, mode }: {
            image: ImageInfo;
            mode: 'primary' | 'remove';
        }) => {
            if (mode === 'remove')
                await api(`${orgPath(org)}/images/${kind}/${target}/${image.id}`, { method: 'DELETE' });
            else
                await api(`${orgPath(org)}/images/${kind}/${target}`, json('POST', { mediaId: image.id, sortOrder: image.sortOrder, primary: true }));
        }, onSuccess: () => { qc.invalidateQueries({ queryKey: key }); setError(tr("")); }, onError: (e) => setError(safeErrorMessage(e)) });
    return <div className="media-section"><div className="section-heading"><div><h3>{tr("Fotografie")}</h3><p>{tr("JPEG nebo PNG do 10 MB. Obr\u00E1zky se bezpe\u010Dn\u011B ukl\u00E1daj\u00ED p\u0159es backend.")}</p></div><Button variant="secondary" loading={mutation.isPending} onClick={() => fileRef.current?.click()}><ImagePlus size={17}/>{tr("Nahr\u00E1t obr\u00E1zek")}</Button></div>
    <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={e => { const f = e.target.files?.[0]; if (f)
        mutation.mutate(f); e.currentTarget.value = ''; }}/>
    <Notice message={error}/><Notice message={success} kind="success"/>
    {isLoading ? <Loading /> : queryError ? <ErrorState error={queryError}/> : !data?.length ? <Empty title={tr("Zat\u00EDm \u017E\u00E1dn\u00E9 fotografie")} description={tr("Nahraj prvn\u00ED fotografii tohoto z\u00E1znamu.")}/> : <div className="media-grid">{data.map(image => <div key={image.id} className="media-tile"><img src={image.url} alt={tr("Fotografie")} loading="lazy"/><div className="media-actions">{image.primary ? <span className="primary-label"><Star size={13} fill="currentColor"/>{tr("Hlavn\u00ED")}</span> : <button title={tr("Nastavit jako hlavn\u00ED")} onClick={() => action.mutate({ image, mode: 'primary' })}><Star size={16}/></button>}<button title={tr("Odebrat fotografii")} onClick={() => { if (confirm(tr("Odebrat fotografii?")))
        action.mutate({ image, mode: 'remove' }); }}><Trash2 size={16}/></button></div></div>)}</div>}
    <p className="muted small"><Camera size={14}/>{tr("P\u0159i odebr\u00E1n\u00ED se odstran\u00ED vazba fotografie. Nepou\u017E\u00EDvan\u00FD soubor lze n\u00E1sledn\u011B odstranit ve spr\u00E1v\u011B m\u00E9di\u00ED.")}</p>
  </div>;
}
