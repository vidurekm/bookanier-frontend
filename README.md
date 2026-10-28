# Bookanear – V6: onboarding, rezervace událostí a tmavý vzhled

Nové funkce a migrační instrukce jsou v kořenovém souboru `README_BOOKANEAR_V2.md` v kompletním ZIPu.

> Bookanear: oficiální logo, CZ/SK/PL/EN, volitelná barevná témata administrace a lokalizované bezpečné chyby API. Souhrn změn je v `../README_BOOKANEAR.md`.

# Bookanear – frontend pro bookanear-api

React 18 + TypeScript + Vite + TanStack Query + React Router + Lucide, vlastní responzivní CSS. Čeština, veřejná rezervace a backoffice. Frontend navazuje na skutečné endpointy dodaného Spring Boot projektu; kompletní aktualizovaný backend je v sousední složce `../bookanear-api`.

## Rychlé spuštění ve Windows (PowerShell)

```powershell
cd bookanear-frontend
npm install
npm run dev
```

Otevři **http://localhost:5173**. Backend Spring Boot musí běžet na **http://localhost:8080**. Vite proxyuje všechny `/api/*` požadavky na backend, takže není nutné nastavovat CORS.

Lokální nastavení Vite je v ignorovaném souboru `.env.local` (`VITE_API_PROXY_TARGET` a volitelně `VITE_PUBLIC_ORG_ID`). Pokud Spring Boot běží na jiném portu, změň proxy target a restartuj Vite.

## Backendová integrace

Formuláře zachovávají HTML validační pravidla, ale místo systémových bublin
prohlížeče zobrazují lokalizovanou chybu pod polem. Společná obsluha v
`src/lib/formValidation.ts` pokrývá také nativní pole a modální formuláře,
označí neplatné pole pro čtečky a přesune fokus na první chybu.

Ověření adresy pobočky používá strukturovaná data Nominatimu a lokální šablony
`@fragaria/address-formatter` (OpenCage) podle země nalezeného místa. Po výběru
výsledku se uloží adresa v místním poštovním formátu na jednom řádku a souřadnice,
nikoli dlouhý administrativní popis `display_name`. Platí pro průvodce i správu
poboček; adresy se neposílají další formátovací službě. Formátování nepotvrzuje
poštovní doručitelnost a závisí na úplnosti dat OpenStreetMap.

Všechny potřebné backendové doplňky (veřejný katalog, kalendář, přiřazení poboček a strojové kódy chyb) jsou již součástí sousedního projektu `bookanear-api/`. Není potřeba aplikovat další ZIPy.

Nové endpointy:

- `GET /api/v1/public/organizations/{publicId}/catalog?date=YYYY-MM-DD` – veřejné pobočky, služby, cenové verze a pracovníci.
- `GET /api/v1/public/organizations/{publicId}/slots?locationId=…&serviceId=…&date=…&partySize=…` – **orientační** volné začátky. Rezervační služba vše znovu ověřuje.
- `GET /api/v1/backoffice/organizations/{org}/calendar?from=…&to=…&locationId=…` – kalendář podle **data služby** (původní `/reservations` filtruje datum vytvoření).
- `GET/PUT /api/v1/backoffice/organizations/{org}/locations/{loc}/services` – přiřazení služeb pobočce.
- `GET/PUT /api/v1/backoffice/organizations/{org}/members/{member}/locations` – přiřazení zaměstnance pobočkám.

Backend používá existující tabulky z V1–V5 a zachovává přístupové kontroly přes `OrganizationSecurity`. Změna značky nevyžaduje novou SQL migraci.

## Postup nastavení organizace

1. Zaregistruj organizaci na `/registrace`, potvrď e-mail a přihlas se na `/prihlaseni`.
2. **Pobočky:** vytvoř pobočku, nastav otevírací dobu, přiřaď jí služby.
3. **Služby:** vytvoř službu, přidej cenovou verzi platnou pro zvolené datum, případně požadavky na zdroje.
4. **Tým:** v průvodci nastavením zadej každému členovi týmu jméno a e-mail. Dokončení nastavení vyžaduje platný, jedinečný e-mail a odešle členu 24hodinovou pozvánku navázanou na jeho nastavenou roli a rozvrh. Nový pracovník vytvoří účet při přijetí, zatímco existující uživatel se přihlásí a připojí stejný účet. Další pracovníky lze pozvat také ve správě týmu. Jeden účet může přepínat mezi všemi svými organizacemi. Poté pracovníkovi přiřaď pobočky, služby a týdenní směny. Pokud služba vyžaduje pracovníka, vytvoř také `staff` resource s jeho `memberId`.
5. **Zdroje:** vytvoř typy zdrojů a konkrétní vybavení/prostory na pobočkách. U služby nastav požadované typy a množství.
6. **Nastavení:** zkopíruj veřejný odkaz `/rezervace/{public_id}`. Rezervace bez přihlášení vytvoří zákazník přes `/api/v1/bookings/universal` nebo starší `/api/v1/bookings`.

**Pozor:** Bez přiřazení služby k pobočce (`location_services`) nebo bez platné cenové verze (`service_versions`) se služba ve veřejném katalogu nezobrazí. U klasické rezervace bez resource requirements musí být pracovník přiřazen pobočce i službě a mít pracovní rozvrh.

## Co je hotové

Komponenty administrace a jejich dialogy sdileji v `src/styles.css` barevne tokeny
`--surface`, `--surface-control`, `--text`, `--text-muted` a `--accent-text`.
Dekorativni zvyrazneni pouziva zvoleny motiv i v tmavem vzhledu; chyby, uspechy
a stavy rezervaci si zachovavaji vyznamove barvy. Kontrast textu a zvyrazneni
pro vsech sest motivu overuje `node --test tests/component-themes.test.cjs`.

- Úvodní prezentační stránka.
- Přihlášení přes JWT, registrace organizace, ověření e-mailu.
- Administrace: přehled, kalendář podle termínů, rezervace s detailem, pobočky, otevírací doba, služby, cenové verze, resource requirements, zaměstnanci, přiřazení poboček/služeb, směny, typy zdrojů, zdroje, zákazníci, nastavení organizace.
- V dialozích je uložení dostupné až po změně hodnot. Návrat k původním hodnotám tlačítko opět deaktivuje; přepínání záložek se za změnu nepovažuje.
- Nahrávání a přiřazování obrázků (organizace, pobočka, služba, zaměstnanec, zdroj, typ zdroje) přes existující Media API a Cloudflare R2.
- Veřejný rezervační průvodce: pobočka → služba → datum/čas → kontakt → potvrzení; kapacita osob pro prostory, počet kusů pro vybavení, délka pronájmu pro CUSTOM služby.
- Veřejná správa rezervace přes token: detail a storno.
- Responzivní rozhraní v češtině, stránkování, filtry, validace formulářů a chybové stavy.

## Důležitá omezení

- **Neproběhlo end-to-end testování proti živé databázi**; veřejné sloty jsou orientační a server může při finálním vytvoření rezervaci zamítnout. U CUSTOM půjčoven se kontrola návratového času a zdrojů provádí až při potvrzení.
- Původní API nemá backoffice endpoint na ruční storno/potvrzení, proto je administrativní detail rezervace **jen pro čtení**. Veřejné storno funguje přes tajný token. Univerzální rezervace nelze v původním backendu přesouvat.
- Ceny pronájmu a více kusů jsou podle aktuální backendové logiky **paušální za službu**, nikoli automaticky za den/kus.
- Pro založení uživatele s přihlášením backend zatím nemá kompletní backoffice workflow. Vytvořený zaměstnanec je záznam bez uživatelského účtu.
- `GET /backoffice/organizations` vrací běžným uživatelům pouze jejich organizace (majitel/admin); zaměstnanec může potřebovat zadat ID organizace ručně.
- Pro přístup k médiím musí být `MEDIA_ENABLED=true`, správný S3 endpoint/klíče a migrace V5. V konfiguraci backendu je název proměnné **`MEDIA_BUCKET`**, ne `MEDIA_S3_BUCKET`.
- Pro produkci doporučuji TLS, rate limiting veřejných rezervací, monitoring, správu tajných klíčů a pravidelné zálohy databáze. JWT se drží v `sessionStorage` pouze po dobu karty; nepoužívej v URL ani v konzoli.

## Cloudflare R2 v backendu

V proměnných prostředí procesu Spring Boot:

```dotenv
MEDIA_ENABLED=true
MEDIA_BUCKET=booking
MEDIA_S3_ENDPOINT=https://TVE_ACCOUNT_ID.r2.cloudflarestorage.com
MEDIA_S3_REGION=auto
MEDIA_S3_ACCESS_KEY=TVUJ_NOVY_ACCESS_KEY
MEDIA_S3_SECRET_KEY=TVUJ_NOVY_SECRET_KEY
```

**Neukládej skutečné R2 přístupové údaje do frontendového `.env`, JavaScriptu ani Gitu.** Klíče z dřívějšího chatu doporučuji zneplatnit a vytvořit nové.

## Produkční Docker

Součástí projektu je `Dockerfile` (Node build + Nginx) a `nginx/default.conf.template` pro SPA routing a `/api` reverse proxy. Příklad pro existující Compose síť:

```yaml
services:
  frontend:
    build: ./bookanear-frontend
    environment:
      API_UPSTREAM: bookanear-api:8080
    ports:
      - "5173:80"
```

`API_UPSTREAM` musí odpovídat názvu služby Spring Boot ve stejné Docker síti. V produkci použij HTTPS před Nginxem.

## Ověření

- **Java 21:** doplněk backendu úspěšně zkompilován s dostupnými Spring knihovnami a zdrojovými soubory ze ZIPu; S3 třídy vyžadují AWS SDK z Maven buildu.
- **Frontend:** TS/TSX syntaxe zkontrolována. `npm install` v tomto prostředí nebylo možné dokončit kvůli nedostupnosti npm registry (`EAI_AGAIN`), proto **nelze tvrdit, že `npm run build` nebo UI integrační testy byly spuštěny**. Spusť je lokálně po instalaci balíčků.
