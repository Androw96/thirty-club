# 30th in the 30s

Zártkörű születésnapi meghívóoldal a harmincas évek stílusában. Önálló statikus GitHub Pages oldal (main ág / gyökér).

- **Meghívó:** minden vendég saját linket kap (`?m=<token>`). Link nélkül az oldal csak a zárt ajtót mutatja.
- **Admin:** `admin.html` – vendégek hozzáadása, linkek és kész meghívó üzenetek másolása, az est adatai (dátum, helyszín, visszajelzés nyitva/zárva), ki nyitotta meg, ki jön, CSV export.
- **Háttér:** Google Apps Script webapp egy privát Google Táblázat mellett (`event.json` → `sheetUrl`). A szkript forrása nincs ebben a repóban; az admin kulcs a Script Properties `ADMIN_KEY` értéke.
- **E-mail értesítés:** FormSubmit (`event.json` → `formId`), minden visszajelzésnél. Nem kritikus: a válasz a táblázatban akkor is megvan, ha az e-mail késik.

Vendégadatok és titkos kulcsok nincsenek ebben a repóban.
