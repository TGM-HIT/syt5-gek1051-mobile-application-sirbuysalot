# promptverzeichnis - SirBuysALot

---

## prompt 1: kanban-board texte für alle stories generieren

```
ich hab eine einkaufslisten-pwa mit 24 user stories. gib mir für jede story einen fertigen text den ich direkt als github issue reinkopieren kann - titel, beschreibung, akzeptanzkriterien als checkliste. hier die stories:

1. einkaufsliste mit namen erstellen (3 SP, must have)
2. listennamen bearbeiten (3 SP, must have)
3. zugangscode/url generieren und teilen (5 SP, must have)
4. produkt hinzufügen - name pflicht, preis optional (3 SP, must have)
5. produkte mit tags/kategorien versehen (5 SP, must have)
6. preis nachträglich eintragen/ändern (3 SP, must have)
7. produkt als gekauft markieren/entmarkieren - durchgestrichen + ausgegraut (5 SP, must have)
8. wer/wann info bei markierten produkten anzeigen (3 SP, must have)
9. produkte in liste durchsuchen, auch mit einzelnen buchstaben (5 SP, must have)
10. produkt ausblenden - soft delete (3 SP, must have)
11. ausgeblendete produkte wiederherstellen (3 SP, must have)
12. offline-speicherung lokal mit zeitstempel (8 SP, must have)
13. auto-sync wenn wieder online (8 SP, must have)
14. sync-konflikte erkennen und aktuellste version anzeigen (5 SP, must have)
15. einkaufsliste ausblenden - soft delete (3 SP, should have)
16. ausgeblendete listen wiederherstellen (3 SP, should have)
17. deployment über öffentliche url (8 SP, should have)
18. darkmode (5 SP, should have)
19. p2p-sync mit bitchat (13 SP, nice to have)
20. tags verwalten - erstellen/bearbeiten/löschen (5 SP, nice to have)
21. produkte nach tags filtern (5 SP, nice to have)
22. gesamtkosten anzeigen (3 SP, nice to have)
23. drag & drop sortierung (5 SP, nice to have)
24. liste duplizieren (8 SP, nice to have)

techstack: vue 3 + vuetify 3, spring boot 3 (java 21), postgres, dexie.js (indexeddb), websockets für echtzeit-sync.
```

---

## prompt 2: sub-issues für US-12 offline-speicherung aufteilen

```
ich arbeite an US-12 "offline-speicherung" für meine einkaufslisten-pwa. die story:

"als benutzer möchte ich alle änderungen offline vornehmen können, wobei diese lokal mit zeitstempel gespeichert werden, damit ich auch ohne internet arbeiten kann." (8 SP)

akzeptanzkriterien:
- alle änderungen werden in indexeddb gespeichert
- änderungen erhalten einen zeitstempel
- ui zeigt offline-status an
- alle crud-operationen funktionieren ohne netzwerk
- lokale änderungen sind als "pending sync" markiert

techstack: vue 3 + vuetify 3, dexie.js, spring boot 3, postgres.

teil mir das in sub-issues auf - frontend, backend, tests etc. mit titel und kurzer beschreibung pro task.
```

---

## prompt 3: vue 3 komponente für US-04 produkt hinzufügen

```
bau mir eine vue 3 komponente (<script setup>, vuetify 3) für US-04 "produkt zu einkaufsliste hinzufügen":

- produktname ist pflichtfeld
- preis ist optional
- produkt erscheint sofort in der liste
- validierung: name darf nicht leer sein
- soll offline-fähig sein: speichere in dexie.js mit synced: false und zeitstempel
- mobile-first design

gib mir gleich den vitest unit-test dazu.
```

---

## prompt 4: spring boot endpoint für US-01 liste erstellen

```
mach mir den backend-code (spring boot 3, java 21, spring data jpa, postgres 16) für US-01 "neue einkaufsliste mit namen erstellen":

- benutzer gibt namen ein (mind. 1 zeichen)
- liste wird in postgres gespeichert
- liste erscheint in der übersicht
- leere namen werden abgelehnt

brauch: jpa entity mit uuid + timestamps, repository, service, rest controller (POST /api/lists) und junit 5 tests. soft-delete mit deletedAt feld vorbereiten.
```

---

## prompt 5: testdaten für den prototypen

```
ich brauch testdaten für meine einkaufslisten-app "SirBuysALot". mach mir:

1. sql inserts für postgres:
   - 3 listen: "wocheneinkauf", "grillparty samstag", "büro-snacks"
   - je 10-15 produkte mit realistischen namen, preisen und tags
   - 3 user: deniz, matei, julian
   - paar produkte als "gekauft" markiert mit zeitstempel und user
   - paar produkte soft-deleted

2. ein dexie.js seed-script mit denselben daten fürs offline-testen

nimm realistische österreichische supermarkt-produkte und preise in eur (billa/spar niveau).
```
