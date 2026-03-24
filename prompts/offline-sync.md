# Prompt: Offline-Sync Strategie

## Zeitpunkt
Mitte Maerz 2026, waehrend US-12/US-13

## Kontext
Die groesste technische Herausforderung war die Offline-Faehigkeit. Aenderungen muessen lokal zwischengespeichert und spaeter mit dem Server abgeglichen werden. Dazu kam noch die Frage: Was passiert wenn zwei Leute gleichzeitig dasselbe Produkt aendern?

## Prompt (sinngemaess)
"Wie bauen wir eine Offline-Sync Loesung fuer eine PWA Einkaufslisten-App? Der Benutzer soll offline Produkte hinzufuegen, bearbeiten und loeschen koennen. Wenn er wieder online ist sollen die Aenderungen automatisch zum Server geschickt werden. Was ist der einfachste Ansatz der trotzdem zuverlaessig funktioniert?"

## Ergebnis
- `pendingChanges` Tabelle in IndexedDB (Dexie.js): Jede Offline-Aenderung wird mit Typ, Entity, Payload und Zeitstempel gespeichert
- Batch-Sync-Endpoint: `POST /api/lists/{listId}/sync` nimmt eine Liste von Aenderungen entgegen und verarbeitet sie einzeln
- Server-Wins bei Konflikten: Die einfachste Strategie die fuer Einkaufslisten auch Sinn ergibt
- Versionsfeld auf Product und ShoppingList: Bei jedem Update wird die Version inkrementiert
- 409 CONFLICT Response wenn Client-Version < Server-Version

## Was wir daraus mitgenommen haben
Server-Wins war die richtige Entscheidung. In der Praxis passieren Konflikte bei Einkaufslisten fast nie, weil verschiedene Leute verschiedene Produkte bearbeiten. Ein ausgefeiltes 3-Way-Merge waere Overkill gewesen.
