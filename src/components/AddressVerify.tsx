import { useState } from 'react';
import { MapPin, Search, ExternalLink } from 'lucide-react';
import { orgApi } from '../lib/api';
import { safeErrorMessage } from '../lib/errors';
import { tr } from '../lib/translations';
import { Button, Notice } from './UI';

export interface GeoResult { address: string; latitude: number; longitude: number }
export function mapUrl(latitude: number, longitude: number) {
  const lat = Number(latitude), lon = Number(longitude);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}
export function mapEmbedUrl(latitude: number, longitude: number) {
  const lat=Math.max(-85,Math.min(85,Number(latitude)));
  const lon=Number(longitude);
  const params=new URLSearchParams({
    bbox:[lon-.006,lat-.003,lon+.006,lat+.003].join(','),
    layer:'mapnik', marker:`${lat},${lon}`
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
export function AddressVerify({ org, address, latitude, longitude, onSelect }: {
  org: number; address: string; latitude?: number | null; longitude?: number | null;
  onSelect: (result: GeoResult) => void;
}) {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function verify() {
    if (address.trim().length < 5) { setError(tr('Zadejte úplnější adresu včetně obce.')); return; }
    setBusy(true); setError(''); setResults([]);
    try {
      const matches = await orgApi<GeoResult[]>(org, `/geocoding/address?address=${encodeURIComponent(address.trim())}`);
      setResults(matches);
      if (!matches.length) setError(tr('Adresu se nepodařilo najít. Doplňte město a číslo domu nebo zkuste jiný zápis.'));
    } catch (e) { setError(safeErrorMessage(e)); }
    finally { setBusy(false); }
  }
  const hasPosition = latitude != null && longitude != null;
  return <div className="address-verify">
    <Button variant="secondary" loading={busy} onClick={verify}><Search size={16}/>{tr('Ověřit adresu na mapě')}</Button>
    <Notice message={error}/>
    {results.length > 0 && <div className="geo-choices"><strong>{tr('Vyberte správné místo:')}</strong>{results.map((result,i)=><button key={`${result.latitude}:${result.longitude}:${i}`} type="button" onClick={()=>{onSelect(result);setResults([]);setError('');}}><MapPin size={15}/>{result.address}</button>)}</div>}
    {hasPosition && <p className="geo-confirmed"><MapPin size={16}/> {tr('Poloha vybrána')} ({Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}) <a href={mapUrl(latitude,longitude)} target="_blank" rel="noopener noreferrer">{tr('Otevřít mapu')} <ExternalLink size={14}/></a></p>}
    {hasPosition && <iframe className="geo-map-preview" title="Poloha pobočky na mapě" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={mapEmbedUrl(latitude, longitude)} />}
    <small className="muted">{tr('Geokódování určuje polohu podle mapových dat, neověřuje oficiální doručitelnost adresy.')} © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>.</small>
  </div>;
}
