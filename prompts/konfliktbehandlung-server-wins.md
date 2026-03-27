# Prompt: Conflict Resolution - Server Wins Strategy

## When
Mid March 2026, during US-14 implementation

## Context
When two users edit the same product offline and then come back online, the server needs to decide whose version "wins". We discussed Last-Write-Wins, Server-Wins, and a proper 3-way merge. DR argued for Server-Wins because the complexity of 3-way merge wasn't worth it for a shopping list app.

## Prompt (paraphrased)
"Our offline-first app uses versioning. When a user comes back online with pending changes, the server checks if their local version matches the current server version. If not, we return 409 CONFLICT. The question is: what should the client do when it gets 409? Show the conflict to the user? Automatically overwrite? What data should we send back so the client can show a meaningful diff?"

## Ergebnis
- Backend sendet `409 Conflict` mit dem aktuellen Server-Stand im Response Body:
  ```json
  {
    "error": "VERSION_CONFLICT",
    "message": "Product was modified by another user",
    "serverVersion": 5,
    "serverData": { ... }
  }
  ```
- ConflictNotification.vue Komponente zeigt dem User beide Versionen
- User kann waehlen: "Meine Version behalten" oder "Server-Version nehmen"
- Die Loesung ist `Server Wins` - bei Einkaufslisten ist das voellig OK weil die Aenderungen meist komplementaer sind

## Was wir daraus mitgenommen haben
Server-Wins ist eine valide Strategie fuer Apps wo Konflikte selten sind. Wenn User A Aepfel und User B Birnen kauft, gibt es nie einen Konflikt. Konflikte entstehen nur wenn beide gleichzeitig dasselbe Produkt aendern - und das ist bei Einkaeufen selten.

Fuer eine Kollaborations-App wie Google Docs waere das nicht OK, aber fuer Einkaeufslisten reicht es. 3-Way-Merge haette nur fuer US-03/04/06 Meaning gehabt, nicht fuer die meisten anderen User Stories.

## Key Takeaways
- `409 CONFLICT` mit serverData im Body ist das minimale Protokoll
- ConflictNotification als UI Pattern fuer User-Entscheidung
- Server Wins ist akzeptabel wenn Konflikte selten sind
- `version` Feld auf jedem Entity ist essentiell fuer Optimistic Locking
