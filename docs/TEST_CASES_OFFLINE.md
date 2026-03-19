# Test Cases - Offline-Speicherung (Story 12)

**Story:** Offline CRUD-Operationen mit Zeitstempel und Sync-Queue  
**Test-Level:** Unit Tests / Integration Tests

---

## 1. IndexedDB Integration Tests

### TC-001: ShoppingList lokal erstellen
- **Beschreibung:** Eine neue Einkaufsliste soll lokal in IndexedDB gespeichert werden
- **Vorbedingungen:** IndexedDB ist verfügbar
- **Schritte:**
  1. ShoppingList-Objekt mit allen Pflichtfeldern erstellen
  2. Objekt mit `db.shoppingLists.add()` speichern
- **Erwartetes Ergebnis:** Objekt wird mit generierter ID zurückgegeben

### TC-002: ShoppingList lokal aktualisieren
- **Beschreibung:** Eine bestehende Einkaufsliste soll aktualisiert werden können
- **Vorbedingungen:** Eine ShoppingList existiert in IndexedDB
- **Schritte:**
  1. Liste mit `db.shoppingLists.update()` aktualisieren
- **Erwartetes Ergebnis:** Geänderte Felder werden persistiert

### TC-003: ShoppingList lokal löschen
- **Beschreibung:** Eine Einkaufsliste soll lokal gelöscht werden können
- **Vorbedingungen:** Eine ShoppingList existiert in IndexedDB
- **Schritte:**
  1. Liste mit `db.shoppingLists.delete()` entfernen
- **Erwartetes Ergebnis:** Liste ist nicht mehr in der Datenbank

### TC-004: Product lokal erstellen
- **Beschreibung:** Ein neues Produkt soll lokal in IndexedDB gespeichert werden
- **Vorbedingungen:** IndexedDB ist verfügbar
- **Schritte:**
  1. Product-Objekt mit listId und allen Pflichtfeldern erstellen
  2. Objekt mit `db.products.add()` speichern
- **Erwartetes Ergebnis:** Objekt wird mit generierter ID gespeichert

### TC-005: Product lokal aktualisieren
- **Beschreibung:** Ein bestehendes Produkt soll aktualisiert werden können
- **Vorbedingungen:** Ein Product existiert in IndexedDB
- **Schritte:**
  1. Produkt mit `db.products.update()` aktualisieren
- **Erwartetes Ergebnis:** Geänderte Felder werden persistiert

### TC-006: Product lokal löschen
- **Beschreibung:** Ein Produkt soll lokal gelöscht werden können
- **Vorbedingungen:** Ein Product existiert in IndexedDB
- **Schritte:**
  1. Produkt mit `db.products.delete()` entfernen
- **Erwartetes Ergebnis:** Produkt ist nicht mehr in der Datenbank

---

## 2. Zeitstempel Tests

### TC-007: Zeitstempel bei Erstellung
- **Beschreibung:** Erstellte Items sollen Zeitstempel haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Item erstellen mit `createdAt`, `updatedAt`, `lastModified`
- **Erwartetes Ergebnis:** Alle Zeitstempel sind definiert und <= aktuelle Zeit

### TC-008: lastModified bei Änderungen
- **Beschreibung:** Geänderte Items sollen `lastModified` aktualisieren
- **Vorbedingungen:** Ein Item existiert in IndexedDB
- **Schritte:**
  1. Item mit neuem Zeitstempel aktualisieren
- **Erwartetes Ergebnis:** `lastModified` ist neuer als vorheriger Wert

---

## 3. Sync-Queue Tests

### TC-009: Operation zur Queue hinzufügen
- **Beschreibung:** CRUD-Operationen sollen zur Sync-Queue hinzugefügt werden
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `syncService.addToQueue('create', 'list', 'id', payload)` aufrufen
- **Erwartetes Ergebnis:** Operation ist in Queue mit `synced: false`

### TC-010: Pending-Count ermitteln
- **Beschreibung:** Anzahl der ausstehenden Operationen soll abrufbar sein
- **Vorbedingungen:** Mehrere Operationen in Queue
- **Schritte:**
  1. `syncService.getPendingCount()` aufrufen
- **Erwartetes Ergebnis:** Anzahl der Operationen mit `synced: false`

### TC-011: Operation als synchronisiert markieren
- **Beschreibung:** Erfolgreich synchronisierte Operationen sollen markiert werden
- **Vorbedingungen:** Eine Operation existiert in Queue
- **Schritte:**
  1. `syncService.markAsSynced(id)` aufrufen
- **Erwartetes Ergebnis:** Operation hat `synced: true`

### TC-012: Nach Entitätstyp filtern
- **Beschreibung:** Operationen sollen nach entity-Typ filterbar sein
- **Vorbedingungen:** Gemischte Operationen (list, product) in Queue
- **Schritte:**
  1. `syncService.getPendingOperations()` aufrufen
  2. Nach `entity` filtern
- **Erwartetes Ergebnis:** Nur Operationen des gewählten Typs werden zurückgegeben

---

## 4. Online/Offline-Status Tests

### TC-013: Online-Status erkennen
- **Beschreibung:** navigator.onLine soll true sein wenn online
- **Vorbedingungen:** Browser ist online
- **Schritte:**
  1. `navigator.onLine` prüfen
- **Erwartetes Ergebnis:** Wert ist `true`

### TC-014: Offline-Status erkennen
- **Beschreibung:** navigator.onLine soll false sein wenn offline
- **Vorbedingungen:** Browser ist offline
- **Schritte:**
  1. `navigator.onLine` prüfen
- **Erwartetes Ergebnis:** Wert ist `false`

### TC-015: Auf Online-Event reagieren
- **Beschreibung:** App soll auf 'online' Event reagieren
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `window.dispatchEvent(new Event('online'))` auslösen
- **Erwartetes Ergebnis:** Interne isOnline-Variable wird `true`

### TC-016: Auf Offline-Event reagieren
- **Beschreibung:** App soll auf 'offline' Event reagieren
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `window.dispatchEvent(new Event('offline'))` auslösen
- **Erwartetes Ergebnis:** Interne isOnline-Variable wird `false`

---

## 5. Sync-Markierung Tests

### TC-017: Lokale Änderungen als pending markieren
- **Beschreibung:** Lokal erstellte Items sollen `synced: false` haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Item lokal erstellen
- **Erwartetes Ergebnis:** Item hat `synced: false`

### TC-018: Synchronisierte Änderungen markieren
- **Beschreibung:** Erfolgreich synchronisierte Items sollen `synced: true` haben
- **Vorbedingungen:** Ein Item mit `synced: false` existiert
- **Schritte:**
  1. Item nach erfolgreicher Sync aktualisieren
- **Erwartetes Ergebnis:** Item hat `synced: true`

### TC-019: Version nach Sync erhöhen
- **Beschreibung:** Synchronisierte Items sollen Version erhöhen
- **Vorbedingungen:** Ein Item mit `version: 0` existiert
- **Schritte:**
  1. Nach erfolgreicher Sync Version erhöhen
- **Erwartetes Ergebnis:** Item hat `version: 1`

---

## 6. UI-Indikator Tests

### TC-020: Offline-Banner wird angezeigt
- **Beschreibung:** Offline-Banner soll erscheinen wenn offline
- **Vorbedingungen:** Browser ist offline
- **Schritte:**
  1. Offline-Banner-Komponente prüfen
- **Erwartetes Ergebnis:** Banner ist sichtbar (v-if="!isOnline")

### TC-021: Pending-Count im Banner
- **Beschreibung:** Banner soll Anzahl der wartenden Änderungen anzeigen
- **Vorbedingungen:** Einige Operationen in Sync-Queue
- **Schritte:**
  1. `pendingSyncCount` abrufen
- **Erwartetes Ergebnis:** Anzahl wird im Banner angezeigt

---

## 7. Datenmodell-Tests

### TC-022: ShoppingList-Schema validieren
- **Beschreibung:** ShoppingList soll alle Pflichtfelder haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. ShoppingList-Objekt mit allen Feldern erstellen
- **Erwartetes Ergebnis:** Alle Felder gemäß Techstack vorhanden

### TC-023: Product-Schema validieren
- **Beschreibung:** Product soll alle Pflichtfelder haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Product-Objekt mit allen Feldern erstellen
- **Erwartetes Ergebnis:** Alle Felder gemäß Techstack vorhanden

### TC-024: SyncOperation-Schema validieren
- **Beschreibung:** SyncOperation soll alle Pflichtfelder haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. SyncOperation-Objekt mit allen Feldern erstellen
- **Erwartetes Ergebnis:** Alle Felder gemäß Techstack vorhanden

---

## 8. Testausführung

### Befehle
```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# Mit Coverage
npx vitest run --coverage
```

### Testergebnisse (Beispiel)
```
Test Files  2 passed (2)
Tests      24 passed (24)
Duration    2.59s
```

---

## 9. Test-Matrix

| Test-ID | Kategorie | Status |
|---------|-----------|--------|
| TC-001 | IndexedDB | ✅ |
| TC-002 | IndexedDB | ✅ |
| TC-003 | IndexedDB | ✅ |
| TC-004 | IndexedDB | ✅ |
| TC-005 | IndexedDB | ✅ |
| TC-006 | IndexedDB | ✅ |
| TC-007 | Zeitstempel | ✅ |
| TC-008 | Zeitstempel | ✅ |
| TC-009 | Sync-Queue | ✅ |
| TC-010 | Sync-Queue | ✅ |
| TC-011 | Sync-Queue | ✅ |
| TC-012 | Sync-Queue | ✅ |
| TC-013 | Online/Offline | ✅ |
| TC-014 | Online/Offline | ✅ |
| TC-015 | Online/Offline | ✅ |
| TC-016 | Online/Offline | ✅ |
| TC-017 | Sync-Markierung | ✅ |
| TC-018 | Sync-Markierung | ✅ |
| TC-019 | Sync-Markierung | ✅ |
| TC-020 | UI-Indikator | ✅ |
| TC-021 | UI-Indikator | ✅ |
| TC-022 | Datenmodell | ✅ |
| TC-023 | Datenmodell | ✅ |
| TC-024 | Datenmodell | ✅ |
