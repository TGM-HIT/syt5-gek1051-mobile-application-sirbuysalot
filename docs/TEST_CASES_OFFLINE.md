# Test Cases - Offline-Speicherung (Story 12)

**Story:** Offline CRUD-Operationen mit Zeitstempel und Sync-Queue  
**Test-Level:** Unit Tests / Integration Tests  
**Letzte Aktualisierung:** 2026-03-19

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

### TC-007: ShoppingList mit UUID erstellen
- **Beschreibung:** Listen sollen mit Client-generierten UUIDs erstellt werden
- **Vorbedingungen:** Keine
- **Schritte:**
  1. UUID mit `crypto.randomUUID()` generieren
  2. Liste mit dieser UUID speichern
- **Erwartetes Ergebnis:** UUID ist im Format UUID v4

### TC-008: Produkte nach listId filtern
- **Beschreibung:** Produkte sollen nach ihrer Liste gefiltert werden können
- **Vorbedingungen:** Mehrere Produkte in verschiedenen Listen
- **Schritte:**
  1. `db.products.where('listId').equals(listId).toArray()` aufrufen
- **Erwartetes Ergebnis:** Nur Produkte der angegebenen Liste werden zurückgegeben

---

## 2. Zeitstempel Tests

### TC-009: Zeitstempel bei Erstellung
- **Beschreibung:** Erstellte Items sollen Zeitstempel haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Item erstellen mit `createdAt`, `updatedAt`, `lastModified`
- **Erwartetes Ergebnis:** Alle Zeitstempel sind definiert und <= aktuelle Zeit

### TC-010: lastModified bei Änderungen
- **Beschreibung:** Geänderte Items sollen `lastModified` aktualisieren
- **Vorbedingungen:** Ein Item existiert in IndexedDB
- **Schritte:**
  1. Item mit neuem Zeitstempel aktualisieren
- **Erwartetes Ergebnis:** `lastModified` ist neuer als vorheriger Wert

### TC-011: ISO 8601 Format
- **Beschreibung:** Zeitstempel sollen im ISO 8601 Format sein
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `new Date().toISOString()` aufrufen
- **Erwartetes Ergebnis:** Format ist `2026-03-19T12:00:00.000Z`

---

## 3. Sync-Queue Tests

### TC-012: Operation zur Queue hinzufügen
- **Beschreibung:** CRUD-Operationen sollen zur Sync-Queue hinzugefügt werden
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `syncService.addToQueue('create', 'list', 'id', payload)` aufrufen
- **Erwartetes Ergebnis:** Operation ist in Queue mit `synced: false`

### TC-013: Pending-Count ermitteln
- **Beschreibung:** Anzahl der ausstehenden Operationen soll abrufbar sein
- **Vorbedingungen:** Mehrere Operationen in Queue
- **Schritte:**
  1. `syncService.getPendingCount()` aufrufen
- **Erwartetes Ergebnis:** Anzahl der Operationen mit `synced: false`

### TC-014: Operation als synchronisiert markieren
- **Beschreibung:** Erfolgreich synchronisierte Operationen sollen markiert werden
- **Vorbedingungen:** Eine Operation existiert in Queue
- **Schritte:**
  1. `syncService.markAsSynced(id)` aufrufen
- **Erwartetes Ergebnis:** Operation hat `synced: true`

### TC-015: Nach Entitätstyp filtern
- **Beschreibung:** Operationen sollen nach entity-Typ filterbar sein
- **Vorbedingungen:** Gemischte Operationen (list, product) in Queue
- **Schritte:**
  1. `syncService.getPendingOperations()` aufrufen
  2. Nach `entity` filtern
- **Erwartetes Ergebnis:** Nur Operationen des gewählten Typs werden zurückgegeben

### TC-016: Alle Operationstypen speichern
- **Beschreibung:** Queue soll 'create', 'update' und 'delete' unterstützen
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Drei Operationen erstellen (create, update, delete)
- **Erwartetes Ergebnis:** Jeder Typ wird korrekt gespeichert

### TC-017: Queue-Reihenfolge nach Timestamp
- **Beschreibung:** Operationen sollen nach Zeitstempel sortiert sein
- **Vorbedingungen:** Mehrere Operationen mit unterschiedlichen Timestamps
- **Schritte:**
  1. Operationen mit verzögerten Timestamps hinzufügen
  2. Queue abrufen
- **Erwartetes Ergebnis:** Älteste Operation zuerst

---

## 4. Online/Offline-Status Tests

### TC-018: Online-Status erkennen
- **Beschreibung:** navigator.onLine soll true sein wenn online
- **Vorbedingungen:** Browser ist online
- **Schritte:**
  1. `navigator.onLine` prüfen
- **Erwartetes Ergebnis:** Wert ist `true`

### TC-019: Offline-Status erkennen
- **Beschreibung:** navigator.onLine soll false sein wenn offline
- **Vorbedingungen:** Browser ist offline
- **Schritte:**
  1. `navigator.onLine` prüfen
- **Erwartetes Ergebnis:** Wert ist `false`

### TC-020: Auf Online-Event reagieren
- **Beschreibung:** App soll auf 'online' Event reagieren
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `window.dispatchEvent(new Event('online'))` auslösen
- **Erwartetes Ergebnis:** Interne isOnline-Variable wird `true`

### TC-021: Auf Offline-Event reagieren
- **Beschreibung:** App soll auf 'offline' Event reagieren
- **Vorbedingungen:** Keine
- **Schritte:**
  1. `window.dispatchEvent(new Event('offline'))` auslösen
- **Erwartetes Ergebnis:** Interne isOnline-Variable wird `false`

---

## 5. Sync-Markierung Tests

### TC-022: Lokale Änderungen als pending markieren
- **Beschreibung:** Lokal erstellte Items sollen `synced: false` haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Item lokal erstellen
- **Erwartetes Ergebnis:** Item hat `synced: false`

### TC-023: Synchronisierte Änderungen markieren
- **Beschreibung:** Erfolgreich synchronisierte Items sollen `synced: true` haben
- **Vorbedingungen:** Ein Item mit `synced: false` existiert
- **Schritte:**
  1. Item nach erfolgreicher Sync aktualisieren
- **Erwartetes Ergebnis:** Item hat `synced: true`

### TC-024: Version nach Sync erhöhen
- **Beschreibung:** Synchronisierte Items sollen Version erhöhen
- **Vorbedingungen:** Ein Item mit `version: 0` existiert
- **Schritte:**
  1. Nach erfolgreicher Sync Version erhöhen
- **Erwartetes Ergebnis:** Item hat `version: 1`

---

## 6. UI-Indikator Tests

### TC-025: Offline-Banner wird angezeigt
- **Beschreibung:** Offline-Banner soll erscheinen wenn offline
- **Vorbedingungen:** Browser ist offline
- **Schritte:**
  1. Offline-Banner-Komponente prüfen
- **Erwartetes Ergebnis:** Banner ist sichtbar (v-if="!isOnline")

### TC-026: Online-Banner wird nicht angezeigt
- **Beschreibung:** Offline-Banner soll nicht erscheinen wenn online
- **Vorbedingungen:** Browser ist online
- **Schritte:**
  1. Banner-Sichtbarkeit prüfen
- **Erwartetes Ergebnis:** Banner ist nicht sichtbar

### TC-027: Pending-Count im Banner
- **Beschreibung:** Banner soll Anzahl der wartenden Änderungen anzeigen
- **Vorbedingungen:** Einige Operationen in Sync-Queue
- **Schritte:**
  1. `pendingSyncCount` abrufen
- **Erwartetes Ergebnis:** Anzahl wird im Banner angezeigt

### TC-028: Zero-Count wird nicht angezeigt
- **Beschreibung:** Bei 0 ausstehenden Änderungen soll keine Zahl angezeigt werden
- **Vorbedingungen:** Queue ist leer
- **Schritte:**
  1. Count prüfen
- **Erwartetes Ergebnis:** "0 Änderungen warten" oder Count hidden

---

## 7. Datenmodell-Tests

### TC-029: ShoppingList-Schema validieren
- **Beschreibung:** ShoppingList soll alle Pflichtfelder haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. ShoppingList-Objekt mit allen Feldern erstellen
- **Erwartetes Ergebnis:** Alle Felder gemäß Techstack vorhanden

### TC-030: Product-Schema validieren
- **Beschreibung:** Product soll alle Pflichtfelder haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. Product-Objekt mit allen Feldern erstellen
- **Erwartetes Ergebnis:** Alle Felder gemäß Techstack vorhanden

### TC-031: SyncOperation-Schema validieren
- **Beschreibung:** SyncOperation soll alle Pflichtfelder haben
- **Vorbedingungen:** Keine
- **Schritte:**
  1. SyncOperation-Objekt mit allen Feldern erstellen
- **Erwartetes Ergebnis:** Alle Felder gemäß Techstack vorhanden

---

## 8. Fehlerbehandlung Tests

### TC-032: API-Fehler während Sync
- **Beschreibung:** Operation soll bei API-Fehler in Queue bleiben
- **Vorbedingungen:** API gibt Error zurück
- **Schritte:**
  1. Sync-Operation mit fehlschlagendem API-Call
- **Erwartetes Ergebnis:** Operation bleibt mit `synced: false` in Queue

### TC-033: Timeout während Sync
- **Beschreibung:** Operation soll bei Timeout wiederholt werden
- **Vorbedingungen:** API-Timeout konfiguriert
- **Schritte:**
  1. Sync mit timeout-behaftetem Request
- **Erwartetes Ergebnis:** Operation bleibt für Retry in Queue

### TC-034: Queue wird bei Online-Gehen verarbeitet
- **Beschreibung:** Automatischer Sync wenn Browser online geht
- **Vorbedingungen:** Elemente in Queue, Browser offline
- **Schritte:**
  1. Online-Event dispatchen
- **Erwartetes Ergebnis:** `processQueue()` wird aufgerufen

---

## 9. Integration Tests (End-to-End)

### TC-035: Kompletter Offline-Create-Workflow
- **Beschreibung:** Element erstellen, offline gehen, wieder online
- **Vorbedingungen:** Browser ist online
- **Schritte:**
  1. Liste erstellen (wird lokal + Server gespeichert)
  2. Browser offline schalten
  3. Neue Liste erstellen (nur lokal)
  4. Browser online schalten
  5. Prüfen ob letzte Liste synchronisiert wurde
- **Erwartetes Ergebnis:** Beide Listen sind am Server

### TC-036: Kompletter Offline-Update-Workflow
- **Beschreibung:** Element aktualisieren, offline gehen, wieder online
- **Vorbedingungen:** Element existiert
- **Schritte:**
  1. Produkt als gekauft markieren (offline)
  2. Browser online schalten
  3. Prüfen ob Status synchronisiert wurde
- **Erwartetes Ergebnis:** Produkt ist als gekauft markiert

### TC-037: Mehrere Offline-Änderungen
- **Beschreibung:** Mehrere Änderungen offline, dann synchronisieren
- **Vorbedingungen:** Browser offline
- **Schritte:**
  1. 3 Produkte erstellen
  2. 2 Produkte als gekauft markieren
  3. 1 Produkt löschen
  4. Browser online schalten
- **Erwartetes Ergebnis:** Alle Änderungen werden synchronisiert

---

## 10. Testausführung

### Befehle
```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# Mit Coverage
npx vitest run --coverage

# Bestimmte Test-Datei
npx vitest run src/tests/offline.test.ts
```

### Testergebnisse (Beispiel)
```
Test Files  2 passed (2)
Tests      37 passed (37)
Duration    2.59s
```

---

## 11. Test-Matrix

| Test-ID | Kategorie | Priorität | Status |
|---------|-----------|-----------|--------|
| TC-001 | IndexedDB | Hoch | ✅ |
| TC-002 | IndexedDB | Hoch | ✅ |
| TC-003 | IndexedDB | Hoch | ✅ |
| TC-004 | IndexedDB | Hoch | ✅ |
| TC-005 | IndexedDB | Hoch | ✅ |
| TC-006 | IndexedDB | Hoch | ✅ |
| TC-007 | IndexedDB | Mittel | ✅ |
| TC-008 | IndexedDB | Mittel | ✅ |
| TC-009 | Zeitstempel | Hoch | ✅ |
| TC-010 | Zeitstempel | Hoch | ✅ |
| TC-011 | Zeitstempel | Mittel | ✅ |
| TC-012 | Sync-Queue | Hoch | ✅ |
| TC-013 | Sync-Queue | Hoch | ✅ |
| TC-014 | Sync-Queue | Hoch | ✅ |
| TC-015 | Sync-Queue | Mittel | ✅ |
| TC-016 | Sync-Queue | Mittel | ✅ |
| TC-017 | Sync-Queue | Niedrig | ✅ |
| TC-018 | Online/Offline | Hoch | ✅ |
| TC-019 | Online/Offline | Hoch | ✅ |
| TC-020 | Online/Offline | Hoch | ✅ |
| TC-021 | Online/Offline | Hoch | ✅ |
| TC-022 | Sync-Markierung | Hoch | ✅ |
| TC-023 | Sync-Markierung | Hoch | ✅ |
| TC-024 | Sync-Markierung | Mittel | ✅ |
| TC-025 | UI-Indikator | Hoch | ✅ |
| TC-026 | UI-Indikator | Mittel | ✅ |
| TC-027 | UI-Indikator | Mittel | ✅ |
| TC-028 | UI-Indikator | Niedrig | ✅ |
| TC-029 | Datenmodell | Hoch | ✅ |
| TC-030 | Datenmodell | Hoch | ✅ |
| TC-031 | Datenmodell | Hoch | ✅ |
| TC-032 | Fehlerbehandlung | Hoch | 🔲 |
| TC-033 | Fehlerbehandlung | Mittel | 🔲 |
| TC-034 | Fehlerbehandlung | Hoch | 🔲 |
| TC-035 | Integration | Hoch | 🔲 |
| TC-036 | Integration | Hoch | 🔲 |
| TC-037 | Integration | Mittel | 🔲 |

**Legende:**
- ✅ Implementiert
- 🔲 Noch zu implementieren (E2E/Playwright)

---

## 12. Hinweise für E2E-Tests (Playwright)

Für die Integrationstests (TC-032 - TC-037) sollten Playwright-Tests erstellt werden:

```typescript
// tests/e2e/offline.spec.ts
import { test, expect } from '@playwright/test'

test('offline create workflow', async ({ page }) => {
  // 1. Gehe online, erstelle initiales Element
  await page.goto('/')
  await page.click('[data-testid="add-list"]')
  
  // 2. Schalte offline
  await page.context().setOffline(true)
  
  // 3. Erstelle Element offline
  await page.click('[data-testid="add-list"]')
  await page.fill('[data-testid="list-name"]', 'Offline List')
  
  // 4. Prüfe lokale Speicherung
  // ... assertions
})
```
