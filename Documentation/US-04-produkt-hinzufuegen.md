# US-04: Produkt hinzufuegen

## Beschreibung

Als Benutzer moechte ich ein Produkt (Name erforderlich, Preis optional) zu einer Einkaufsliste hinzufuegen koennen, damit ich weiss, was gekauft werden muss.

## Akzeptanzkriterien

- [x] Produktname ist Pflichtfeld
- [x] Preis ist optional (kann leer bleiben)
- [x] Produkt erscheint sofort in der Liste
- [x] Validierung: Name darf nicht leer sein

## Technische Umsetzung

### Backend

- `Product.java`: `@NotBlank`-Annotation auf dem `name`-Feld hinzugefuegt. Leere oder nur aus Leerzeichen bestehende Namen werden serverseitig abgelehnt.
- `ProductController.java`: `@Valid` beim `@RequestBody` des POST-Endpunkts ergaenzt, damit die Bean-Validierung aktiv wird.
- Der `GlobalExceptionHandler` (aus US-01) faengt Validierungsfehler ab und gibt HTTP 400 mit strukturierter Fehlermeldung zurueck.

### Frontend

- `ListView.vue`: Dialog zum Hinzufuegen war bereits vorhanden. Der "Hinzufuegen"-Button ist deaktiviert, wenn das Namensfeld leer ist. Die Validierungsregel zeigt eine Fehlermeldung direkt unter dem Textfeld an.
- Preis ist optional - das Feld akzeptiert numerische Werte mit Dezimalstellen.

### Tests

- `ProductControllerTest` und `ProductServiceTest` testen die Erstellung.
- Frontend: `useProducts.test.ts` testet die `addProduct`-Funktion.

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Produktname ist Pflichtfeld | ProductServiceTest.java | create_associatesWithListAndSaves |
| Produktname ist Pflichtfeld | ProductServiceTest.java | create_setsShoppingListOnProduct |
| Produktname ist Pflichtfeld | ProductControllerTest.java | create_returnsProduct |
| Produktname ist Pflichtfeld | productService.test.ts | createProduct |
| Produktname ist Pflichtfeld | useProducts.test.ts | creates product |
| Preis ist optional (kann leer bleiben) | ProductServiceTest.java | create_withNullPrice_savesSuccessfully |
| Produkt erscheint sofort in der Liste | ProductServiceTest.java | findByListId_returnsNonDeletedProducts |
| Produkt erscheint sofort in der Liste | ProductControllerTest.java | getAll_returnsProducts |
| Produkt erscheint sofort in der Liste | productService.test.ts | fetchProducts |
| Produkt erscheint sofort in der Liste | useProducts.test.ts | loads products |
| Validierung: Name darf nicht leer sein | ProductServiceTest.java | create_throwsWhenListNotFound |
| Validierung: Name darf nicht leer sein | ProductControllerTest.java | create_returnsProduct |
