import { currentLanguage, type Language } from './preferences';

// Czech UI text acts as the stable lookup key for this version of the application.
// User input and API error messages are NEVER translated or rendered through this dictionary.
const translations: Record<string, [string, string, string]> = {
  'Stůl':['Stôl','Stół','Table'],
  'Křeslo':['Kreslo','Fotel','Chair'],
  'Nářadí':['Náradie','Narzędzia','Tools'],
  "Uložit nový termín": ["Uložiť nový termín", "Zapisz nowy termin", "Save new time"],
  "Vyberte nové datum a čas. Před uložením ověříme volný termín pracovníka.": ["Vyberte nový dátum a čas. Pred uložením overíme dostupnosť pracovníka.", "Wybierz nową datę i godzinę. Przed zapisem sprawdzimy dostępność pracownika.", "Choose a new date and time. We will check staff availability before saving."],
  "Přesunout termín": ["Presunúť termín", "Przenieś termin", "Reschedule booking"],
  "Rezervační odkaz zatím není k dispozici.": ["Rezervačný odkaz zatiaľ nie je k dispozícii.", "Link do rezerwacji nie jest jeszcze dostępny.", "The booking link is not available yet."],
  "Přidejte vybavení nebo osoby, které jsou pro službu potřeba. Kapacita se při rezervaci automaticky kontroluje.": ["Pridajte vybavenie alebo osoby potrebné pre službu. Dostupnosť sa pri rezervácii kontroluje.", "Dodaj sprzęt lub osoby potrzebne do usługi. Dostępność zostanie sprawdzona przy rezerwacji.", "Add the equipment or people a service needs. Availability is checked when booking."],
  "Ceníky se nesmějí časově překrývat. Nejdříve ukončete platnost předchozí ceny.": ["Cenníky sa nesmú časovo prekrývať. Najskôr ukončite platnosť predchádzajúcej ceny.", "Okresy ważności cenników nie mogą się nakładać. Najpierw zakończ poprzednią cenę.", "Pricing periods cannot overlap. End the previous price first."],
  "Zadejte platný rezervační odkaz.": ["Zadajte platný rezervačný odkaz.", "Wprowadź poprawny link do rezerwacji.", "Enter a valid booking link."],
  "Zatím zde nejsou k dispozici žádné služby. Zkuste jinou pobočku nebo datum.": ["Zatiaľ tu nie sú dostupné žiadne služby. Skúste inú pobočku alebo dátum.", "Nie ma jeszcze dostępnych usług. Wybierz inną lokalizację lub datę.", "There are no services available yet. Try another location or date."],
  "Rezervační stránku se nepodařilo načíst. Zkuste to prosím později.": ["Rezervačnú stránku sa nepodarilo načítať. Skúste to neskôr.", "Nie udało się załadować strony rezerwacji. Spróbuj później.", "The booking page could not be loaded. Please try again later."],
  "Změna měny nepřepočítává již uložené ceny. Cenu a měnu existující služby změníte vytvořením nové cenové verze.": ["Zmena meny neprepočítava existujúce ceny. Novú cenu a menu nastavíte v novej cenovej verzii.", "Zmiana waluty nie przelicza dotychczasowych cen. Nową cenę i walutę ustawisz w nowej wersji cennika.", "Changing currency will not convert existing prices. Add a new price version for an existing service."],
  "Výchozí měna pro nové služby": ["Predvolená mena pre nové služby", "Domyślna waluta nowych usług", "Default currency for new services"],
  "Pokud výběr pracovníka vypnete, aplikace přiřadí volného pracovníka automaticky. Toto je jiné nastavení než výběr vybavení nebo místnosti.": ["Ak výber pracovníka vypnete, systém automaticky pridelí dostupnú osobu. Výber vybavenia sa nastavuje samostatne.", "Po wyłączeniu wyboru system automatycznie przydzieli dostępnego pracownika. Wybór sprzętu to osobne ustawienie.", "When staff selection is disabled, an available worker is assigned automatically. Equipment selection is configured separately."],
  "Zákazník si může zvolit konkrétního pracovníka": ["Zákazník si môže vybrať konkrétneho pracovníka", "Klient może wybrać konkretnego pracownika", "Customers can choose a specific staff member"],
  "Zákazník si může vybrat konkrétní vybavení nebo prostor": ["Zákazník si môže vybrať konkrétne vybavenie alebo priestor", "Klient może wybrać konkretny sprzęt lub pomieszczenie", "Customers can choose specific equipment or a room"],
  "Automaticky podle dostupnosti": ["Automaticky podľa dostupnosti", "Automatycznie według dostępności", "Automatically by availability"],
  "Bez uvedení důvodu": ["Bez uvedenia dôvodu", "Bez podania powodu", "No reason given"],
  "Dokončit": ["Dokončiť", "Zakończ", "Complete"],
  "Důvod (volitelné)": ["Dôvod (nepovinné)", "Powód (opcjonalnie)", "Reason (optional)"],
  "E-mail zákazníka (nepovinné)": ["E-mail zákazníka (nepovinné)", "E-mail klienta (opcjonalnie)", "Customer email (optional)"],
  "Každý přihlášený pracovník vidí své rezervace. Oprávnění níže mu umožní pomáhat kolegům bez přístupu do veškerého nastavení.": ["Každý prihlásený pracovník vidí svoje rezervácie. Vybrané oprávnenia umožňujú pomáhať kolegom bez plného prístupu.", "Każdy zalogowany pracownik widzi swoje rezerwacje. Poniższe uprawnienia pozwalają pomagać innym bez pełnego dostępu administracyjnego.", "Every signed-in employee sees their bookings. These permissions allow helping colleagues without full admin access."],
  "Může si sám schvalovat volno a změny směn": ["Môže si sám schvaľovať voľno a zmeny smien", "Może sam zatwierdzać urlopy i zmiany grafiku", "Can approve own time off and shift changes"],
  "Může vytvářet rezervace a spravovat rezervace kolegů": ["Môže vytvárať a spravovať rezervácie kolegov", "Może tworzyć i zarządzać rezerwacjami współpracowników", "Can create and manage team bookings"],
  "Nová žádost": ["Nová žiadosť", "Nowy wniosek", "New request"],
  "Odebrat interval": ["Odobrať interval", "Usuń przedział", "Remove interval"],
  "Odeslat žádost": ["Odoslať žiadosť", "Wyślij wniosek", "Submit request"],
  "Opravdu zrušit tuto rezervaci?": ["Naozaj zrušiť túto rezerváciu?", "Czy na pewno anulować rezerwację?", "Are you sure you want to cancel this booking?"],
  "Oprávnění pro každodenní provoz": ["Oprávnenia na každodennú prevádzku", "Uprawnienia do codziennej pracy", "Day-to-day permissions"],
  "Potvrdit": ["Potvrdiť", "Potwierdź", "Confirm"],
  "Pracovník": ["Pracovník", "Pracownik", "Staff member"],
  "Pracovník požádá o volno nebo kratší směnu. Změna se projeví až po schválení, pokud nemá povolené vlastní schvalování.": ["Pracovník požiada o voľno alebo kratšiu zmenu. Zmena sa uplatní až po schválení, ak nemá vlastné schvaľovanie.", "Pracownik prosi o wolne lub krótszą zmianę. Zmiana zacznie obowiązywać po zatwierdzeniu, chyba że może zatwierdzać własne wnioski.", "Employees request time off or shorter shifts. Changes apply only after approval unless self-approval is enabled."],
  "Před uložením se znovu ověří dostupnost služby a pracovníka. Rezervace jiných kolegů nelze překrýt.": ["Pred uložením sa overí dostupnosť služby a pracovníka. Rezervácie sa nesmú prekrývať.", "Przed zapisem system ponownie sprawdzi dostępność usługi i pracownika. Rezerwacje nie mogą się pokrywać.", "Availability is checked before saving. Team bookings cannot overlap."],
  "Přidat interval": ["Pridať interval", "Dodaj przedział", "Add interval"],
  "Přihlašovací účet pracovníka se připojuje samostatně. Vlastník a administrátor mají oprávnění ke správě automaticky.": ["Prihlasovací účet pracovníka sa pripája samostatne. Vlastník a administrátor majú práva automaticky.", "Konto logowania pracownika łączy się osobno. Właściciel i administrator mają uprawnienia automatycznie.", "Staff login accounts are linked separately. Owners and admins have management access automatically."],
  "Schváleno": ["Schválené", "Zatwierdzono", "Approved"],
  "Schválit": ["Schváliť", "Zatwierdź", "Approve"],
  "Správa rezervací týmu": ["Správa rezervácií tímu", "Zarządzanie rezerwacjami zespołu", "Team booking management"],
  "Telefon (nepovinné)": ["Telefón (nepovinné)", "Telefon (opcjonalnie)", "Phone (optional)"],
  "TÝM A DOSTUPNOST": ["TÍM A DOSTUPNOSŤ", "ZESPÓŁ I DOSTĘPNOŚĆ", "TEAM & AVAILABILITY"],
  "Vaše oprávnění umožňuje žádost rovnou schválit.": ["Vaše oprávnenia umožňujú okamžité schválenie.", "Twoje uprawnienia pozwalają od razu zatwierdzić wniosek.", "Your permissions allow immediate approval."],
  "Vytvořit rezervaci": ["Vytvoriť rezerváciu", "Utwórz rezerwację", "Create booking"],
  "Výchozí jazyk veřejné stránky": ["Predvolený jazyk verejnej stránky", "Domyślny język strony publicznej", "Default public page language"],
  "Výchozí měna": ["Predvolená mena", "Domyślna waluta", "Default currency"],
  "Výchozí měna se použije u nových služeb. Ceny existujících služeb se automaticky nepřepočítávají.": ["Predvolená mena platí pre nové služby. Existujúce ceny sa neprepočítavajú.", "Domyślna waluta dotyczy nowych usług. Dotychczasowe ceny nie są automatycznie przeliczane.", "Default currency applies to new services. Existing prices are not converted."],
  "Zadejte intervaly, kdy tento den pracovník bude pracovat.": ["Zadajte intervaly, kedy bude pracovník pracovať.", "Podaj godziny, w których pracownik będzie pracować tego dnia.", "Enter the hours the employee will work on this day."],
  "Zamítnout": ["Zamietnuť", "Odrzuć", "Reject"],
  "Zamítnuto": ["Zamietnuté", "Odrzucono", "Rejected"],
  "Zatím žádné žádosti.": ["Zatiaľ žiadne žiadosti.", "Brak wniosków.", "No requests yet."],
  "Změna byla uložena.": ["Zmena bola uložená.", "Zmiana zapisana.", "Change saved."],
  "Změna směny": ["Zmena smeny", "Zmiana grafiku", "Shift change"],
  "Čeká na schválení": ["Čaká na schválenie", "Oczekuje na zatwierdzenie", "Pending approval"],
  "Žádost byla odeslána.": ["Žiadosť bola odoslaná.", "Wniosek wysłany.", "Request submitted."],
  "Žádost odešlete ke schválení vedoucímu.": ["Žiadosť sa odošle vedúcemu na schválenie.", "Wniosek zostanie wysłany przełożonemu do zatwierdzenia.", "Your request will be sent to a manager for approval."],
  "Žádosti": ["Žiadosti", "Wnioski", "Requests"],
  "Žádosti o volno a změny směn": ["Žiadosti o voľno a zmeny smien", "Wnioski o wolne i zmiany grafiku", "Time off and shift change requests"],

  "Pro každý den můžeš zadat více intervalů.": [
    "Pre každý deň môžeš zadať viac intervalov.",
    "Dla każdego dnia możesz dodać kilka przedziałów.",
    "You can add multiple time intervals for each day."
  ],
  "Odebrat": [
    "Odobrať",
    "Usuń",
    "Remove"
  ],
  "Volno / zavřeno": [
    "Voľno / zatvorené",
    "Wolne / zamknięte",
    "Day off / closed"
  ],
  "Uložit rozvrh": [
    "Uložiť rozvrh",
    "Zapisz harmonogram",
    "Save schedule"
  ],
  "Backend kontroluje překryvy směn zaměstnance mezi pobočkami. Kolize se zobrazí jako chyba 409.": [
    "Server kontroluje prekrývanie zmien zamestnanca medzi pobočkami. Kolízia sa zobrazí ako chyba 409.",
    "Serwer sprawdza nakładanie się zmian pracownika w różnych lokalizacjach. Konflikt zwróci błąd 409.",
    "The server checks overlapping employee shifts across locations. A conflict returns HTTP 409."
  ],
  "PRACOVNÍ PROSTOR": [
    "PRACOVNÝ PRIESTOR",
    "PANEL PRACY",
    "WORKSPACE"
  ],
  "Potřebujete poradit?": [
    "Potrebujete poradiť?",
    "Potrzebujesz pomocy?",
    "Need help?"
  ],
  "API dokumentace": [
    "Dokumentácia API",
    "Dokumentacja API",
    "API documentation"
  ],
  "Odhlásit se": [
    "Odhlásiť sa",
    "Wyloguj się",
    "Sign out"
  ],
  "Otevřít nabídku": [
    "Otvoriť ponuku",
    "Otwórz menu",
    "Open menu"
  ],
  "Pracovní prostor": [
    "Pracovný priestor",
    "Panel pracy",
    "Workspace"
  ],
  "Vybrat organizaci": [
    "Vybrať organizáciu",
    "Wybierz organizację",
    "Select organization"
  ],
  "Vyberte organizaci": [
    "Vyberte organizáciu",
    "Wybierz organizację",
    "Choose an organization"
  ],
  "Pokud jste zaměstnanec, zadejte ID organizace. Seznam organizací je dostupný pouze majitelům a administrátorům.": [
    "Ak ste zamestnanec, zadajte ID organizácie. Zoznam organizácií je dostupný len vlastníkom a správcom.",
    "Jeśli jesteś pracownikiem, wpisz ID organizacji. Lista organizacji jest dostępna tylko dla właścicieli i administratorów.",
    "If you're an employee, enter the organization ID. Only owners and administrators can view the organization list."
  ],
  "ID organizace": [
    "ID organizácie",
    "ID organizacji",
    "Organization ID"
  ],
  "Otevřít": [
    "Otvoriť",
    "Otwórz",
    "Open"
  ],
  "Seznam organizací není pro tento účet dostupný. Můžete zadat ID ručně.": [
    "Zoznam organizácií nie je pre tento účet dostupný. ID môžete zadať ručne.",
    "Lista organizacji jest niedostępna dla tego konta. Możesz wpisać ID ręcznie.",
    "The organization list is unavailable for this account. You can enter an ID manually."
  ],
  "Změnit organizaci": [
    "Zmeniť organizáciu",
    "Zmień organizację",
    "Change organization"
  ],
  "Obrázek byl nahrán.": [
    "Obrázok bol nahraný.",
    "Zdjęcie zostało przesłane.",
    "Image uploaded."
  ],
  "Fotografie": [
    "Fotografie",
    "Zdjęcia",
    "Photos"
  ],
  "JPEG nebo PNG do 10 MB. Obrázky se bezpečně ukládají přes backend.": [
    "JPEG alebo PNG do 10 MB. Obrázky sa bezpečne ukladajú cez server.",
    "JPEG lub PNG do 10 MB. Obrazy są bezpiecznie przesyłane przez serwer.",
    "JPEG or PNG up to 10 MB. Images are securely uploaded through the backend."
  ],
  "Nahrát obrázek": [
    "Nahrať obrázok",
    "Prześlij zdjęcie",
    "Upload image"
  ],
  "Zatím žádné fotografie": [
    "Zatiaľ žiadne fotografie",
    "Brak zdjęć",
    "No photos yet"
  ],
  "Nahraj první fotografii tohoto záznamu.": [
    "Nahraj prvú fotografiu tohto záznamu.",
    "Prześlij pierwsze zdjęcie tego elementu.",
    "Upload the first photo for this item."
  ],
  "Hlavní": [
    "Hlavná",
    "Główne",
    "Primary"
  ],
  "Nastavit jako hlavní": [
    "Nastaviť ako hlavnú",
    "Ustaw jako główne",
    "Set as primary"
  ],
  "Odebrat fotografii": [
    "Odobrať fotografiu",
    "Usuń zdjęcie",
    "Remove photo"
  ],
  "Odebrat fotografii?": [
    "Odobrať fotografiu?",
    "Usunąć zdjęcie?",
    "Remove photo?"
  ],
  "Při odebrání se odstraní vazba fotografie. Nepoužívaný soubor lze následně odstranit ve správě médií.": [
    "Odstránením sa zruší priradenie fotografie. Nepoužívaný súbor môžete následne vymazať v správe médií.",
    "Usunięcie odłącza zdjęcie. Nieużywany plik można następnie usunąć w zarządzaniu mediami.",
    "Removing a photo unlinks it. You can delete the unused file later in media management."
  ],
  "Zavřít": [
    "Zavrieť",
    "Zamknij",
    "Close"
  ],
  "Vymazat": [
    "Vymazať",
    "Wyczyść",
    "Clear"
  ],
  "Předchozí": [
    "Predchádzajúca",
    "Poprzednia",
    "Previous"
  ],
  "Strana": [
    "Strana",
    "Strona",
    "Page"
  ],
  "z": [
    "z",
    "z",
    "of"
  ],
  "Další": [
    "Ďalšia",
    "Następna",
    "Next"
  ],
  "Zrušit": [
    "Zrušiť",
    "Anuluj",
    "Cancel"
  ],
  "Zpět na úvod": [
    "Späť na úvod",
    "Powrót na stronę główną",
    "Back to home"
  ],
  "ONLINE REZERVACE": [
    "ONLINE REZERVÁCIE",
    "REZERWACJE ONLINE",
    "ONLINE BOOKING"
  ],
  "Vyberte si službu a čas, který vám vyhovuje. Hotovo během pár okamžiků.": [
    "Vyberte si službu a čas, ktorý vám vyhovuje. Hotovo za pár okamihov.",
    "Wybierz usługę i dogodny termin. To zajmie tylko chwilę.",
    "Choose a service and a time that suits you. It only takes a moment."
  ],
  "Zkontrolujte veřejné UUID organizace a dostupnost backendu.": [
    "Skontrolujte verejné UUID organizácie a dostupnosť servera.",
    "Sprawdź publiczny identyfikator UUID organizacji i dostępność serwera.",
    "Check the organization's public UUID and server availability."
  ],
  "Rezervace jsou dočasně pozastavené": [
    "Rezervácie sú dočasne pozastavené",
    "Rezerwacje są tymczasowo wstrzymane",
    "Bookings are temporarily paused"
  ],
  "Kontaktujte provozovnu.": [
    "Kontaktujte prevádzku.",
    "Skontaktuj się z lokalem.",
    "Contact the business."
  ],
  "KROK 01": [
    "KROK 01",
    "KROK 01",
    "STEP 01"
  ],
  "KROK 02": [
    "KROK 02",
    "KROK 02",
    "STEP 02"
  ],
  "KROK 03": [
    "KROK 03",
    "KROK 03",
    "STEP 03"
  ],
  "KROK 04": [
    "KROK 04",
    "KROK 04",
    "STEP 04"
  ],
  "Kde nás navštívíte?": [
    "Kde nás navštívite?",
    "Gdzie nas odwiedzisz?",
    "Where will you visit us?"
  ],
  "Vyberte pobočku, která vám nejlépe vyhovuje.": [
    "Vyberte pobočku, ktorá vám najviac vyhovuje.",
    "Wybierz najdogodniejszą lokalizację.",
    "Choose the location that suits you best."
  ],
  "Žádné dostupné pobočky": [
    "Žiadne dostupné pobočky",
    "Brak dostępnych lokalizacji",
    "No available locations"
  ],
  "Jakou službu si přejete?": [
    "Akú službu si želáte?",
    "Jakiej usługi potrzebujesz?",
    "Which service would you like?"
  ],
  "Vyberte službu z nabídky pobočky": [
    "Vyberte službu z ponuky pobočky",
    "Wybierz usługę z oferty lokalizacji",
    "Choose a service at"
  ],
  "Datum plánované rezervace": [
    "Dátum plánovanej rezervácie",
    "Data planowanej rezerwacji",
    "Planned booking date"
  ],
  "Pro tuto pobočku zatím nejsou služby": [
    "Pre túto pobočku zatiaľ nie sú služby",
    "Brak usług w tej lokalizacji",
    "No services at this location yet"
  ],
  "Správce musí přiřadit služby k pobočce a nastavit jejich platnou cenovou verzi.": [
    "Správca musí priradiť služby k pobočke a nastaviť platnú cenovú verziu.",
    "Administrator musi przypisać usługi do lokalizacji i ustawić aktualny cennik.",
    "An administrator must assign services to this location and configure valid pricing."
  ],
  "Vyberte datum a čas": [
    "Vyberte dátum a čas",
    "Wybierz datę i godzinę",
    "Choose date and time"
  ],
  "Najděte si termín, který se vám hodí.": [
    "Nájdite si termín, ktorý vám vyhovuje.",
    "Znajdź dogodny termin.",
    "Find a time that works for you."
  ],
  "Předchozí den": [
    "Predchádzajúci deň",
    "Poprzedni dzień",
    "Previous day"
  ],
  "Další den": [
    "Ďalší deň",
    "Następny dzień",
    "Next day"
  ],
  "Vybrat datum": [
    "Vybrať dátum",
    "Wybierz datę",
    "Choose date"
  ],
  "Počet osob": [
    "Počet osôb",
    "Liczba osób",
    "Party size"
  ],
  "Najdeme vhodný prostor pro vaši skupinu.": [
    "Nájdeme vhodný priestor pre vašu skupinu.",
    "Znajdziemy odpowiednie miejsce dla Twojej grupy.",
    "We'll find a suitable space for your group."
  ],
  "Méně osob": [
    "Menej osôb",
    "Mniej osób",
    "Fewer people"
  ],
  "Více osob": [
    "Viac osôb",
    "Więcej osób",
    "More people"
  ],
  "Počet kusů": [
    "Počet kusov",
    "Liczba sztuk",
    "Quantity"
  ],
  "Kolik kusů vybavení potřebujete?": [
    "Koľko kusov vybavenia potrebujete?",
    "Ile sztuk sprzętu potrzebujesz?",
    "How many items do you need?"
  ],
  "Dostupné začátky": [
    "Dostupné začiatky",
    "Dostępne godziny rozpoczęcia",
    "Available start times"
  ],
  "Hledám termíny…": [
    "Hľadám termíny…",
    "Szukam terminów…",
    "Finding available times…"
  ],
  "Pro tento den nejsou volné termíny": [
    "Na tento deň nie sú voľné termíny",
    "Brak wolnych terminów w tym dniu",
    "No availability on this day"
  ],
  "Zkuste jiné datum nebo pobočku.": [
    "Skúste iný dátum alebo pobočku.",
    "Spróbuj innej daty lub lokalizacji.",
    "Try another date or location."
  ],
  "Pro službu s volitelnou délkou je potřeba v administraci nastavit požadavky na zdroje.": [
    "Pre službu s voliteľnou dĺžkou treba v administrácii nastaviť požiadavky na zdroje.",
    "Dla usługi o zmiennym czasie trwania należy skonfigurować wymagania dotyczące zasobów.",
    "For variable-duration services, resource requirements must be configured in the admin area."
  ],
  "Vyberte pracovníka": [
    "Vyberte pracovníka",
    "Wybierz pracownika",
    "Choose a staff member"
  ],
  "Datum a čas vrácení": [
    "Dátum a čas vrátenia",
    "Data i godzina zwrotu",
    "Return date and time"
  ],
  "U půjčoven zvolte konec pronájmu. Finální dostupnost se ověří při odeslání.": [
    "Pri požičovniach zvoľte koniec prenájmu. Dostupnosť sa overí pri odoslaní.",
    "Wybierz koniec okresu wypożyczenia. Dostępność zostanie sprawdzona przy potwierdzeniu.",
    "For rentals, select the end of the rental period. Availability is checked when you submit."
  ],
  "Datum vrácení": [
    "Dátum vrátenia",
    "Data zwrotu",
    "Return date"
  ],
  "Čas vrácení": [
    "Čas vrátenia",
    "Godzina zwrotu",
    "Return time"
  ],
  "Termín se při potvrzení znovu ověří. Může se mezitím obsadit.": [
    "Termín sa pri potvrdení znova overí. Medzitým sa môže obsadiť.",
    "Dostępność zostanie ponownie sprawdzona przy potwierdzeniu. Termin może zostać zajęty.",
    "Availability will be checked again on confirmation. The slot may be taken in the meantime."
  ],
  "Ještě pár údajů": [
    "Ešte pár údajov",
    "Jeszcze kilka danych",
    "Just a few details"
  ],
  "Kam vám můžeme poslat potvrzení rezervace?": [
    "Kam vám môžeme poslať potvrdenie rezervácie?",
    "Gdzie możemy wysłać potwierdzenie rezerwacji?",
    "Where can we send your booking confirmation?"
  ],
  "Jméno a příjmení": [
    "Meno a priezvisko",
    "Imię i nazwisko",
    "Full name"
  ],
  "E-mail": [
    "E-mail",
    "E-mail",
    "Email"
  ],
  "Telefon (volitelné)": [
    "Telefón (voliteľné)",
    "Telefon (opcjonalnie)",
    "Phone (optional)"
  ],
  "Vaše údaje budou použity pouze pro zpracování rezervace.": [
    "Vaše údaje sa použijú iba na spracovanie rezervácie.",
    "Twoje dane będą wykorzystane wyłącznie do obsługi rezerwacji.",
    "Your details will only be used to process your booking."
  ],
  "Potvrdit rezervaci": [
    "Potvrdiť rezerváciu",
    "Potwierdź rezerwację",
    "Confirm booking"
  ],
  "HOTOVO!": [
    "HOTOVO!",
    "GOTOWE!",
    "DONE!"
  ],
  "Rezervace je potvrzena": [
    "Rezervácia je potvrdená",
    "Rezerwacja potwierdzona",
    "Booking confirmed"
  ],
  "Vaše rezervace číslo": [
    "Vaša rezervácia číslo",
    "Twoja rezerwacja numer",
    "Your booking number"
  ],
  "byla úspěšně vytvořena.": [
    "bola úspešne vytvorená.",
    "została pomyślnie utworzona.",
    "has been created successfully."
  ],
  "Datum a čas": [
    "Dátum a čas",
    "Data i godzina",
    "Date and time"
  ],
  "Pobočka": [
    "Pobočka",
    "Lokalizacja",
    "Location"
  ],
  "Služba": [
    "Služba",
    "Usługa",
    "Service"
  ],
  "Cena": [
    "Cena",
    "Cena",
    "Price"
  ],
  "Spravovat rezervaci": [
    "Spravovať rezerváciu",
    "Zarządzaj rezerwacją",
    "Manage booking"
  ],
  "Odkaz na správu si uložte. Obsahuje tajný přístupový token.": [
    "Odkaz na správu si uložte. Obsahuje tajný prístupový token.",
    "Zapisz link do zarządzania. Zawiera poufny token dostępu.",
    "Save the management link. It contains a private access token."
  ],
  "Zpět": [
    "Späť",
    "Wstecz",
    "Back"
  ],
  "Pokračovat": [
    "Pokračovať",
    "Dalej",
    "Continue"
  ],
  "VAŠE REZERVACE": [
    "VAŠA REZERVÁCIA",
    "TWOJA REZERWACJA",
    "YOUR BOOKING"
  ],
  "Souhrn objednávky": [
    "Súhrn objednávky",
    "Podsumowanie zamówienia",
    "Booking summary"
  ],
  "Termín": [
    "Termín",
    "Termin",
    "Appointment"
  ],
  "Celková cena": [
    "Celková cena",
    "Łączna cena",
    "Total price"
  ],
  "Bezpečná rezervace bez registrace": [
    "Bezpečná rezervácia bez registrácie",
    "Bezpieczna rezerwacja bez rejestracji",
    "Secure booking without registration"
  ],
  "Rezervační systém": [
    "Rezervačný systém",
    "System rezerwacji",
    "Booking system"
  ],
  "Správa rezervace": [
    "Správa rezervácie",
    "Zarządzanie rezerwacją",
    "Manage booking"
  ],
  "Zde můžete zobrazit stav své rezervace nebo ji zrušit.": [
    "Tu si môžete pozrieť stav rezervácie alebo ju zrušiť.",
    "Tutaj możesz sprawdzić status rezerwacji lub ją anulować.",
    "View your booking status or cancel your reservation here."
  ],
  "Rezervace #": [
    "Rezervácia #",
    "Rezerwacja #",
    "Booking #"
  ],
  "Jméno": [
    "Meno",
    "Imię",
    "Name"
  ],
  "Rezervace byla zrušena.": [
    "Rezervácia bola zrušená.",
    "Rezerwacja została anulowana.",
    "Booking cancelled."
  ],
  "Opravdu chcete rezervaci zrušit?": [
    "Naozaj chcete zrušiť rezerváciu?",
    "Czy na pewno chcesz anulować rezerwację?",
    "Are you sure you want to cancel this booking?"
  ],
  "Zrušit rezervaci": [
    "Zrušiť rezerváciu",
    "Anuluj rezerwację",
    "Cancel booking"
  ],
  "Odkaz na tuto stránku uchovávejte v soukromí.": [
    "Odkaz na túto stránku uchovávajte v súkromí.",
    "Zachowaj link do tej strony w tajemnicy.",
    "Keep the link to this page private."
  ],
  "KAPACITY A VYBAVENÍ": [
    "KAPACITY A VYBAVENIE",
    "ZASOBY I WYPOSAŻENIE",
    "CAPACITY & EQUIPMENT"
  ],
  "Zdroje": [
    "Zdroje",
    "Zasoby",
    "Resources"
  ],
  "Spravujte bookanearvatelné pracovníky, místnosti, stoly a vybavení.": [
    "Spravujte bookanearvateľných pracovníkov, miestnosti, stoly a vybavenie.",
    "Zarządzaj pracownikami, pomieszczeniami, stolikami i wyposażeniem.",
    "Manage bookable staff, rooms, tables, and equipment."
  ],
  "Typy zdrojů": [
    "Typy zdrojov",
    "Typy zasobów",
    "Resource types"
  ],
  "Vyberte pobočku": [
    "Vyberte pobočku",
    "Wybierz lokalizację",
    "Choose location"
  ],
  "zdrojů": [
    "zdrojov",
    "zasobów",
    "resources"
  ],
  "Zobrazí se její bookanearvatelné zdroje.": [
    "Zobrazia sa jej bookanearvateľné zdroje.",
    "Wyświetlą się dostępne zasoby tej lokalizacji.",
    "Its bookable resources will appear here."
  ],
  "Zatím žádné zdroje": [
    "Zatiaľ žiadne zdroje",
    "Brak zasobów",
    "No resources yet"
  ],
  "Přidejte první stůl, pracovníka nebo vybavení.": [
    "Pridajte prvý stôl, pracovníka alebo vybavenie.",
    "Dodaj pierwszy stolik, pracownika lub sprzęt.",
    "Add your first table, staff member, or equipment."
  ],
  "Zdroj": [
    "Zdroj",
    "Zasób",
    "Resource"
  ],
  "Typ": [
    "Typ",
    "Typ",
    "Type"
  ],
  "Kapacita": [
    "Kapacita",
    "Pojemność",
    "Capacity"
  ],
  "Stav": [
    "Stav",
    "Status",
    "Status"
  ],
  "Upravit": [
    "Upraviť",
    "Edytuj",
    "Edit"
  ],
  "Zatím žádné typy zdrojů": [
    "Zatiaľ žiadne typy zdrojov",
    "Brak typów zasobów",
    "No resource types yet"
  ],
  "Kategorie": [
    "Kategória",
    "Kategoria",
    "Category"
  ],
  "Název": [
    "Názov",
    "Nazwa",
    "Name"
  ],
  "Typ zdroje": [
    "Typ zdroja",
    "Typ zasobu",
    "Resource type"
  ],
  "Vyberte typ": [
    "Vyberte typ",
    "Wybierz typ",
    "Select type"
  ],
  "ID zaměstnance": [
    "ID zamestnanca",
    "ID pracownika",
    "Employee ID"
  ],
  "Pracovník musí být přiřazen této pobočce.": [
    "Pracovník musí byť priradený k tejto pobočke.",
    "Pracownik musi być przypisany do tej lokalizacji.",
    "The staff member must be assigned to this location."
  ],
  "Inventární kód (volitelné)": [
    "Inventárny kód (voliteľné)",
    "Kod inwentarzowy (opcjonalnie)",
    "Inventory code (optional)"
  ],
  "Dostupný": [
    "Dostupný",
    "Dostępny",
    "Available"
  ],
  "Údržba": [
    "Údržba",
    "Konserwacja",
    "Maintenance"
  ],
  "Vyřazený": [
    "Vyradený",
    "Wycofany",
    "Retired"
  ],
  "Aktivita": [
    "Aktivita",
    "Aktywność",
    "Activity"
  ],
  "Aktivní": [
    "Aktívny",
    "Aktywny",
    "Active"
  ],
  "Neaktivní": [
    "Neaktívny",
    "Nieaktywny",
    "Inactive"
  ],
  "Název typu": [
    "Názov typu",
    "Nazwa typu",
    "Type name"
  ],
  "ZÁKAZNICKÁ DATABÁZE": [
    "DATABÁZA ZÁKAZNÍKOV",
    "BAZA KLIENTÓW",
    "CUSTOMER DATABASE"
  ],
  "Zákazníci": [
    "Zákazníci",
    "Klienci",
    "Customers"
  ],
  "Kontakty a poznámky pro lepší péči o zákazníky.": [
    "Kontakty a poznámky pre lepšiu starostlivosť o zákazníkov.",
    "Kontakty i notatki pomagające w obsłudze klientów.",
    "Contacts and notes to help you care for customers."
  ],
  "Nový zákazník": [
    "Nový zákazník",
    "Nowy klient",
    "New customer"
  ],
  "Hledat jméno, e-mail…": [
    "Hľadať meno, e-mail…",
    "Szukaj imienia, e-maila…",
    "Search name, email…"
  ],
  "zákazníků": [
    "zákazníkov",
    "klientów",
    "customers"
  ],
  "Zatím žádní zákazníci": [
    "Zatiaľ žiadni zákazníci",
    "Brak klientów",
    "No customers yet"
  ],
  "Přidejte zákazníka nebo vytvořte první rezervaci.": [
    "Pridajte zákazníka alebo vytvorte prvú rezerváciu.",
    "Dodaj klienta lub utwórz pierwszą rezerwację.",
    "Add a customer or create your first booking."
  ],
  "Zákazník": [
    "Zákazník",
    "Klient",
    "Customer"
  ],
  "Telefon": [
    "Telefón",
    "Telefon",
    "Phone"
  ],
  "Interní poznámka": [
    "Interná poznámka",
    "Notatka wewnętrzna",
    "Internal note"
  ],
  "LIDÉ A SMĚNY": [
    "ĽUDIA A ZMENY",
    "ZESPÓŁ I ZMIANY",
    "STAFF & SHIFTS"
  ],
  "Váš tým": [
    "Váš tím",
    "Twój zespół",
    "Your team"
  ],
  "Zaměstnanci mohou pracovat na více pobočkách. Směny se nesmí překrývat.": [
    "Zamestnanci môžu pracovať na viacerých pobočkách. Zmeny sa nesmú prekrývať.",
    "Pracownicy mogą pracować w wielu lokalizacjach. Zmiany nie mogą się nakładać.",
    "Employees can work at multiple locations. Shifts must not overlap."
  ],
  "Přidat zaměstnance": [
    "Pridať zamestnanca",
    "Dodaj pracownika",
    "Add employee"
  ],
  "Hledat zaměstnance…": [
    "Hľadať zamestnancov…",
    "Szukaj pracownika…",
    "Search employees…"
  ],
  "členů týmu": [
    "členov tímu",
    "członków zespołu",
    "team members"
  ],
  "Žádní zaměstnanci": [
    "Žiadni zamestnanci",
    "Brak pracowników",
    "No employees yet"
  ],
  "Přidejte první člena týmu.": [
    "Pridajte prvého člena tímu.",
    "Dodaj pierwszego członka zespołu.",
    "Add your first team member."
  ],
  "Zaměstnanec": [
    "Zamestnanec",
    "Pracownik",
    "Employee"
  ],
  "Role": [
    "Rola",
    "Rola",
    "Role"
  ],
  "Rozvrh a služby": [
    "Rozvrh a služby",
    "Grafik i usługi",
    "Schedule and services"
  ],
  "Jméno zaměstnance": [
    "Meno zamestnanca",
    "Imię i nazwisko pracownika",
    "Employee name"
  ],
  "Administrátor": [
    "Administrátor",
    "Administrator",
    "Administrator"
  ],
  "Majitel": [
    "Majiteľ",
    "Właściciel",
    "Owner"
  ],
  "Vytvoření zaměstnance v aktuálním API nezakládá přihlašovací účet. Záznam slouží pro rozvrhy a rezervace.": [
    "Vytvorenie zamestnanca v aktuálnom API nezakladá prihlasovací účet. Záznam slúži na rozvrhy a rezervácie.",
    "Utworzenie pracownika w obecnym API nie tworzy konta logowania. Rekord służy do grafików i rezerwacji.",
    "Creating an employee in the current API does not create a login account. The record is used for schedules and bookings."
  ],
  "Pobočky": [
    "Pobočky",
    "Lokalizacje",
    "Locations"
  ],
  "Služby": [
    "Služby",
    "Usługi",
    "Services"
  ],
  "Směny": [
    "Zmeny",
    "Zmiany",
    "Shifts"
  ],
  "Pobočka pro rozvrh": [
    "Pobočka pre rozvrh",
    "Lokalizacja dla grafiku",
    "Schedule location"
  ],
  "Vyberte pobočku. Nejdříve ji přiřaďte zaměstnanci v záložce Pobočky.": [
    "Vyberte pobočku. Najprv ju priraďte zamestnancovi na karte Pobočky.",
    "Wybierz lokalizację. Najpierw przypisz ją pracownikowi w zakładce Lokalizacje.",
    "Choose a location. First assign it to the employee on the Locations tab."
  ],
  "Zaměstnanec může být přiřazen více pobočkám. Historické rezervace mohou zabránit odebrání pobočky.": [
    "Zamestnanec môže byť priradený k viacerým pobočkám. Historické rezervácie môžu zabrániť odobratiu pobočky.",
    "Pracownik może być przypisany do wielu lokalizacji. Historyczne rezerwacje mogą uniemożliwić usunięcie przypisania.",
    "An employee can be assigned to multiple locations. Past bookings may prevent removing an assignment."
  ],
  "Uložit pobočky": [
    "Uložiť pobočky",
    "Zapisz lokalizacje",
    "Save locations"
  ],
  "Přiřazení služby bylo změněno.": [
    "Priradenie služby bolo zmenené.",
    "Przypisanie usługi zostało zmienione.",
    "Service assignment updated."
  ],
  "Zvolte služby, které tento pracovník poskytuje.": [
    "Zvoľte služby, ktoré tento pracovník poskytuje.",
    "Wybierz usługi świadczone przez tego pracownika.",
    "Choose the services this employee provides."
  ],
  "REZERVAČNÍ CENTRUM": [
    "REZERVAČNÉ CENTRUM",
    "CENTRUM REZERWACJI",
    "BOOKING CENTER"
  ],
  "Rezervace": [
    "Rezervácie",
    "Rezerwacje",
    "Bookings"
  ],
  "Přehled termínů, zákazníků a stavu všech rezervací.": [
    "Prehľad termínov, zákazníkov a stavu všetkých rezervácií.",
    "Przegląd terminów, klientów i statusów rezerwacji.",
    "Overview of appointments, customers, and booking statuses."
  ],
  "Kalendář": [
    "Kalendár",
    "Kalendarz",
    "Calendar"
  ],
  "Seznam": [
    "Zoznam",
    "Lista",
    "List"
  ],
  "Jméno nebo e-mail…": [
    "Meno alebo e-mail…",
    "Imię lub e-mail…",
    "Name or email…"
  ],
  "Filtrovat pobočku": [
    "Filtrovať pobočku",
    "Filtruj lokalizację",
    "Filter location"
  ],
  "Všechny pobočky": [
    "Všetky pobočky",
    "Wszystkie lokalizacje",
    "All locations"
  ],
  "Stav rezervace": [
    "Stav rezervácie",
    "Status rezerwacji",
    "Booking status"
  ],
  "Všechny stavy": [
    "Všetky stavy",
    "Wszystkie statusy",
    "All statuses"
  ],
  "Potvrzené": [
    "Potvrdené",
    "Potwierdzone",
    "Confirmed"
  ],
  "Čekající": [
    "Čakajúce",
    "Oczekujące",
    "Pending"
  ],
  "Dokončené": [
    "Dokončené",
    "Zakończone",
    "Completed"
  ],
  "Zrušené": [
    "Zrušené",
    "Anulowane",
    "Cancelled"
  ],
  "Nedostavil se": [
    "Nedostavil sa",
    "Nie pojawił się",
    "No-show"
  ],
  "Dnes": [
    "Dnes",
    "Dziś",
    "Today"
  ],
  "Žádné rezervace": [
    "Žiadne rezervácie",
    "Brak rezerwacji",
    "No bookings"
  ],
  "Změňte filtry nebo počkejte na nové rezervace.": [
    "Zmeňte filtre alebo počkajte na nové rezervácie.",
    "Zmień filtry lub poczekaj na nowe rezerwacje.",
    "Change the filters or wait for new bookings."
  ],
  "Vytvořeno": [
    "Vytvorené",
    "Utworzono",
    "Created"
  ],
  "Částka": [
    "Suma",
    "Kwota",
    "Amount"
  ],
  "Detail": [
    "Detail",
    "Szczegóły",
    "Details"
  ],
  "Jméno zákazníka": [
    "Meno zákazníka",
    "Imię i nazwisko klienta",
    "Customer name"
  ],
  "Položky rezervace": [
    "Položky rezervácie",
    "Pozycje rezerwacji",
    "Booking items"
  ],
  "Služba #": [
    "Služba #",
    "Usługa #",
    "Service #"
  ],
  "Aktuální API neposkytuje backoffice endpoint pro změnu stavu rezervace. Zde je detail pouze pro čtení.": [
    "Aktuálne API neposkytuje endpoint na zmenu stavu rezervácie. Detail je len na čítanie.",
    "Obecne API nie udostępnia funkcji zmiany statusu rezerwacji. Szczegóły są tylko do odczytu.",
    "The current API does not support changing booking status in the backoffice. This view is read-only."
  ],
  "VÁŠ PRACOVNÍ PROSTOR": [
    "VÁŠ PRACOVNÝ PRIESTOR",
    "TWÓJ PANEL PRACY",
    "YOUR WORKSPACE"
  ],
  "Celkem rezervací": [
    "Celkom rezervácií",
    "Łącznie rezerwacji",
    "Total bookings"
  ],
  "Potvrzené (na stránce)": [
    "Potvrdené (na stránke)",
    "Potwierdzone (na stronie)",
    "Confirmed (on page)"
  ],
  "Členové týmu": [
    "Členovia tímu",
    "Członkowie zespołu",
    "Team members"
  ],
  "AKTIVITA": [
    "AKTIVITA",
    "AKTYWNOŚĆ",
    "ACTIVITY"
  ],
  "Poslední rezervace": [
    "Posledné rezervácie",
    "Ostatnie rezerwacje",
    "Recent bookings"
  ],
  "Zobrazit vše": [
    "Zobraziť všetko",
    "Zobacz wszystkie",
    "View all"
  ],
  "Zatím žádné rezervace": [
    "Zatiaľ žiadne rezervácie",
    "Brak rezerwacji",
    "No bookings yet"
  ],
  "Nové rezervace se zobrazí tady.": [
    "Nové rezervácie sa zobrazia tu.",
    "Nowe rezerwacje pojawią się tutaj.",
    "New bookings will appear here."
  ],
  "RYCHLÝ START": [
    "RÝCHLY ŠTART",
    "SZYBKI START",
    "QUICK START"
  ],
  "Začněte tady": [
    "Začnite tu",
    "Zacznij tutaj",
    "Start here"
  ],
  "Přidat pobočku": [
    "Pridať pobočku",
    "Dodaj lokalizację",
    "Add location"
  ],
  "Adresy a otevírací doba": [
    "Adresy a otváracie hodiny",
    "Adresy i godziny otwarcia",
    "Addresses and opening hours"
  ],
  "Nastavit služby": [
    "Nastaviť služby",
    "Skonfiguruj usługi",
    "Set up services"
  ],
  "Ceny a délka rezervací": [
    "Ceny a dĺžka rezervácií",
    "Ceny i czas trwania rezerwacji",
    "Prices and booking duration"
  ],
  "Naplánovat směny": [
    "Naplánovať zmeny",
    "Zaplanuj zmiany",
    "Plan shifts"
  ],
  "Pracovní doba zaměstnanců": [
    "Pracovný čas zamestnancov",
    "Godziny pracy pracowników",
    "Employee working hours"
  ],
  "Veřejná rezervační stránka": [
    "Verejná rezervačná stránka",
    "Publiczna strona rezerwacji",
    "Public booking page"
  ],
  "Sdílejte odkaz, aby se zákazníci mohli sami objednat.": [
    "Zdieľajte odkaz, aby sa zákazníci mohli sami objednať.",
    "Udostępnij link, aby klienci mogli samodzielnie rezerwować.",
    "Share the link so customers can book themselves."
  ],
  "Otevřít rezervační web": [
    "Otvoriť rezervačný web",
    "Otwórz stronę rezerwacji",
    "Open booking website"
  ],
  "Veřejné UUID najdete v nastavení organizace.": [
    "Verejné UUID nájdete v nastaveniach organizácie.",
    "Publiczny UUID znajdziesz w ustawieniach organizacji.",
    "Find the public UUID in organization settings."
  ],
  "Seznam služeb není pro tento účet dostupný.": [
    "Zoznam služieb nie je pre tento účet dostupný.",
    "Lista usług jest niedostępna dla tego konta.",
    "The service list is unavailable for this account."
  ],
  "Nastavení organizace bylo uloženo.": [
    "Nastavenia organizácie boli uložené.",
    "Ustawienia organizacji zostały zapisane.",
    "Organization settings saved."
  ],
  "ORGANIZACE": [
    "ORGANIZÁCIA",
    "ORGANIZACJA",
    "ORGANIZATION"
  ],
  "Nastavení": [
    "Nastavenia",
    "Ustawienia",
    "Settings"
  ],
  "Profil organizace, veřejná rezervační stránka a fotografie.": [
    "Profil organizácie, verejná rezervačná stránka a fotografie.",
    "Profil organizacji, publiczna strona rezerwacji i zdjęcia.",
    "Organization profile, public booking page, and photos."
  ],
  "Profil": [
    "Profil",
    "Profil",
    "Profile"
  ],
  "Fotografie a logo": [
    "Fotografie a logo",
    "Zdjęcia i logo",
    "Photos and logo"
  ],
  "Údaje organizace": [
    "Údaje organizácie",
    "Dane organizacji",
    "Organization details"
  ],
  "Tyto informace slouží pro správu provozu.": [
    "Tieto informácie slúžia na správu prevádzky.",
    "Te informacje służą do zarządzania działalnością.",
    "This information is used to manage your business."
  ],
  "Název organizace": [
    "Názov organizácie",
    "Nazwa organizacji",
    "Organization name"
  ],
  "Kontaktní e-mail": [
    "Kontaktný e-mail",
    "Kontaktowy e-mail",
    "Contact email"
  ],
  "Výchozí časové pásmo": [
    "Predvolené časové pásmo",
    "Domyślna strefa czasowa",
    "Default time zone"
  ],
  "Veřejné rezervace": [
    "Verejné rezervácie",
    "Rezerwacje publiczne",
    "Public bookings"
  ],
  "Povoleny": [
    "Povolené",
    "Włączone",
    "Enabled"
  ],
  "Pozastaveny": [
    "Pozastavené",
    "Wstrzymane",
    "Paused"
  ],
  "Uložit nastavení": [
    "Uložiť nastavenia",
    "Zapisz ustawienia",
    "Save settings"
  ],
  "PRO ZÁKAZNÍKY": [
    "PRE ZÁKAZNÍKOV",
    "DLA KLIENTÓW",
    "FOR CUSTOMERS"
  ],
  "Rezervační odkaz": [
    "Rezervačný odkaz",
    "Link do rezerwacji",
    "Booking link"
  ],
  "Sdílejte veřejný odkaz na vaši organizaci.": [
    "Zdieľajte verejný odkaz na vašu organizáciu.",
    "Udostępnij publiczny link do swojej organizacji.",
    "Share your organization's public link."
  ],
  "Kopírovat": [
    "Kopírovať",
    "Kopiuj",
    "Copy"
  ],
  "Veřejné UUID zatím není k dispozici.": [
    "Verejné UUID zatiaľ nie je k dispozícii.",
    "Publiczny UUID nie jest jeszcze dostępny.",
    "Public UUID is not available yet."
  ],
  "Informace o projektu": [
    "Informácie o projekte",
    "Informacje o projekcie",
    "Project information"
  ],
  "Stav registrace": [
    "Stav registrácie",
    "Status rejestracji",
    "Registration status"
  ],
  "Fotografie jsou ukládány přes backend do S3 kompatibilního úložiště (Cloudflare R2).": [
    "Fotografie sa ukladajú cez server do úložiska kompatibilného s S3 (Cloudflare R2).",
    "Zdjęcia są zapisywane przez serwer w pamięci zgodnej z S3 (Cloudflare R2).",
    "Photos are stored through the backend in S3-compatible storage (Cloudflare R2)."
  ],
  "Zadejte platné veřejné UUID organizace.": [
    "Zadajte platné verejné UUID organizácie.",
    "Wpisz poprawny publiczny UUID organizacji.",
    "Enter a valid public organization UUID."
  ],
  "Jak to funguje": [
    "Ako to funguje",
    "Jak to działa",
    "How it works"
  ],
  "Funkce": [
    "Funkcie",
    "Funkcje",
    "Features"
  ],
  "Přihlášení": [
    "Prihlásenie",
    "Logowanie",
    "Sign in"
  ],
  "Začít zdarma": [
    "Začať zadarmo",
    "Zacznij za darmo",
    "Get started free"
  ],
  "Rezervace bez chaosu": [
    "Rezervácie bez chaosu",
    "Rezerwacje bez chaosu",
    "Bookings without the chaos"
  ],
  "Váš provoz.": [
    "Vaša prevádzka.",
    "Twój biznes.",
    "Your business."
  ],
  "Váš čas.": [
    "Váš čas.",
    "Twój czas.",
    "Your time."
  ],
  "Vaše pravidla.": [
    "Vaše pravidlá.",
    "Twoje zasady.",
    "Your rules."
  ],
  "Jednoduchý rezervační systém pro salony, studia, restaurace i půjčovny. Spravujte vše z jednoho místa a dopřejte zákazníkům pohodlné online rezervace.": [
    "Jednoduchý rezervačný systém pre salóny, štúdiá, reštaurácie aj požičovne. Spravujte všetko z jedného miesta a doprajte zákazníkom pohodlné online rezervácie.",
    "Prosty system rezerwacji dla salonów, studiów, restauracji i wypożyczalni. Zarządzaj wszystkim w jednym miejscu i zaoferuj klientom wygodne rezerwacje online.",
    "A simple booking system for salons, studios, restaurants, and rentals. Manage everything in one place and offer customers easy online bookings."
  ],
  "Založit organizaci": [
    "Založiť organizáciu",
    "Utwórz organizację",
    "Create organization"
  ],
  "Prohlédnout funkce": [
    "Pozrieť funkcie",
    "Zobacz funkcje",
    "Explore features"
  ],
  "Více poboček": [
    "Viac pobočiek",
    "Wiele lokalizacji",
    "Multiple locations"
  ],
  "Flexibilní služby": [
    "Flexibilné služby",
    "Elastyczne usługi",
    "Flexible services"
  ],
  "Online rezervace": [
    "Online rezervácie",
    "Rezerwacje online",
    "Online booking"
  ],
  "Bookanear / Přehled": [
    "Bookanear / Prehľad",
    "Bookanear / Przegląd",
    "Bookanear / Overview"
  ],
  "PŘEHLED": [
    "PREHĽAD",
    "PRZEGLĄD",
    "OVERVIEW"
  ],
  "Dobrý den, Jano 👋": [
    "Dobrý deň, Jana 👋",
    "Dzień dobry, Jano 👋",
    "Hello, Jana 👋"
  ],
  "Dnešní rezervace": [
    "Dnešné rezervácie",
    "Dzisiejsze rezerwacje",
    "Today's bookings"
  ],
  "Aktivní pobočky": [
    "Aktívne pobočky",
    "Aktywne lokalizacje",
    "Active locations"
  ],
  "V provozu": [
    "V prevádzke",
    "Otwarte",
    "Open"
  ],
  "Týdenní kalendář": [
    "Týždenný kalendár",
    "Kalendarz tygodniowy",
    "Weekly calendar"
  ],
  "Říjen 2026": [
    "Október 2026",
    "Październik 2026",
    "October 2026"
  ],
  "Nová rezervace": [
    "Nová rezervácia",
    "Nowa rezerwacja",
    "New booking"
  ],
  "Stříhání · dnes 14:30": [
    "Strihanie · dnes 14:30",
    "Strzyżenie · dziś 14:30",
    "Haircut · today 14:30"
  ],
  "VŠE NA JEDNOM MÍSTĚ": [
    "VŠETKO NA JEDNOM MIESTE",
    "WSZYSTKO W JEDNYM MIEJSCU",
    "EVERYTHING IN ONE PLACE"
  ],
  "Prostor pro růst vašeho podnikání": [
    "Priestor pre rast vášho podnikania",
    "Miejsce na rozwój Twojego biznesu",
    "Room for your business to grow"
  ],
  "Od první rezervace až po síť poboček. Bookanear roste společně s vámi.": [
    "Od prvej rezervácie až po sieť pobočiek. Bookanear rastie spolu s vami.",
    "Od pierwszej rezerwacji po sieć lokalizacji. Bookanear rośnie razem z Tobą.",
    "From your first booking to a network of locations, Bookanear grows with you."
  ],
  "Rezervace bez starostí": [
    "Rezervácie bez starostí",
    "Rezerwacje bez zmartwień",
    "Hassle-free bookings"
  ],
  "Online objednávání a přehledný kalendář rezervací pro každou pobočku.": [
    "Online objednávanie a prehľadný kalendár rezervácií pre každú pobočku.",
    "Rezerwacje online i przejrzysty kalendarz dla każdej lokalizacji.",
    "Online appointments and a clear booking calendar for every location."
  ],
  "Jedna organizace, libovolný počet provozoven a vlastní otevírací doba.": [
    "Jedna organizácia, ľubovoľný počet prevádzok a vlastné otváracie hodiny.",
    "Jedna organizacja, dowolna liczba lokalizacji i indywidualne godziny otwarcia.",
    "One organization, any number of locations, and custom opening hours."
  ],
  "Rozvrhy zaměstnanců, služby a ochrana proti kolizím směn.": [
    "Rozvrhy zamestnancov, služby a ochrana proti kolíziám zmien.",
    "Grafiki pracowników, usługi i ochrona przed nakładającymi się zmianami.",
    "Staff schedules, services, and protection against overlapping shifts."
  ],
  "Univerzální zdroje": [
    "Univerzálne zdroje",
    "Uniwersalne zasoby",
    "Flexible resources"
  ],
  "Rezervujte kadeřníky, stoly, místnosti, nářadí i vybavení.": [
    "Rezervujte kaderníkov, stoly, miestnosti, náradie aj vybavenie.",
    "Rezerwuj fryzjerów, stoliki, pomieszczenia, narzędzia i sprzęt.",
    "Book hairdressers, tables, rooms, tools, and equipment."
  ],
  "Vždy aktuální": [
    "Vždy aktuálne",
    "Zawsze aktualne",
    "Always up to date"
  ],
  "Termíny a kapacity se kontrolují při vytváření každé rezervace.": [
    "Termíny a kapacity sa kontrolujú pri vytváraní každej rezervácie.",
    "Terminy i dostępność są sprawdzane przy każdej rezerwacji.",
    "Slots and capacity are checked when each booking is created."
  ],
  "Bezpečné prostředí": [
    "Bezpečné prostredie",
    "Bezpieczne środowisko",
    "Secure environment"
  ],
  "JWT přihlášení, oprávnění a oddělení dat jednotlivých organizací.": [
    "JWT prihlásenie, oprávnenia a oddelenie dát jednotlivých organizácií.",
    "Logowanie JWT, uprawnienia i oddzielne dane organizacji.",
    "JWT login, permissions, and organization data isolation."
  ],
  "REZERVACE PRO ZÁKAZNÍKY": [
    "REZERVÁCIE PRE ZÁKAZNÍKOV",
    "REZERWACJE DLA KLIENTÓW",
    "CUSTOMER BOOKINGS"
  ],
  "Máte odkaz na svou provozovnu?": [
    "Máte odkaz na svoju prevádzku?",
    "Masz link do swojego lokalu?",
    "Have a link to your business?"
  ],
  "Zadejte veřejné ID organizace a otevřete její rezervační stránku. Není potřeba zákaznický účet.": [
    "Zadajte verejné ID organizácie a otvorte jej rezervačnú stránku. Zákaznícky účet nie je potrebný.",
    "Wpisz publiczny identyfikator organizacji i otwórz stronę rezerwacji. Konto klienta nie jest wymagane.",
    "Enter the public organization ID to open its booking page. No customer account required."
  ],
  "Veřejné UUID organizace": [
    "Verejné UUID organizácie",
    "Publiczny UUID organizacji",
    "Public organization UUID"
  ],
  "Rezervace, které dávají smysl.": [
    "Rezervácie, ktoré dávajú zmysel.",
    "Rezerwacje, które mają sens.",
    "Bookings that make sense."
  ],
  "Administrace →": [
    "Administrácia →",
    "Administracja →",
    "Admin →"
  ],
  "SPRÁVA PROVOZU": [
    "SPRÁVA PREVÁDZKY",
    "ZARZĄDZANIE LOKALIZACJAMI",
    "LOCATION MANAGEMENT"
  ],
  "Spravujte provozovny, jejich otevírací dobu, nabídku služeb a fotografie.": [
    "Spravujte prevádzky, ich otváracie hodiny, ponuku služieb a fotografie.",
    "Zarządzaj lokalizacjami, godzinami otwarcia, ofertą usług i zdjęciami.",
    "Manage locations, opening hours, services, and photos."
  ],
  "Nová pobočka": [
    "Nová pobočka",
    "Nowa lokalizacja",
    "New location"
  ],
  "Hledat pobočku…": [
    "Hľadať pobočku…",
    "Szukaj lokalizacji…",
    "Search locations…"
  ],
  "poboček": [
    "pobočiek",
    "lokalizacji",
    "locations"
  ],
  "Žádné pobočky": [
    "Žiadne pobočky",
    "Brak lokalizacji",
    "No locations yet"
  ],
  "Přidejte první provozovnu.": [
    "Pridajte prvú prevádzku.",
    "Dodaj pierwszą lokalizację.",
    "Add your first location."
  ],
  "Adresa": [
    "Adresa",
    "Adres",
    "Address"
  ],
  "Časové pásmo": [
    "Časové pásmo",
    "Strefa czasowa",
    "Time zone"
  ],
  "Spravovat": [
    "Spravovať",
    "Zarządzaj",
    "Manage"
  ],
  "Název pobočky": [
    "Názov pobočky",
    "Nazwa lokalizacji",
    "Location name"
  ],
  "Otevírací doba": [
    "Otváracie hodiny",
    "Godziny otwarcia",
    "Opening hours"
  ],
  "Nabídka služeb": [
    "Ponuka služieb",
    "Oferta usług",
    "Service offering"
  ],
  "Zaškrtněte služby dostupné na této pobočce. Bez přiřazení nelze službu veřejně bookanearvat.": [
    "Zaškrtnite služby dostupné na tejto pobočke. Bez priradenia nie je možné službu verejne bookanearvať.",
    "Zaznacz usługi dostępne w tej lokalizacji. Bez przypisania usługa nie może być rezerwowana publicznie.",
    "Select the services available at this location. Services cannot be booked publicly without an assignment."
  ],
  "Zatím nejsou vytvořené služby": [
    "Zatiaľ nie sú vytvorené služby",
    "Nie utworzono jeszcze usług",
    "No services created yet"
  ],
  "Uložit přiřazení": [
    "Uložiť priradenie",
    "Zapisz przypisanie",
    "Save assignments"
  ],
  "KATALOG": [
    "KATALÓG",
    "KATALOG",
    "CATALOG"
  ],
  "Nastavte nabídku, ceny, délku služeb a potřebné zdroje.": [
    "Nastavte ponuku, ceny, dĺžku služieb a potrebné zdroje.",
    "Skonfiguruj ofertę, ceny, czas trwania usług i wymagane zasoby.",
    "Configure services, prices, duration, and required resources."
  ],
  "Nová služba": [
    "Nová služba",
    "Nowa usługa",
    "New service"
  ],
  "Hledat službu…": [
    "Hľadať službu…",
    "Szukaj usługi…",
    "Search services…"
  ],
  "služeb": [
    "služieb",
    "usług",
    "services"
  ],
  "Žádné služby": [
    "Žiadne služby",
    "Brak usług",
    "No services yet"
  ],
  "Vytvořte svou první službu.": [
    "Vytvorte svoju prvú službu.",
    "Utwórz pierwszą usługę.",
    "Create your first service."
  ],
  "Popis": [
    "Popis",
    "Opis",
    "Description"
  ],
  "Název služby": [
    "Názov služby",
    "Nazwa usługi",
    "Service name"
  ],
  "Ceny a délky": [
    "Ceny a dĺžky",
    "Ceny i czasy trwania",
    "Prices and durations"
  ],
  "Potřebné zdroje": [
    "Potrebné zdroje",
    "Wymagane zasoby",
    "Required resources"
  ],
  "Verze služby": [
    "Verzia služby",
    "Wersja usługi",
    "Service version"
  ],
  "Platnost, cena a délka služby. Verze se historicky uchovávají.": [
    "Platnosť, cena a dĺžka služby. Verzie sa historicky uchovávajú.",
    "Ważność, cena i czas trwania usługi. Wersje są przechowywane historycznie.",
    "Validity, price, and duration. Service versions are retained for history."
  ],
  "Nová verze": [
    "Nová verzia",
    "Nowa wersja",
    "New version"
  ],
  "Zatím není nastavena cena ani délka": [
    "Zatiaľ nie je nastavená cena ani dĺžka",
    "Nie ustawiono ceny ani czasu trwania",
    "Price and duration not set yet"
  ],
  "Bez platné verze nelze službu veřejně bookanearvat.": [
    "Bez platnej verzie nie je možné službu verejne bookanearvať.",
    "Bez aktywnej wersji usługa nie może być rezerwowana publicznie.",
    "A valid version is required for public booking."
  ],
  "· krok": [
    "· krok",
    "· krok",
    "· step"
  ],
  "min": [
    "min",
    "min",
    "min"
  ],
  "Od": [
    "Od",
    "Od",
    "From"
  ],
  "Do": [
    "Do",
    "Do",
    "To"
  ],
  "Nová cenová verze": [
    "Nová cenová verzia",
    "Nowa wersja cennika",
    "New pricing version"
  ],
  "Platná od": [
    "Platná od",
    "Ważna od",
    "Valid from"
  ],
  "Platná do (nepovinné)": [
    "Platná do (nepovinné)",
    "Ważna do (opcjonalnie)",
    "Valid until (optional)"
  ],
  "Měna": [
    "Mena",
    "Waluta",
    "Currency"
  ],
  "Režim délky": [
    "Režim dĺžky",
    "Tryb czasu trwania",
    "Duration mode"
  ],
  "Pevná délka": [
    "Pevná dĺžka",
    "Stały czas trwania",
    "Fixed duration"
  ],
  "Volitelná délka (půjčovna)": [
    "Voliteľná dĺžka (požičovňa)",
    "Zmienny czas trwania (wypożyczalnia)",
    "Custom duration (rental)"
  ],
  "Minimální délka (min)": [
    "Minimálna dĺžka (min)",
    "Minimalny czas (min)",
    "Minimum duration (min)"
  ],
  "Krok termínů (min)": [
    "Krok termínov (min)",
    "Odstęp terminów (min)",
    "Slot interval (min)"
  ],
  "Maximální délka (min)": [
    "Maximálna dĺžka (min)",
    "Maksymalny czas (min)",
    "Maximum duration (min)"
  ],
  "Příprava před (min)": [
    "Príprava pred (min)",
    "Przygotowanie przed (min)",
    "Setup before (min)"
  ],
  "Úklid po (min)": [
    "Upratovanie po (min)",
    "Sprzątanie po (min)",
    "Cleanup after (min)"
  ],
  "Platnosti verzí se nesmí překrývat. U otevřené předchozí verze nejprve upravte její období v backendu.": [
    "Platnosti verzií sa nesmú prekrývať. Pri otvorenej predchádzajúcej verzii najprv upravte jej obdobie na serveri.",
    "Okresy ważności wersji nie mogą się nakładać. Najpierw zamknij poprzednią wersję w backendzie.",
    "Version validity periods must not overlap. Close the previous open-ended version in the backend first."
  ],
  "Požadavky na zdroje byly uloženy.": [
    "Požiadavky na zdroje boli uložené.",
    "Wymagania dotyczące zasobów zapisano.",
    "Resource requirements saved."
  ],
  "Požadavky na zdroje": [
    "Požiadavky na zdroje",
    "Wymagania dotyczące zasobów",
    "Resource requirements"
  ],
  "Např. 1 kadeřník, 1 křeslo nebo 2 kusy vybavení.": [
    "Napr. 1 kaderník, 1 kreslo alebo 2 kusy vybavenia.",
    "Np. 1 fryzjer, 1 fotel lub 2 sztuki sprzętu.",
    "For example, 1 hairdresser, 1 chair, or 2 pieces of equipment."
  ],
  "Počet": [
    "Počet",
    "Liczba",
    "Quantity"
  ],
  "Min. kapacita": [
    "Min. kapacita",
    "Min. pojemność",
    "Min. capacity"
  ],
  "+ Přidat požadavek": [
    "+ Pridať požiadavku",
    "+ Dodaj wymaganie",
    "+ Add requirement"
  ],
  "Pro univerzální rezervace musí být alespoň jeden požadavek. Bez požadavků se používá původní rezervace s konkrétním zaměstnancem.": [
    "Pre univerzálne rezervácie musí byť aspoň jedna požiadavka. Bez požiadaviek sa používa pôvodná rezervácia s konkrétnym zamestnancom.",
    "Rezerwacje uniwersalne wymagają co najmniej jednego zasobu. Bez wymagań używana jest starsza rezerwacja z wybranym pracownikiem.",
    "Universal bookings require at least one resource requirement. Without one, the legacy booking flow with a specific employee is used."
  ],
  "Uložit požadavky": [
    "Uložiť požiadavky",
    "Zapisz wymagania",
    "Save requirements"
  ],
  "Vítejte zpět": [
    "Vitajte späť",
    "Witaj ponownie",
    "Welcome back"
  ],
  "Heslo": [
    "Heslo",
    "Hasło",
    "Password"
  ],
  "Zadejte heslo": [
    "Zadajte heslo",
    "Wpisz hasło",
    "Enter password"
  ],
  "Přihlásit se": [
    "Prihlásiť sa",
    "Zaloguj się",
    "Sign in"
  ],
  "Nemáte účet?": [
    "Nemáte účet?",
    "Nie masz konta?",
    "Don't have an account?"
  ],
  "Vytvořit organizaci": [
    "Vytvoriť organizáciu",
    "Utwórz organizację",
    "Create organization"
  ],
  "Registrace proběhla. Zkontrolujte e-mail a potvrďte svůj účet.": [
    "Registrácia prebehla. Skontrolujte e-mail a potvrďte svoj účet.",
    "Rejestracja zakończona. Sprawdź e-mail i potwierdź konto.",
    "Registration successful. Check your email to verify your account."
  ],
  "Začněte bookanearvat": [
    "Začnite bookanearvať",
    "Zacznij przyjmować rezerwacje",
    "Start taking bookings"
  ],
  "Vaše jméno": [
    "Vaše meno",
    "Twoje imię i nazwisko",
    "Your name"
  ],
  "Heslo (min. 12 znaků)": [
    "Heslo (min. 12 znakov)",
    "Hasło (min. 12 znaków)",
    "Password (min. 12 characters)"
  ],
  "Vytvořit účet": [
    "Vytvoriť účet",
    "Utwórz konto",
    "Create account"
  ],
  "Už máte účet?": [
    "Už máte účet?",
    "Masz już konto?",
    "Already have an account?"
  ],
  "Ověření e-mailu": [
    "Overenie e-mailu",
    "Weryfikacja e-maila",
    "Email verification"
  ],
  "Účet je ověřený": [
    "Účet je overený",
    "Konto zweryfikowane",
    "Account verified"
  ],
  "Nyní se můžete přihlásit do administrace.": [
    "Teraz sa môžete prihlásiť do administrácie.",
    "Możesz teraz zalogować się do panelu administracyjnego.",
    "You can now sign in to the admin area."
  ],
  "Přejít na přihlášení": [
    "Prejsť na prihlásenie",
    "Przejdź do logowania",
    "Go to sign in"
  ],
  "Ověřovací token": [
    "Overovací token",
    "Token weryfikacyjny",
    "Verification token"
  ],
  "Token z e-mailu": [
    "Token z e-mailu",
    "Token z e-maila",
    "Token from email"
  ],
  "Ověřit e-mail": [
    "Overiť e-mail",
    "Zweryfikuj e-mail",
    "Verify email"
  ],
  "JEDNO MÍSTO PRO VŠECHNY REZERVACE": [
    "JEDNO MIESTO PRE VŠETKY REZERVÁCIE",
    "JEDNO MIEJSCE NA WSZYSTKIE REZERWACJE",
    "ONE PLACE FOR ALL BOOKINGS"
  ],
  "Více času na to,": [
    "Viac času na to,",
    "Więcej czasu na to,",
    "More time for"
  ],
  "co vás baví.": [
    "čo vás baví.",
    "co lubisz.",
    "what you love."
  ],
  "Rezervace, pobočky, tým a zákazníci přehledně na jednom místě.": [
    "Rezervácie, pobočky, tím a zákazníci prehľadne na jednom mieste.",
    "Rezerwacje, lokalizacje, zespół i klienci w jednym miejscu.",
    "Bookings, locations, staff, and customers in one place."
  ],
  "Bezpečná správa dat": [
    "Bezpečná správa dát",
    "Bezpieczne zarządzanie danymi",
    "Secure data management"
  ],
  "Vše pod kontrolou": [
    "Všetko pod kontrolou",
    "Wszystko pod kontrolą",
    "Everything under control"
  ],
  "Přístup podle rolí": [
    "Prístup podľa rolí",
    "Dostęp według ról",
    "Role-based access"
  ],
  "Úvodní stránka": [
    "Úvodná stránka",
    "Strona główna",
    "Home page"
  ],
  "Přehled": [
    "Prehľad",
    "Przegląd",
    "Overview"
  ],
  "Tým a směny": [
    "Tím a zmeny",
    "Zespół i zmiany",
    "Team & shifts"
  ],
  "Načítám data…": [
    "Načítavam údaje…",
    "Ładowanie danych…",
    "Loading data…"
  ],
  "Zatím tu nic není": [
    "Zatiaľ tu nič nie je",
    "Na razie nic tu nie ma",
    "Nothing here yet"
  ],
  "Hledat…": [
    "Hľadať…",
    "Szukaj…",
    "Search…"
  ],
  "Strana {page} z {total}": [
    "Strana {page} z {total}",
    "Strona {page} z {total}",
    "Page {page} of {total}"
  ],
  "Uložit změny": [
    "Uložiť zmeny",
    "Zapisz zmiany",
    "Save changes"
  ],
  "Přidat": [
    "Pridať",
    "Dodaj",
    "Add"
  ],
  "Uložit": [
    "Uložiť",
    "Zapisz",
    "Save"
  ],
  "Nastala neočekávaná chyba.": [
    "Nastala neočakávaná chyba.",
    "Wystąpił nieoczekiwany błąd.",
    "An unexpected error occurred."
  ],
  "Jméno nebo e-mail": [
    "Meno alebo e-mail",
    "Imię lub e-mail",
    "Name or email"
  ],
  "Zatím nevybráno": [
    "Zatiaľ nevybrané",
    "Jeszcze nie wybrano",
    "Not selected yet"
  ],
  "Adresa není uvedena": [
    "Adresa nie je uvedená",
    "Nie podano adresu",
    "Address not provided"
  ],
  "Profesionální služba pro vás.": [
    "Profesionálna služba pre vás.",
    "Profesjonalna usługa dla Ciebie.",
    "Professional service for you."
  ],
  "Délka dle výběru": [
    "Dĺžka podľa výberu",
    "Dowolny czas trwania",
    "Custom duration"
  ],
  "Rezervace termínu": [
    "Rezervácia termínu",
    "Rezerwacja terminu",
    "Book an appointment"
  ],
  "Vyberte službu": [
    "Vyberte službu",
    "Wybierz usługę",
    "Choose service"
  ],
  "Vyberte termín": [
    "Vyberte termín",
    "Wybierz termin",
    "Choose a time"
  ],
  "Kontaktní údaje": [
    "Kontaktné údaje",
    "Dane kontaktowe",
    "Contact details"
  ],
  "Potvrzení": [
    "Potvrdenie",
    "Potwierdzenie",
    "Confirmation"
  ],
  "Přihlaste se do správy svého provozu.": [
    "Prihláste sa do správy svojej prevádzky.",
    "Zaloguj się, aby zarządzać swoją działalnością.",
    "Sign in to manage your business."
  ],
  "Vytvořte organizaci a nastavte své pobočky.": [
    "Vytvorte organizáciu a nastavte svoje pobočky.",
    "Utwórz organizację i skonfiguruj lokalizacje.",
    "Create an organization and set up your locations."
  ],
  "Potvrďte svou e-mailovou adresu.": [
    "Potvrďte svoju e-mailovú adresu.",
    "Potwierdź swój adres e-mail.",
    "Confirm your email address."
  ],
  "errors.NETWORK_ERROR": [
    "Nepodarilo sa spojiť so serverom. Skúste to znova.",
    "Nie można połączyć się z serwerem. Spróbuj ponownie.",
    "Cannot connect to the server. Please try again."
  ],
  "errors.AUTH_REQUIRED": [
    "Platnosť prihlásenia vypršala. Prihláste sa znova.",
    "Sesja wygasła. Zaloguj się ponownie.",
    "Your session has expired. Please sign in again."
  ],
  "errors.ACCESS_DENIED": [
    "Na túto akciu nemáte oprávnenie.",
    "Nie masz uprawnień do wykonania tej czynności.",
    "You don't have permission to perform this action."
  ],
  "errors.NOT_FOUND": [
    "Požadovaný záznam sa nenašiel.",
    "Nie znaleziono żądanego elementu.",
    "The requested item was not found."
  ],
  "errors.VALIDATION_ERROR": [
    "Skontrolujte zadané údaje a skúste to znova.",
    "Sprawdź wprowadzone dane i spróbuj ponownie.",
    "Please check your input and try again."
  ],
  "errors.CONFLICT": [
    "Údaje sa medzitým zmenili alebo vznikla kolízia. Obnovte stránku a skúste to znova.",
    "Dane uległy zmianie lub wystąpił konflikt. Odśwież stronę i spróbuj ponownie.",
    "The data changed or a conflict occurred. Refresh and try again."
  ],
  "errors.RATE_LIMITED": [
    "Príliš veľa požiadaviek. Skúste to o chvíľu.",
    "Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
    "Too many requests. Please try again shortly."
  ],
  "errors.FILE_TOO_LARGE": [
    "Súbor je príliš veľký.",
    "Plik jest zbyt duży.",
    "The file is too large."
  ],
  "errors.SERVICE_UNAVAILABLE": [
    "Služba je dočasne nedostupná. Skúste to neskôr.",
    "Usługa jest tymczasowo niedostępna. Spróbuj później.",
    "The service is temporarily unavailable. Try again later."
  ],
  "errors.SERVER_ERROR": [
    "Na serveri nastala chyba. Skúste to neskôr.",
    "Wystąpił błąd serwera. Spróbuj później.",
    "A server error occurred. Please try again later."
  ],
  "errors.UNKNOWN_ERROR": [
    "Niečo sa nepodarilo. Skúste to znova.",
    "Coś poszło nie tak. Spróbuj ponownie.",
    "Something went wrong. Please try again."
  ],
  "errors.SLOT_UNAVAILABLE": [
    "Vybraný termín už nie je voľný. Vyberte iný.",
    "Wybrany termin nie jest już dostępny. Wybierz inny.",
    "The selected time is no longer available. Choose another slot."
  ],
  "errors.INSUFFICIENT_RESOURCES": [
    "Pre vybraný termín nie je dostatok voľných zdrojov.",
    "Brak wystarczających zasobów w wybranym terminie.",
    "Not enough resources are available for the selected time."
  ],
  "errors.SCHEDULE_CONFLICT": [
    "Zmena sa prekrýva s inou zmenou alebo rezerváciou.",
    "Zmiana nakłada się na inną zmianę lub rezerwację.",
    "This shift overlaps another shift or booking."
  ],
  "errors.INVALID_BOOKING_DURATION": [
    "Zvolená dĺžka rezervácie nie je platná.",
    "Wybrany czas trwania rezerwacji jest nieprawidłowy.",
    "The selected booking duration is invalid."
  ],
  "errors.INVALID_BOOKING_LINK": [
    "Odkaz na rezerváciu je neplatný alebo jeho platnosť vypršala.",
    "Link do rezerwacji jest nieprawidłowy lub wygasł.",
    "This booking link is invalid or expired."
  ],
  "errors.UNSUPPORTED_IMAGE": [
    "Použite platný obrázok JPEG alebo PNG.",
    "Prześlij prawidłowy obraz JPEG lub PNG.",
    "Please upload a valid JPEG or PNG image."
  ],
  "errors.INVALID_CREDENTIALS": [
    "Nesprávny e-mail alebo heslo.",
    "Nieprawidłowy adres e-mail lub hasło.",
    "Incorrect email or password."
  ],
  "errors.EMAIL_NOT_VERIFIED": [
    "Najprv potvrďte svoju e-mailovú adresu.",
    "Najpierw potwierdź swój adres e-mail.",
    "Please verify your email address first."
  ],
  "errors.EVENT_FULL": ["Udalosť je plná. Vyberte menej miest alebo iný termín.", "Wydarzenie jest pełne. Wybierz mniej miejsc lub inny termin.", "This event is full. Choose fewer seats or another session."],
  "errors.SETUP_LOCKED": ["Typ rezervácií je už uzamknutý. Kontaktujte správcu.", "Typ rezerwacji jest zablokowany. Skontaktuj się z administratorem.", "The booking model is locked. Contact support."],
  "errors.RESOURCE_NOT_FOUND": [
    "Vybraný zdroj sa nenašiel.",
    "Nie znaleziono wybranego zasobu.",
    "The selected resource was not found."
  ],
  "Jazyk": [
    "Jazyk",
    "Język",
    "Language"
  ],
  "Barevné schéma": [
    "Farebná schéma",
    "Motyw kolorystyczny",
    "Color theme"
  ],
  "Vzhled a jazyk": [
    "Vzhľad a jazyk",
    "Wygląd i język",
    "Appearance & language"
  ],
  "Zvolte jazyk rozhraní a barevné schéma administrace. Volby se uloží do tohoto prohlížeče.": [
    "Zvoľte jazyk rozhrania a farebnú schému administrácie. Voľby sa uložia do tohto prehliadača.",
    "Wybierz język interfejsu i motyw kolorystyczny panelu. Ustawienia zostaną zapisane w tej przeglądarce.",
    "Choose your interface language and admin color theme. Preferences are saved in this browser."
  ],
  "Pondělí": [
    "Pondelok",
    "Poniedziałek",
    "Monday"
  ],
  "Úterý": [
    "Utorok",
    "Wtorek",
    "Tuesday"
  ],
  "Středa": [
    "Streda",
    "Środa",
    "Wednesday"
  ],
  "Čtvrtek": [
    "Štvrtok",
    "Czwartek",
    "Thursday"
  ],
  "Pátek": [
    "Piatok",
    "Piątek",
    "Friday"
  ],
  "Sobota": [
    "Sobota",
    "Sobota",
    "Saturday"
  ],
  "Neděle": [
    "Nedeľa",
    "Niedziela",
    "Sunday"
  ],
  "Potvrzeno": [
    "Potvrdené",
    "Potwierdzono",
    "Confirmed"
  ],
  "Čeká": [
    "Čaká",
    "Oczekuje",
    "Pending"
  ],
  "Dokončeno": [
    "Dokončené",
    "Zakończono",
    "Completed"
  ],
  "Zrušeno": [
    "Zrušené",
    "Anulowano",
    "Cancelled"
  ],
  "Dobrý den 👋": [
    "Dobrý deň 👋",
    "Dzień dobry 👋",
    "Hello 👋"
  ],
  "Vyberte všechny údaje rezervace.": [
    "Vyberte všetky údaje rezervácie.",
    "Wybierz wszystkie dane rezerwacji.",
    "Complete all booking details."
  ],
  "Vyberte pracovníka.": [
    "Vyberte pracovníka.",
    "Wybierz pracownika.",
    "Choose a staff member."
  ],
  "Čas vrácení musí být po začátku rezervace.": [
    "Čas vrátenia musí byť po začiatku rezervácie.",
    "Godzina zwrotu musi być późniejsza niż początek rezerwacji.",
    "The return time must be after the booking start."
  ],
  "Použij JPEG nebo PNG.": [
    "Použite JPEG alebo PNG.",
    "Użyj JPEG lub PNG.",
    "Use JPEG or PNG."
  ],
  "Soubor je větší než 10 MB.": [
    "Súbor je väčší než 10 MB.",
    "Plik ma ponad 10 MB.",
    "The file exceeds 10 MB."
  ],
  "Rozvrh byl uložen.": [
    "Rozvrh bol uložený.",
    "Grafik zapisany.",
    "Schedule saved."
  ],
  "Pracovní doba": [
    "Pracovný čas",
    "Godziny pracy",
    "Working hours"
  ],
  "Upravit zákazníka": [
    "Upraviť zákazníka",
    "Edytuj klienta",
    "Edit customer"
  ],
  "Upravit pobočku": [
    "Upraviť pobočku",
    "Edytuj lokalizację",
    "Edit location"
  ],
  "Nabídka služeb byla uložena.": [
    "Ponuka služieb bola uložená.",
    "Oferta usług została zapisana.",
    "Service offering saved."
  ],
  "Upravit zaměstnance": [
    "Upraviť zamestnanca",
    "Edytuj pracownika",
    "Edit employee"
  ],
  "Nový zaměstnanec": [
    "Nový zamestnanec",
    "Nowy pracownik",
    "New employee"
  ],
  "Přiřazení poboček uloženo.": [
    "Priradenie pobočiek bolo uložené.",
    "Przypisania lokalizacji zapisane.",
    "Location assignments saved."
  ],
  "Prostor / stůl": [
    "Priestor / stôl",
    "Pomieszczenie / stolik",
    "Space / table"
  ],
  "Vybavení": [
    "Vybavenie",
    "Sprzęt",
    "Equipment"
  ],
  "Ostatní": [
    "Ostatné",
    "Inne",
    "Other"
  ],
  "Nový typ zdroje": [
    "Nový typ zdroja",
    "Nowy typ zasobu",
    "New resource type"
  ],
  "Nový zdroj": [
    "Nový zdroj",
    "Nowy zasób",
    "New resource"
  ],
  "Upravit zdroj": [
    "Upraviť zdroj",
    "Edytuj zasób",
    "Edit resource"
  ],
  "Upravit typ zdroje": [
    "Upraviť typ zdroja",
    "Edytuj typ zasobu",
    "Edit resource type"
  ],
  "Upravit službu": [
    "Upraviť službu",
    "Edytuj usługę",
    "Edit service"
  ],
  "Volitelná délka": [
    "Voliteľná dĺžka",
    "Zmienny czas trwania",
    "Custom duration"
  ],
  "Vítejte v administraci {organization}. Tady máte přehled toho nejdůležitějšího.": [
    "Vitajte v administrácii {organization}. Tu máte prehľad toho najdôležitejšieho.",
    "Witaj w panelu organizacji {organization}. Oto przegląd najważniejszych informacji.",
    "Welcome to {organization}'s admin area. Here's an overview of what matters most."
  ],
  "vaší organizace": [
    "vašej organizácie",
    "Twojej organizacji",
    "your organization"
  ],
  "Podle dostupných záznamů": [
    "Podľa dostupných záznamov",
    "Na podstawie dostępnych danych",
    "Based on available records"
  ],
  "Z posledních načtených rezervací": [
    "Z posledných načítaných rezervácií",
    "Z ostatnio pobranych rezerwacji",
    "From recently loaded bookings"
  ],
  "V organizaci": [
    "V organizácii",
    "W organizacji",
    "In organization"
  ],
  "Administrace": [
    "Administrácia",
    "Administracja",
    "Admin"
  ],
  "Neznámý stav": [
    "Neznámy stav",
    "Nieznany status",
    "Unknown status"
  ],
  "Neznámá role": [
    "Neznáma rola",
    "Nieznana rola",
    "Unknown role"
  ],
  "Ověřit adresu na mapě": ["Overiť adresu na mape", "Sprawdź adres na mapie", "Check address on the map"],
  "Vyberte správné místo:": ["Vyberte správne miesto:", "Wybierz właściwe miejsce:", "Choose the correct location:"],
  "Zadejte úplnější adresu včetně obce.": ["Zadajte úplnejšiu adresu vrátane obce.", "Wpisz dokładniejszy adres wraz z miejscowością.", "Enter a fuller address including the city."],
  "Adresu se nepodařilo najít. Doplňte město a číslo domu nebo zkuste jiný zápis.": ["Adresu sa nepodarilo nájsť. Doplňte mesto a číslo domu.", "Nie znaleziono adresu. Dodaj miasto i numer budynku.", "Address not found. Add a city and building number."],
  "Poloha vybrána": ["Poloha vybraná", "Wybrano lokalizację", "Location selected"],
  "Otevřít mapu": ["Otvoriť mapu", "Otwórz mapę", "Open map"],
  "Geokódování určuje polohu podle mapových dat, neověřuje oficiální doručitelnost adresy.": ["Geokódovanie určuje polohu podľa mapových údajov, neoveruje doručiteľnosť adresy.", "Geokodowanie określa lokalizację na podstawie mapy, nie potwierdza adresu pocztowego.", "Geocoding locates an address on a map; it does not verify postal deliverability."],
  "Mapa": ["Mapa", "Mapa", "Map"],
  "Zobrazit na mapě": ["Zobraziť na mape", "Pokaż na mapie", "Show on map"],
  "Výjimky a svátky": ["Výnimky a sviatky", "Wyjątki i święta", "Exceptions and holidays"],
  "Volno a výjimky": ["Voľno a výnimky", "Nieobecności i wyjątki", "Time off and exceptions"],
  "Pobočka pro výjimku": ["Pobočka pre výnimku", "Lokalizacja dla wyjątku", "Location for exception"],
  "Zvolte pobočku, ve které chcete změnit směnu v konkrétní den.": ["Vyberte pobočku, kde chcete zmeniť zmenu v konkrétny deň.", "Wybierz lokalizację, w której chcesz zmienić grafik w danym dniu.", "Select a location to change a shift on a specific date."],
  "Jednorázové změny směn": ["Jednorazové zmeny zmien", "Jednorazowe zmiany grafiku", "One-off shift changes"],
  "Svátky a výjimečná otevírací doba": ["Sviatky a výnimočné otváracie hodiny", "Święta i wyjątkowe godziny otwarcia", "Holidays and special opening hours"],
  "Dovolená, nemoc, kratší směna či mimořádné hodiny konkrétního pracovníka.": ["Dovolenka, choroba, kratšia zmena či mimoriadne hodiny pracovníka.", "Urlop, choroba, krótsza zmiana lub wyjątkowe godziny pracownika.", "Leave, sick days, shorter shifts or special hours for a worker."],
  "Zavřeno o svátku, mimořádné otevření nebo kratší provoz na vybraný den.": ["Zatvorené cez sviatok, mimoriadne otvorenie alebo skrátená prevádzka.", "Zamknięcie w święto, wyjątkowe otwarcie lub krótsze godziny pracy.", "Close for a holiday, open exceptionally or shorten hours on a specific day."],
  "Změna platí jen ve vybraný den.": ["Zmena platí len vo vybraný deň.", "Zmiana dotyczy tylko wybranego dnia.", "The change applies only to the selected date."],
  "Datum": ["Dátum", "Data", "Date"],
  "Režim": ["Režim", "Tryb", "Mode"],
  "Celý den volno": ["Celý deň voľno", "Cały dzień wolny", "Day off"],
  "Celý den zavřeno": ["Celý deň zatvorené", "Zamknięte cały dzień", "Closed all day"],
  "Vlastní intervaly": ["Vlastné intervaly", "Własne przedziały godzinowe", "Custom hours"],
  "Přidat časový interval": ["Pridať časový interval", "Dodaj przedział godzinowy", "Add time interval"],
  "Uložit výjimku": ["Uložiť výnimku", "Zapisz wyjątek", "Save exception"],
  "Před uložením se ověří kolize s existujícími rezervacemi. Rezervace se automaticky neruší. Výjimka nahrazuje týdenní rozvrh jen pro dané datum.": ["Pred uložením sa skontrolujú kolízie s rezerváciami. Rezervácie sa automaticky nerušia.", "Przed zapisem sprawdzane są konflikty z rezerwacjami. Rezerwacje nie są automatycznie anulowane.", "Existing booking conflicts are checked first. Bookings are never automatically cancelled."],
  "Naplánované výjimky (následujících 365 dní)": ["Naplánované výnimky (365 dní)", "Zaplanowane wyjątki (najbliższe 365 dni)", "Planned exceptions (next 365 days)"],
  "Zatím nemáte žádné výjimky.": ["Zatiaľ nemáte žiadne výnimky.", "Nie masz jeszcze wyjątków.", "No exceptions scheduled yet."],
  "Vrátit běžný rozvrh": ["Vrátiť bežný rozvrh", "Przywróć zwykły grafik", "Restore regular schedule"],
  "Zavřeno": ["Zatvorené", "Zamknięte", "Closed"],
  "Volno": ["Voľno", "Wolne", "Day off"],
  "Datum nemůže být v minulosti.": ["Dátum nemôže byť v minulosti.", "Data nie może być w przeszłości.", "Date cannot be in the past."],
  "Zkontrolujte časy. Intervaly se nesmějí překrývat a konec musí být později než začátek.": ["Skontrolujte časy. Intervaly sa nesmú prekrývať.", "Sprawdź godziny. Przedziały nie mogą na siebie zachodzić.", "Check the times. Intervals cannot overlap."],
  "Neuloženo.": ["Neuložené.", "Nie zapisano.", "Not saved."],
  "Nejprve rezervace upravte nebo zrušte ručně.": ["Najprv rezervácie upravte alebo zrušte ručne.", "Najpierw ręcznie zmień lub anuluj rezerwacje.", "Change or cancel affected bookings manually first."],
  "Ostatní dny beze změny.": ["Ostatné dni bez zmeny.", "Pozostałe dni bez zmian.", "Other days are unchanged."],
  "Znovu platí běžný rozvrh.": ["Znovu platí bežný rozvrh.", "Przywrócono zwykły grafik.", "Regular schedule restored."],
  "Změna by zasáhla {count} existujících rezervací.": ["Zmena by zasiahla {count} existujúcich rezervácií.", "Zmiana wpłynęłaby na {count} istniejących rezerwacji.", "This would affect {count} existing bookings."],
  "Vrácení rozvrhu by zasáhlo {count} rezervací.": ["Obnovenie rozvrhu by zasiahlo {count} rezervácií.", "Przywrócenie grafiku wpłynęłoby na {count} rezerwacji.", "Restoring the schedule would affect {count} bookings."],
  "Výjimka pro {date} byla uložena.": ["Výnimka pre {date} bola uložená.", "Zapisano wyjątek na {date}.", "Exception saved for {date}."],
  "Pro {date} opět platí běžný rozvrh.": ["Pre {date} opäť platí bežný rozvrh.", "Dnia {date} znów obowiązuje zwykły grafik.", "Regular schedule applies again on {date}."],
  "Vrátit {date} k běžnému týdennímu rozvrhu?": ["Vrátiť {date} k bežnému týždennému rozvrhu?", "Przywrócić zwykły grafik na {date}?", "Restore the regular weekly schedule for {date}?"],

  "errors.INVALID_RESET_TOKEN": ["Odkaz na obnovenie hesla je neplatný alebo vypršal.", "Link do resetowania hasła jest nieprawidłowy lub wygasł.", "The password reset link is invalid or expired."],
  "Zapomněli jste heslo?": ["Zabudli ste heslo?", "Nie pamiętasz hasła?", "Forgot your password?"],
  "Obnovení hesla": ["Obnovenie hesla", "Resetowanie hasła", "Password recovery"],
  "Pošleme vám odkaz pro nastavení nového hesla.": ["Pošleme vám odkaz na nastavenie nového hesla.", "Wyślemy link do ustawienia nowego hasła.", "We'll email you a link to set a new password."],
  "Zkontrolujte svou e-mailovou schránku": ["Skontrolujte e-mailovú schránku", "Sprawdź skrzynkę e-mail", "Check your inbox"],
  "Pokud pro zadaný e-mail existuje účet, poslali jsme odkaz pro změnu hesla.": ["Ak účet existuje, poslali sme odkaz na zmenu hesla.", "Jeśli konto istnieje, wysłaliśmy link do zmiany hasła.", "If an account exists, we have emailed a password reset link."],
  "Poslat odkaz na obnovu hesla": ["Odoslať odkaz na obnovenie hesla", "Wyślij link do resetowania hasła", "Send password reset link"],
  "Zpět na přihlášení": ["Späť na prihlásenie", "Powrót do logowania", "Back to login"],
  "Nastavení nového hesla": ["Nastavenie nového hesla", "Ustaw nowe hasło", "Set a new password"],
  "Zadejte nové heslo pro svůj účet Bookanear.": ["Zadajte nové heslo pre účet Bookanear.", "Ustaw nowe hasło do konta Bookanear.", "Choose a new password for your Bookanear account."],
  "Hesla se neshodují.": ["Heslá sa nezhodujú.", "Hasła nie są identyczne.", "Passwords do not match."],
  "Heslo bylo změněno": ["Heslo bolo zmenené", "Hasło zostało zmienione", "Password changed"],
  "Nyní se můžete přihlásit novým heslem.": ["Teraz sa môžete prihlásiť novým heslom.", "Możesz teraz zalogować się nowym hasłem.", "You can now log in with your new password."],
  "Odkaz pro obnovu hesla je neplatný. Požádejte o nový.": ["Odkaz na obnovenie hesla je neplatný. Požiadajte o nový.", "Link do resetowania hasła jest nieprawidłowy. Poproś o nowy.", "This password reset link is invalid. Request a new one."],
  "Požádat o nový odkaz": ["Požiadať o nový odkaz", "Poproś o nowy link", "Request a new link"],
  "Nové heslo (min. 12 znaků)": ["Nové heslo (min. 12 znakov)", "Nowe hasło (min. 12 znaków)", "New password (min. 12 characters)"],
  "Zopakujte nové heslo": ["Zopakujte nové heslo", "Powtórz nowe hasło", "Confirm new password"],
  "Uložit nové heslo": ["Uložiť nové heslo", "Zapisz nowe hasło", "Save new password"],
  "LIDÉ A PRACOVNÍ DOBA": ["ĽUDIA A PRACOVNÝ ČAS", "ZESPÓŁ I GODZINY PRACY", "TEAM AND WORKING HOURS"],
  "Zaměstnanci mohou pracovat na více pobočkách. Jejich pracovní doba se nesmí překrývat.": ["Zamestnanci môžu pracovať na viacerých pobočkách. Pracovný čas sa nesmie prekrývať.", "Pracownicy mogą pracować w kilku lokalizacjach. Ich godziny pracy nie mogą się pokrywać.", "Employees may work across locations without overlapping working hours."],
  "Změna pracovní doby": ["Zmena pracovného času", "Zmiana godzin pracy", "Working hours change"],
  "Žádosti o volno a změny pracovní doby": ["Žiadosti o voľno a zmeny pracovného času", "Wnioski o urlop i zmianę godzin pracy", "Time off and working hours requests"],
  "Pracovník požádá o volno nebo úpravu pracovní doby. Změna se projeví až po schválení, pokud nemá povolené vlastní schvalování.": ["Pracovník požiada o voľno alebo úpravu pracovného času. Zmena sa uplatní až po schválení.", "Pracownik prosi o urlop lub zmianę godzin pracy. Zmiana wymaga zatwierdzenia, chyba że sam może ją zatwierdzać.", "Employees can request time off or changes to working hours. Approval is needed unless self-approval is enabled."],
  "Formát data": ["Formát dátumu", "Format daty", "Date format"],
  "Jednorázové změny pracovní doby": ["Jednorazové zmeny pracovného času", "Jednorazowe zmiany godzin pracy", "One-off working hours changes"],
  "Dovolená, nemoc, zkrácená pracovní doba nebo mimořádné pracovní hodiny.": ["Dovolenka, choroba, skrátený pracovný čas alebo mimoriadne hodiny.", "Urlop, choroba, krótszy czas pracy lub niestandardowe godziny.", "Holiday, illness, shorter working hours or special hours."],
  "Pracovní doba a služby": ["Pracovný čas a služby", "Godziny pracy i usługi", "Working hours and services"],
  "Může si sám schvalovat volno a změny pracovní doby": ["Môže si sám schvaľovať voľno a zmeny pracovného času", "Może sam zatwierdzać urlopy i zmiany godzin pracy", "Can approve own time off and working hours changes"],
  "Tým a pracovní doba": ["Tím a pracovný čas", "Zespół i godziny pracy", "Team and working hours"],
  "Zvolte pobočku, ve které chcete upravit pracovní dobu ve vybraném dni.": ["Zvoľte pobočku, kde chcete upraviť pracovný čas v daný deň.", "Wybierz lokalizację, w której chcesz zmienić godziny pracy w danym dniu.", "Choose a location to change working hours on a specific date."],
  "Pracovní doba se nesmí překrývat s pracovní dobou na jiné pobočce ani s existujícími rezervacemi.": ["Pracovný čas sa nesmie prekrývať medzi pobočkami ani s rezerváciami.", "Godziny pracy nie mogą się pokrywać między lokalizacjami ani z rezerwacjami.", "Working hours must not overlap between locations or with existing bookings."],
};
const csErrors: Record<string,string> = {
  "errors.NETWORK_ERROR": "Nelze se spojit se serverem. Zkuste to znovu.",
  "errors.AUTH_REQUIRED": "Přihlášení vypršelo. Přihlaste se znovu.",
  "errors.ACCESS_DENIED": "K této akci nemáte oprávnění.",
  "errors.NOT_FOUND": "Požadovaný záznam nebyl nalezen.",
  "errors.VALIDATION_ERROR": "Zkontrolujte zadané údaje a zkuste to znovu.",
  "errors.CONFLICT": "Údaje se mezitím změnily nebo vznikla kolize. Obnovte stránku a zkuste to znovu.",
  "errors.RATE_LIMITED": "Příliš mnoho požadavků. Zkuste to za chvíli.",
  "errors.FILE_TOO_LARGE": "Soubor je příliš velký.",
  "errors.SERVICE_UNAVAILABLE": "Služba je dočasně nedostupná. Zkuste to později.",
  "errors.SERVER_ERROR": "Na serveru nastala chyba. Zkuste to později.",
  "errors.UNKNOWN_ERROR": "Něco se nepovedlo. Zkuste to znovu.",
  "errors.SLOT_UNAVAILABLE": "Vybraný termín už není volný. Vyberte jiný.",
  "errors.INSUFFICIENT_RESOURCES": "Pro vybraný termín není dostatek volných zdrojů.",
  "errors.SCHEDULE_CONFLICT": "Pracovní doba se překrývá s jinou pracovní dobou nebo rezervací.",
  "errors.INVALID_BOOKING_DURATION": "Zvolená délka rezervace není platná.",
  "errors.INVALID_BOOKING_LINK": "Odkaz na rezervaci je neplatný nebo vypršel.",
  "errors.UNSUPPORTED_IMAGE": "Použijte platný obrázek JPEG nebo PNG.",
  "errors.INVALID_CREDENTIALS": "Nesprávný e-mail nebo heslo.",
  "errors.EMAIL_NOT_VERIFIED": "Nejdříve potvrďte svou e-mailovou adresu.",
  "errors.EVENT_FULL": "Událost je plná. Zvolte menší počet míst nebo jiný termín.",
  "errors.SETUP_LOCKED": "Typ rezervací je již uzamčen. Obraťte se na správce platformy.",
  "errors.INVALID_RESET_TOKEN": "Odkaz pro obnovu hesla je neplatný nebo vypršel.",
  "errors.RESOURCE_NOT_FOUND": "Vybraný zdroj nebyl nalezen."
};

export function translate(value: string, language: Language = currentLanguage()): string {
  const trimmed = value.trim();
  const translated = language === 'cs' ? (csErrors[trimmed] || trimmed) :
    (translations[trimmed]?.[{ sk: 0, pl: 1, en: 2 }[language]] || csErrors[trimmed] || trimmed);
  return value.slice(0, value.indexOf(trimmed)) + translated + value.slice(value.indexOf(trimmed) + trimmed.length);
}
export const tr = translate;
export function translateWith(value: string, vars: Record<string, string | number>, language?: Language) {
  return translate(value, language).replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
