# US-24: Liste duplizieren

## Beschreibung

Als Benutzer moechte ich eine bestehende Liste duplizieren koennen, um schnell eine aehnliche Einkaufsliste zu erstellen.

## Akzeptanzkriterien

- [x] Duplizieren-Button auf jeder Listenkarte
- [x] Backend-Endpoint POST /{id}/duplicate erstellt Kopie
- [x] Alle aktiven Produkte werden mitkopiert (Name, Preis, Position)
- [x] Kopie erhaelt neuen Namen mit " (Kopie)" Suffix
- [x] Kopie erhaelt eigenen Zugangscode
- [x] Gekauft-Status wird nicht mitkopiert (neue Liste = alles offen)

## Technische Umsetzung

### Backend

- `ShoppingListService.java` (geaendert): Neue `duplicate()` Methode. Laedt die Original-Liste, erstellt eine neue Liste mit "(Kopie)" im Namen und neuem Zugangscode. Kopiert alle nicht-geloeschten Produkte mit Name, Preis und Position. Gekauft-Status, Tags und Timestamps werden bewusst nicht kopiert.
- `ShoppingListController.java` (geaendert): Neuer `POST /{id}/duplicate` Endpoint.
- `ProductRepository` wird jetzt zusaetzlich in den ShoppingListService injiziert, um Produkte der Originalliste zu laden.

### Frontend

- `listService.ts` (geaendert): Neue `duplicate()` Methode (POST).
- `useShoppingLists.ts` (geaendert): Neue `duplicateList()` Funktion, die die Kopie an den Anfang der Liste setzt.
- `HomeView.vue` (geaendert): Neuer Kopieren-Button (mdi-content-copy) neben Edit- und Delete-Button. Klick ruft `onDuplicateList()` auf. Snackbar bestaetigt die Aktion.

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | ShoppingListServiceTest.java | duplicate_createsNewListWithKopieSuffix |
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | ShoppingListServiceTest.java | duplicate_throwsWhenNotFound |
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | ShoppingListControllerTest.java | duplicate_returnsList |
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | listService.extended.test.ts | duplicateList |
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | listService.extended.test.ts | duplicateList error |
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | useShoppingLists.extended.test.ts | duplicates list |
| Backend-Endpoint POST /{id}/duplicate erstellt Kopie | useShoppingLists.extended.test.ts | duplicates error |
| Alle aktiven Produkte werden mitkopiert (Name, Preis, Position) | ShoppingListServiceTest.java | duplicate_copiesProducts |
| Kopie erhaelt neuen Namen mit " (Kopie)" Suffix | ShoppingListServiceTest.java | duplicate_createsNewListWithKopieSuffix |
| Kopie erhaelt eigenen Zugangscode | ShoppingListServiceTest.java | duplicate_generatesNewAccessCode |
