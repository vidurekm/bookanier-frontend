# Bookanear Frontend V6

Frontend používá API s migrací V6. Nové stránky: onboarding v administraci, `/admin/udalosti`, veřejné rezervace událostí a správa události.

`npm ci && npm run dev` pro lokální vývoj; `npm ci && npm run build` pro produkci.

Jazyk, barevné téma a světlý/tmavý vzhled jsou uložené v localStorage daného prohlížeče.

Při jediném provozním místě se výběr pobočky na veřejném webu přeskočí. Admin navigace se mění podle `organization_booking_config`.

Samostatný frontend potřebuje backend se stejnou V6; s původním API onboarding a události nebudou fungovat.
