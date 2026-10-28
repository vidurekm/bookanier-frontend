import addressFormatter from '@fragaria/address-formatter';

export function formatGeocodedAddress(address: string, details?: Record<string, string>): string {
    if (!details?.country_code) return address;
    const isoRegion = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;
    const clean = Object.fromEntries(Object.entries(details).filter(([key, value]) => !key.toUpperCase().startsWith('ISO3166') && !isoRegion.test(value)));
    const parts = addressFormatter.format(clean, { output: 'array' }).filter(part => !isoRegion.test(part.trim()));
    return parts.join(', ') || address;
}
