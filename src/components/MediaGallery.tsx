import { safeErrorMessage } from '../lib/errors';
import { UiError } from '../lib/errors';
import { tr } from '../lib/translations';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Star, Trash2 } from 'lucide-react';
import { api, json, mediaImages, orgPath } from '../lib/api';
import type { ImageInfo } from '../lib/types';
import { Button, Empty, ErrorState, Loading } from './UI';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { useMemberDetailSave } from './MemberDetailSaveContext';

interface PendingUpload {
    key: string;
    file: File;
    url: string;
}

export function MediaGallery({ org, kind, target, single = false, saveManagedExternally = false, onSaved }: {
    org: number;
    kind: string;
    target: number;
    single?: boolean;
    saveManagedExternally?: boolean;
    onSaved?: () => void;
}) {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const notify=useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const uploadSequence = useRef(0);
    const uploadUrls = useRef(new Set<string>());
    const [uploads, setUploads] = useState<PendingUpload[]>([]);
    const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
    const [primaryKey, setPrimaryKey] = useState<string | null>(null);
    const key = ['media', org, kind, target];
    const { data, isLoading, error: queryError } = useQuery({ queryKey: key, queryFn: () => mediaImages(org, kind, target), retry: false });
    const serverPrimary = data?.find(image => image.primary);
    const serverPrimaryKey = serverPrimary ? String(serverPrimary.id) : null;
    const selectedPrimaryKey = primaryKey ?? serverPrimaryKey;
    const images = (data ?? []).filter(image => !removedIds.has(image.id));
    const dirty = uploads.length > 0 || removedIds.size > 0 || selectedPrimaryKey !== serverPrimaryKey;

    useEffect(() => () => {
        uploadUrls.current.forEach(url => URL.revokeObjectURL(url));
        uploadUrls.current.clear();
    }, []);

    const releaseUpload = (upload: PendingUpload) => {
        URL.revokeObjectURL(upload.url);
        uploadUrls.current.delete(upload.url);
    };
    const save = useMutation({ mutationFn: async () => {
            const requestedPrimaryKey = selectedPrimaryKey;
            const nextSortOrder = Math.max(-1, ...(data ?? []).map(image => image.sortOrder)) + 1;
            for (const [index, upload] of uploads.entries()) {
                if (!['image/jpeg', 'image/png'].includes(upload.file.type))
                    throw new UiError('Use JPEG or PNG.');
                if (upload.file.size > 10 * 1024 * 1024)
                    throw new UiError('The file exceeds 10 MB.');
                const body = new FormData();
                body.append('file', upload.file);
                const image = await api<ImageInfo>(`${orgPath(org)}/media`, { method: 'POST', body });
                const makePrimary = single || requestedPrimaryKey === upload.key;
                try {
                    await api(`${orgPath(org)}/images/${kind}/${target}`, json('POST', {
                        mediaId: image.id,
                        sortOrder: nextSortOrder + index,
                        primary: makePrimary,
                    }));
                }
                catch (attachError) {
                    try {
                        await api(`${orgPath(org)}/media/${image.id}`, { method: 'DELETE' });
                    }
                    catch (cleanupError) {
                        throw new UiError(`${safeErrorMessage(attachError)} Uploaded file cleanup failed: ${safeErrorMessage(cleanupError)}`);
                    }
                    throw attachError;
                }
                setUploads(current => current.filter(item => item.key !== upload.key));
                releaseUpload(upload);
                if (makePrimary)
                    setPrimaryKey(null);
            }
            if (!single && requestedPrimaryKey && requestedPrimaryKey !== serverPrimaryKey
                && !uploads.some(upload => upload.key === requestedPrimaryKey)) {
                const image = images.find(item => String(item.id) === requestedPrimaryKey);
                if (image) {
                    await api(`${orgPath(org)}/images/${kind}/${target}`, json('POST', {
                        mediaId: image.id,
                        sortOrder: image.sortOrder,
                        primary: true,
                    }));
                    setPrimaryKey(null);
                }
            }
            for (const image of (data ?? []).filter(item => removedIds.has(item.id) && !(single && uploads.length > 0))) {
                await api(`${orgPath(org)}/images/${kind}/${target}/${image.id}`, { method: 'DELETE' });
                setRemovedIds(current => {
                    const next = new Set(current);
                    next.delete(image.id);
                    return next;
                });
            }
        }, onSuccess: async () => {
            if (!saveManagedExternally)
                notify(tr('Photo changes saved successfully.'));
            setPrimaryKey(null);
            setRemovedIds(new Set());
            await qc.invalidateQueries({ queryKey: key });
            if (!saveManagedExternally)
                onSaved?.();
        }, onError: async e => {
            if (!saveManagedExternally)
                notify(safeErrorMessage(e),'error');
            await qc.invalidateQueries({ queryKey: key });
        } });
    useMemberDetailSave(`media-${kind}-${target}`, 2, saveManagedExternally && dirty, async () => { await save.mutateAsync(); });
    const addUpload = (file: File) => {
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            notify(tr('Use JPEG or PNG.'),'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            notify(tr('The file exceeds 10 MB.'),'error');
            return;
        }
        const upload = { key: `upload-${uploadSequence.current++}`, file, url: URL.createObjectURL(file) };
        uploadUrls.current.add(upload.url);
        if (single) {
            uploads.forEach(releaseUpload);
            setUploads([upload]);
        }
        else
            setUploads(current => [...current, upload]);
        if (single || (images.length === 0 && uploads.length === 0))
            setPrimaryKey(upload.key);
    };
    const removeUpload = (upload: PendingUpload) => {
        setUploads(current => current.filter(item => item.key !== upload.key));
        releaseUpload(upload);
        if (selectedPrimaryKey === upload.key)
            setPrimaryKey(images[0] ? String(images[0].id) : uploads.find(item => item.key !== upload.key)?.key ?? null);
    };
    const removeImage = async (image: ImageInfo) => {
        if (!await confirm(tr(single ? 'Remove organization logo?' : 'Remove photo?')))
            return;
        setRemovedIds(current => new Set(current).add(image.id));
        if (selectedPrimaryKey === String(image.id))
            setPrimaryKey(images.find(item => item.id !== image.id) ? String(images.find(item => item.id !== image.id)!.id) : uploads[0]?.key ?? null);
    };
    return <div className={`media-section ${single ? 'media-single' : ''}`}>
        <div className="section-heading"><div><h3>{single ? tr('Organization logo') : tr('Organization photos')}</h3><p>{single ? tr('Upload one logo to show on the public booking page.') : tr('Photos are shown on the public booking page, with the primary photo first.')}</p><p className="muted small">{tr('JPEG or PNG up to 10 MB. Images are securely uploaded through the backend.')}</p></div><Button type="button" variant="secondary" disabled={save.isPending} onClick={() => fileRef.current?.click()}><ImagePlus size={17}/>{single ? tr('Upload logo') : tr('Upload image')}</Button></div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file)
                addUpload(file);
            event.currentTarget.value = '';
        }}/>
        {isLoading ? <Loading/> : queryError ? <ErrorState error={queryError}/> : !images.length && !uploads.length ? <Empty title={single ? tr('No logo yet') : tr('No photos yet')} description={single ? tr('No organization logo has been uploaded yet.') : tr('No photo has been added yet. You can upload one later.')}/> : <div className={`media-grid ${single ? 'media-logo-grid' : ''}`}>
            {images.map(image => <div key={image.id} className="media-tile"><img src={image.url} alt={single ? tr('Organization logo') : tr('Photos')} loading="lazy"/><div className="media-actions">{selectedPrimaryKey === String(image.id) ? <span className="primary-label"><Star size={13} fill="currentColor"/>{tr(single ? 'Organization logo' : 'Primary')}</span> : !single ? <button type="button" title={tr('Set as primary')} disabled={save.isPending} onClick={() => setPrimaryKey(String(image.id))}><Star size={16}/></button> : null}<button type="button" title={tr('Remove photo')} disabled={save.isPending} onClick={() => void removeImage(image)}><Trash2 size={16}/></button></div></div>)}
            {uploads.map(upload => <div key={upload.key} className="media-tile"><img src={upload.url} alt={tr('Photos')}/><div className="media-actions">{selectedPrimaryKey === upload.key ? <span className="primary-label"><Star size={13} fill="currentColor"/>{tr(single ? 'Organization logo' : 'Primary')}</span> : !single ? <button type="button" title={tr('Set as primary')} disabled={save.isPending} onClick={() => setPrimaryKey(upload.key)}><Star size={16}/></button> : null}<button type="button" title={tr('Remove photo')} disabled={save.isPending} onClick={() => removeUpload(upload)}><Trash2 size={16}/></button></div></div>)}
        </div>}
        {!saveManagedExternally && <div className="form-actions"><Button type="button" loading={save.isPending} disabled={!dirty || isLoading || !!queryError} onClick={() => save.mutate()}>{tr('Save changes')}</Button></div>}
    </div>;
}
