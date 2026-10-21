export const bookingCurrencies = [
  { value: 'CZK', label: 'CZK – česká koruna (Kč)' },
  { value: 'PLN', label: 'PLN – polský zlotý (zł)' },
  { value: 'EUR', label: 'EUR – euro (€)' },
] as const;
export type BookingCurrency = 'CZK' | 'PLN' | 'EUR';
export const bookingLanguages = [
  { value: 'cs', label: 'Čeština' },
  { value: 'pl', label: 'Polski' },
  { value: 'sk', label: 'Slovenčina' },
  { value: 'en', label: 'English' },
] as const;
export type BookingLanguage = 'cs' | 'pl' | 'sk' | 'en';
export const isBookingLanguage = (x: unknown): x is BookingLanguage =>
  typeof x === 'string' && bookingLanguages.some(language => language.value === x);
