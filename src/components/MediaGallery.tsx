import { safeErrorMessage } from '../lib/errors';
import { UiError } from '../lib/errors';
import { tr } from '../lib/translations';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Star, Trash2 } from 'lucide-react';
import { api, json, mediaImages, orgPath } from '../lib/api';
import type { ImageInfo } from '../lib/types';
import { Button, Empty, ErrorState, Loading, Notice } from './UI';
import { useConfirm } from '../contexts/ConfirmContext';
export function MediaGallery({ org, kind, target, single = false }: {
    org: number;
    kind: string;
    target: number;
    single?: boolean;
}) {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const key = ['media', org, kind, target];
    const { data, isLoading, error: queryError } = useQuery({ queryKey: key, queryFn: () => mediaImages(org, kind, target), retry: false });
    const mutation = useMutation({ mutationFn: async (file: File) => {
            if (!['image/jpeg', 'image/png'].includes(file.type))
                throw new UiError('Use JPEG or PNG.');
            if (file.size > 10 * 1024 * 1024)
                throw new UiError('The file exceeds 10 MB.');
            const body = new FormData();
            body.append('file', file);
            const image = await api<ImageInfo>(`${orgPath(org)}/media`, { method: 'POST', body });
            try {
                await api(`${orgPath(org)}/images/${kind}/${target}`, json('POST', { mediaId: image.id, sortOrder: (data?.length || 0), primary: single || !data?.length }));
            }
            catch (e) {
                await api(`${orgPath(org)}/media/${image.id}`, { method: 'DELETE' }).catch(() => { });
                throw e;
            }
        }, onSuccess: () => { setError(tr("")); setSuccess(tr("Image uploaded.")); qc.invalidateQueries({ queryKey: key }); }, onError: (e) => setError(safeErrorMessage(e)) });
    const action = useMutation({ mutationFn: async ({ image, mode }: {
            image: ImageInfo;
            mode: 'primary' | 'remove';
        }) => {
            if (mode === 'remove')
                await api(`${orgPath(org)}/images/${kind}/${target}/${image.id}`, { method: 'DELETE' });
            else
                await api(`${orgPath(org)}/images/${kind}/${target}`, json('POST', { mediaId: image.id, sortOrder: image.sortOrder, primary: true }));
        }, onSuccess: () => { qc.invalidateQueries({ queryKey: key }); setError(tr("")); }, onError: (e) => setError(safeErrorMessage(e)) });
    return <div className={`media-section ${single ? 'media-single' : ''}`}><div className="section-heading"><div><h3>{single ? tr("Organization logo") : tr("Organization photos")}</h3><p>{single ? tr("Upload one logo to show on the public booking page.") : tr("Photos are shown on the public booking page, with the primary photo first.")}</p><p className="muted small">{tr("JPEG or PNG up to 10 MB. Images are securely uploaded through the backend.")}</p></div><Button variant="secondary" loading={mutation.isPending} onClick={() => fileRef.current?.click()}><ImagePlus size={17}/>{single ? tr("Upload logo") : tr("Upload image")}</Button></div>
    <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={e => { const f = e.target.files?.[0]; if (f)
        mutation.mutate(f); e.currentTarget.value = ''; }}/>
    <Notice message={error}/><Notice message={success} kind="success"/>
    {isLoading ? <Loading /> : queryError ? <ErrorState error={queryError}/> : !data?.length ? <Empty title={single ? tr("No logo yet") : tr("No photos yet")} description={single ? tr("No organization logo has been uploaded yet.") : tr("No photo has been added yet. You can upload one later.")}/> : <div className={`media-grid ${single ? 'media-logo-grid' : ''}`}>{data.map(image => <div key={image.id} className="media-tile"><img src={image.url} alt={single ? tr("Organization logo") : tr("Photos")} loading="lazy"/><div className="media-actions">{image.primary ? <span className="primary-label"><Star size={13} fill="currentColor"/>{tr(single ? "Organization logo" : "Primary")}</span> : <button title={tr("Set as primary")} onClick={() => action.mutate({ image, mode: 'primary' })}><Star size={16}/></button>}<button title={tr("Remove photo")} onClick={async () => { if (await confirm(tr(single ? "Remove organization logo?" : "Remove photo?")))
        action.mutate({ image, mode: 'remove' }); }}><Trash2 size={16}/></button></div></div>)}</div>}
    {!single && <p className="muted small"><Camera size={14}/>{tr("Removing a photo unlinks it. You can delete the unused file later in media management.")}</p>}
  </div>;
}
