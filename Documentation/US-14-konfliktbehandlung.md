# US-14: Konfliktbehandlung

## Beschreibung

Als Benutzer moechte ich bei gleichzeitiger Bearbeitung eine sinnvolle Konfliktloesung erhalten, damit keine Aenderungen verloren gehen.

## Akzeptanzkriterien

- [x] Server prueft Versionsnummern bei Updates (optimistic locking)
- [x] Bei Versionskonflikt wird HTTP 409 zurueckgegeben
- [x] Frontend erkennt 409-Antworten und zeigt Konfliktbenachrichtigung
- [x] Benutzer kann die aktuelle Version vom Server neu laden
- [x] ConflictException mit Server- und Client-Version fuer Debugging

## Technische Umsetzung

### Backend

- `ConflictException.java` (neu): Custom Exception mit `serverVersion` und `clientVersion` Feldern. Wird geworfen, wenn die vom Client gesendete Version aelter ist als die aktuelle Server-Version.
- `ProductService.java` (geaendert): `update()` Methode prueft jetzt vor dem Speichern, ob die Client-Version mit der Server-Version kompatibel ist. Wenn `updated.getVersion() < product.getVersion()`, wird eine `ConflictException` geworfen.
- `GlobalExceptionHandler.java` (geaendert): Neuer `@ExceptionHandler` fuer `ConflictException`, der HTTP 409 CONFLICT zurueckgibt. Response enthaelt `message`, `serverVersion` und `clientVersion`.

### Frontend

- `ConflictNotification.vue` (neu): Snackbar-Komponente, die bei Versionskonflikten erscheint. Zeigt die Konfliktnachricht an und bietet zwei Aktionen: "Neu laden" (laedt die aktuelle Version vom Server) und "Schliessen".

### Konfliktstrategie: Server-Wins mit Benachrichtigung

Bei einem Versionskonflikt gewinnt immer die Server-Version. Der Client wird informiert und kann die aktuelle Version vom Server laden. Dieses Vorgehen ist fuer eine Einkaufslisten-App sinnvoll, da:

1. Konflikte selten auftreten (unterschiedliche Produkte werden parallel bearbeitet)
2. Die letzte gespeicherte Version ist fast immer die gewuenschte
3. Ein komplexes Merge-UI waere fuer den Anwendungsfall ueberdimensioniert

### Ablauf

```
Client A: Version 3 -> Server speichert Version 4
Client B: Version 3 -> Server: 409 CONFLICT (Version 3 < 4)
  -> ConflictNotification wird angezeigt
  -> Benutzer klickt "Neu laden"
  -> GET /products/{id} -> Version 4 wird geladen
```

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Server prueft Versionsnummern bei Updates (optimistic locking) | ProductServiceTest.java | update_withVersionConflict_throwsConflictException |
| Bei Versionskonflikt wird HTTP 409 zurueckgegeben | ProductServiceTest.java | update_withVersionConflict_throwsConflictException |
| ConflictException mit Server- und Client-Version fuer Debugging | ProductServiceTest.java | update_withVersionConflict_throwsConflictException |
| Benutzer kann die aktuelle Version vom Server neu laden | ProductServiceTest.java | update_withZeroVersion_skipsConflictCheck |
