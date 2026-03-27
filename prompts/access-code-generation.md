# Prompt: Access Code Generation und Sharing Flow

## Zeitpunkt
Anfang Maerz 2026, waehrend US-03 Implementierung

## Kontext
Die App brauchte einen Weg um Personen auf eine Einkaufsliste einzuladen, ohne dass sich jemand registrieren muss. DR hatte die Idee: Ein einfacher 8-stelliger Code in der URL, der als Einladungslink dient. Jeder der den Link oeffnet gibt einen Anzeigenamen ein und ist dann dabei.

## Prompt (sinngemaess)
"Wir wollen dass Benutzer ihre Einkaufsliste teilen koennen via Link. Der Link soll einen zufaelligen 8-stelligen Code enthalten, z.B. /join/abc12345. Wenn jemand den Link oeffnet soll er einen Anzeigenamen eingeben und dann direkt auf der Liste landen. Wie machen wir das am besten? Brauchen wir dafuer eine eigene Tabelle oder reicht das als Property auf der ShoppingList?"

## Ergebnis
- 8-stelliger alphanumeric Code generiert mit `UUID.randomUUID().toString().substring(0, 8)` im Service
- Join-Endpoint: `GET /api/lists/join/{accessCode}` gibt die Liste zurueck wenn der Code gueltig ist
- Join-Page (JoinView.vue): Formular fuer Anzeigenamen, speichert in localStorage
- CORS muss fuer die frontend origin konfiguriert sein
- AppUser Entity mit name und anonymem Flag

## Was wir daraus mitgenommen haben
Der einfache Ansatz mit AccessCode auf der ShoppingList war voellig ausreichend. Eine eigene JoinRequest-Tabelle waere overkill gewesen. Der 8-stellige Code ist lang genug damit man ihn nicht erraten kann aber kurz genug zum Teilen.

Der Join-Flow ohne Registrierung ist ein gutes Beispiel fuer "Minimum Viable Auth" - man weiss wer was gemacht hat ueber den localStorage-Name, aber es gibt kein Passwort und keine Email-Verifikation.

## Key Takeaways
- `accessCode` auf der ShoppingList, kein eigenes Model noetig
- Join-Endpoint public machen in CORS (kein Bearer Token noetig)
- Name in localStorage speichern fuer Wiedererkennung
- URL als Einladungsmedium ist einfacher als QR-Code (obwohl das auch gegangen waere)
