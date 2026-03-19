# US-21: Produkte nach Tags filtern

**Issue:** [#29](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/29) | **Branch:** `29-us-21-produkte-nach-tags-filtern`

---

## Was wurde implementiert

- Filterleiste in der Listenansicht zeigt alle verfuegbaren Tags der aktuellen Liste
- Multi-Tag Auswahl moeglich (OR-Logik: Produkt wird angezeigt wenn mindestens ein ausgewaehlter Tag vorhanden)
- Produktzaehler zeigt gefilterte Anzahl (z.B. "5 von 12 Produkten")
- Reset-Button zum Zuruecksetzen aller Filter
- Suchfunktion integriert (durchsucht Produktnamen und Tag-Namen, case-insensitiv)
- Offline-Support: Tags werden in IndexedDB gecacht und beim Offline-Laden wiederhergestellt

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `frontend/src/composables/useTagFilter.ts` | Neuer Composable fuer Tag-Filter-Logik mit optionaler Suchintegration |
| `frontend/src/composables/useProducts.ts` | Erweitert um Tag-Caching in IndexedDB (saveProductTags, loadProductTags) |
| `frontend/src/views/ListView.vue` | Filter-UI, Suchfeld, Integration von useTagFilter |

---

## Architektur

### useTagFilter Composable

Der Composable nimmt eine reaktive Produktliste und optionalen Suchquery entgegen:

```typescript
useTagFilter(products: Ref<Product[]>, searchQuery?: Ref<string>)
```

Rueckgabewerte:
- `availableTags`: Alle eindeutigen Tags aus den Produkten, alphabetisch sortiert
- `filteredProducts`: Produkte gefiltert nach Suche und Tags
- `selectedTagIds`: Set der ausgewaehlten Tag-IDs
- `isTagSelected(tagId)`: Prueft ob ein Tag ausgewaehlt ist
- `toggleTag(tagId)`: Schaltet Tag-Auswahl um
- `resetFilter()`: Setzt alle Filter zurueck
- `hasActiveFilter`: Boolean ob Filter aktiv
- `totalProductCount`: Gesamtanzahl Produkte
- `filteredProductCount`: Anzahl gefilterter Produkte

### Offline-Support

Tags werden in zwei IndexedDB-Tabellen gespeichert:
- `tags`: Tag-Definitionen (id, name, listId)
- `productTags`: Zuordnung Produkt zu Tag (productId, tagId)

Beim Laden vom Server werden Tags automatisch gecacht. Im Offline-Modus werden Tags aus dem Cache geladen.

---

## Tests

| Datei | Tests |
|---|---|
| `frontend/src/__tests__/composables/useTagFilter.test.ts` | 13 Vitest-Tests (Tag-Extraktion, Sortierung, Filterung, Toggle, Reset, Produktzaehlung, Suchintegration) |

---

## UI Komponenten

- **Filterleiste**: V-Card mit V-Chips fuer jeden Tag
- **Suchfeld**: V-Text-Field mit Magnifier-Icon
- **Produktzaehler**: Anzeige "X von Y Produkten" bei aktivem Filter
- **Reset-Button**: "Alle anzeigen" Button zum Zuruecksetzen
- **Empty State**: Spezielle Anzeige wenn Filter keine Ergebnisse liefert
