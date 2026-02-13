# User Stories - Einkaufslisten PWA

## Projektübersicht

Eine Progressive Web App (PWA) für gemeinsame Einkaufslisten mit Offline-First-Architektur und Echtzeit-Synchronisation.

## Legende

- **SP (Story Points):** Fibonacci-Skala (3, 5, 8, 13), 1 SP = 40 Minuten Arbeitszeit
- **Prio:** MH = Must Have, SH = Should Have, N2H = Nice to Have
- **HEAD:** Verantwortlicher Entwickler
- **Status:** Verlinkung zum GitHub Issue

## Team & Rollen

| Kürzel | Name | Rolle |
|--------|------|-------|
| KU | Kural | Product Owner (PO) |
| DR | Dragne | Technical Architect (TA) |
| GU | Gunna | Entwickler (Ameise 1) |
| GL | Glatzl | Entwickler (Ameise 2) |
| SA | Sarana | Entwickler (Ameise 3) |

## Arbeitsweise

- Jede User Story wird als **GitHub Issue** angelegt
- Größere Stories (8+ SP) werden in **Sub-Issues** aufgeteilt (z.B. Frontend, Backend, Tests)
- Für jede Story/Sub-Issue wird ein **Feature-Branch** erstellt (`feature/US-XX-beschreibung`)
- Nach Abschluss: Branch mergen und löschen

---

## Auflistung

| ID  | Description | SP | HEAD | Prio | Status |
| --- | ----------- |:--:|:----:|:----:|:------:|
| 1   | Als Benutzer möchte ich eine neue Einkaufsliste mit einem Namen erstellen können, damit ich meine Einkäufe organisieren kann. | 3 | | MH | |
| 2   | Als Benutzer möchte ich den Namen einer Einkaufsliste bearbeiten können, damit ich sie bei Bedarf umbenennen kann. | 3 | | MH | |
| 3   | Als Benutzer möchte ich einen Zugangscode (URL) für meine Einkaufsliste generieren und teilen können, damit andere Personen der Liste beitreten und einen Anzeigenamen wählen können. | 5 | | MH | |
| 4   | Als Benutzer möchte ich ein Produkt (Name erforderlich, Preis optional) zu einer Einkaufsliste hinzufügen können, damit ich weiß, was gekauft werden muss. | 3 | | MH | |
| 5   | Als Benutzer möchte ich einem Produkt Tags (Kategorien/Gruppen) zuweisen können, damit ich meine Einkäufe strukturiert organisieren kann. | 5 | | MH | |
| 6   | Als Benutzer möchte ich den Preis eines Produkts nachträglich eintragen oder ändern können, damit die tatsächlichen Kosten erfasst werden. | 3 | | MH | |
| 7   | Als Benutzer möchte ich ein Produkt als "gekauft" markieren oder diese Markierung wieder aufheben können (durchgestrichen + ausgegraut), damit der aktuelle Status sichtbar ist. | 5 | | MH | |
| 8   | Als Benutzer möchte ich bei markierten Produkten sehen, wer es wann markiert hat (Name + Uhrzeit), damit keine Doppelkäufe entstehen. | 3 | | MH | |
| 9   | Als Benutzer möchte ich Produkte in der Einkaufsliste durchsuchen können (auch mit einzelnen Buchstaben), damit ich schnell finde, was ich suche. | 5 | | MH | |
| 10  | Als Benutzer möchte ich ein Produkt aus der Liste ausblenden können (soft delete), damit die Liste übersichtlich bleibt. | 3 | | MH | |
| 11  | Als Benutzer möchte ich ausgeblendete Produkte wiederherstellen können, damit versehentlich entfernte Einträge nicht verloren gehen. | 3 | | MH | |
| 12  | Als Benutzer möchte ich alle Änderungen offline vornehmen können, wobei diese lokal mit Zeitstempel gespeichert werden, damit ich auch ohne Internet arbeiten kann. | 8 | | MH | |
| 13  | Als Benutzer möchte ich, dass meine offline gemachten Änderungen automatisch mit dem Server synchronisiert werden, sobald ich wieder online bin. | 8 | | MH | |
| 14  | Als Benutzer möchte ich bei Sync-Konflikten (z.B. gleichzeitige Änderungen) informiert werden und die aktuellste Version sehen, damit keine Daten verloren gehen. | 5 | | MH | |
| 15  | Als Benutzer möchte ich eine Einkaufsliste ausblenden können (soft delete), wenn ich sie nicht mehr benötige. | 3 | | SH | |
| 16  | Als Benutzer möchte ich ausgeblendete Einkaufslisten wiederherstellen können, damit versehentlich entfernte Listen nicht verloren gehen. | 3 | | SH | |
| 17  | Als Benutzer möchte ich über eine öffentliche URL auf die App zugreifen können (Deployment), damit ich sie von überall nutzen kann. | 8 | | SH | |
| 18  | Als Benutzer möchte ich einen Darkmode aktivieren können, um meine Augen zu schonen. | 5 | | SH | |
| 19  | Als Benutzer möchte ich, dass die Synchronisation auch über P2P funktioniert (z.B. BitChat), damit die App dezentral nutzbar ist. | 13 | | N2H | |
| 20  | Als Benutzer möchte ich Tags verwalten können (erstellen, bearbeiten, löschen), damit ich meine Kategorien anpassen kann. | 5 | | N2H | |
| 21  | Als Benutzer möchte ich Produkte nach Tags filtern können, damit ich nur bestimmte Kategorien sehe. | 5 | | N2H | |
| 22  | Als Benutzer möchte ich die Gesamtkosten aller Produkte in einer Liste sehen können, damit ich mein Budget im Blick habe. | 3 | | N2H | |
| 23  | Als Benutzer möchte ich Produkte innerhalb der Liste per Drag & Drop sortieren können, damit ich die Reihenfolge anpassen kann. | 5 | | N2H | |
| 24  | Als Benutzer möchte ich eine Einkaufsliste duplizieren können, damit ich wiederkehrende Einkäufe schnell neu anlegen kann. | 8 | | N2H | |

---

## Abhängigkeiten

```
[1] Einkaufsliste erstellen
 ├── [2] Listennamen bearbeiten
 ├── [3] Zugangscode generieren & beitreten
 ├── [15] Liste ausblenden
 │    └── [16] Liste wiederherstellen
 ├── [24] Liste duplizieren
 └── [4] Produkt hinzufügen
      ├── [5] Tags zuweisen
      │    ├── [20] Tags verwalten
      │    └── [21] Nach Tags filtern
      ├── [6] Preis bearbeiten
      │    └── [22] Gesamtkosten anzeigen
      ├── [7] Als gekauft markieren/entmarkieren
      │    └── [8] Wer/Wann anzeigen
      ├── [9] Produkte durchsuchen
      ├── [10] Produkt ausblenden
      │    └── [11] Produkt wiederherstellen
      └── [23] Produkte sortieren

[12] Offline-Speicherung (lokal)
 └── [13] Auto-Sync bei Reconnect
      └── [14] Konfliktbehandlung
           └── [19] P2P-Sync (BitChat)

[17] Deployment (global erreichbar)
[18] Darkmode
```

---

## Definition of Done

- [ ] Feature ist implementiert und funktioniert offline
- [ ] Unit/Integration/CICD Tests bestanden
- [ ] Code Review und Merge durchgeführt
- [ ] Feature/Production-Branch in Main gemerged und gelöscht
- [ ] Dokumentation aktualisiert (falls nötig)

---

## Story Points Übersicht

| Prio | Stories | SP |
|------|---------|---:|
| Must Have | 1-14 | 62 |
| Should Have | 15-18 | 19 |
| Nice to Have | 19-24 | 39 |
| **Gesamt** | **24 Stories** | **120** |

**Zeitaufwand:** 120 SP × 40 Min = 80 Stunden

---

## Akzeptanzkriterien

### Story 1 - Einkaufsliste erstellen
- [ ] Benutzer kann einen Namen für die Liste eingeben (mind. 1 Zeichen)
- [ ] Liste wird lokal gespeichert
- [ ] Liste erscheint in der Übersicht aller Listen
- [ ] Leere Namen werden abgelehnt mit Fehlermeldung

### Story 2 - Listennamen bearbeiten
- [ ] Benutzer kann den Namen einer bestehenden Liste ändern
- [ ] Änderung wird sofort gespeichert
- [ ] Andere Teilnehmer sehen den neuen Namen nach Sync

### Story 3 - Zugangscode generieren & beitreten
- [ ] Eindeutiger Zugangscode/URL wird generiert
- [ ] Code kann geteilt werden (Copy-Button)
- [ ] Andere Benutzer können per Code/URL beitreten
- [ ] Bei Beitritt muss ein Anzeigename eingegeben werden
- [ ] Anzeigename ist für alle Teilnehmer sichtbar

### Story 4 - Produkt hinzufügen
- [ ] Produktname ist Pflichtfeld
- [ ] Preis ist optional (kann leer bleiben)
- [ ] Produkt erscheint sofort in der Liste
- [ ] Validierung: Name darf nicht leer sein

### Story 5 - Tags zuweisen
- [ ] Produkt kann mehrere Tags haben
- [ ] Tags sind frei wählbare Textfelder (z.B. "Obst", "Dragne kauft", "Deniz kauft")
- [ ] Vorhandene Tags werden als Vorschläge angezeigt
- [ ] Tags werden visuell am Produkt angezeigt (z.B. farbige Chips)

### Story 6 - Preis bearbeiten
- [ ] Preis kann jederzeit eingetragen werden
- [ ] Preis kann geändert werden
- [ ] Nur numerische Werte (mit Dezimalstellen) erlaubt
- [ ] Währungssymbol wird angezeigt

### Story 7 - Produkt markieren/entmarkieren
- [ ] Klick auf Produkt markiert es als "gekauft"
- [ ] Markiertes Produkt ist durchgestrichen und ausgegraut
- [ ] Erneuter Klick hebt die Markierung auf
- [ ] Status wird mit Zeitstempel gespeichert

### Story 8 - Wer/Wann anzeigen
- [ ] Bei markierten Produkten wird Anzeigename angezeigt
- [ ] Uhrzeit der Markierung wird angezeigt
- [ ] Information aktualisiert sich bei Statusänderung

### Story 9 - Produkte durchsuchen
- [ ] Suchfeld ist immer sichtbar
- [ ] Suche startet bereits ab dem ersten Buchstaben
- [ ] Suche filtert Produkte in Echtzeit
- [ ] Groß-/Kleinschreibung wird ignoriert
- [ ] Suche durchsucht Produktnamen und Tags

### Story 10 - Produkt ausblenden
- [ ] Produkt kann ausgeblendet werden (soft delete)
- [ ] Ausgeblendetes Produkt ist nicht mehr in der Liste sichtbar
- [ ] Daten bleiben in der Datenbank erhalten (deletedAt Timestamp)

### Story 11 - Produkt wiederherstellen
- [ ] Benutzer kann ausgeblendete Produkte anzeigen lassen
- [ ] Ausgeblendete Produkte können wiederhergestellt werden
- [ ] Wiederhergestellte Produkte erscheinen wieder in der Liste

### Story 12 - Offline-Speicherung
- [ ] Alle Änderungen werden in IndexedDB gespeichert
- [ ] Änderungen erhalten einen Zeitstempel
- [ ] UI zeigt Offline-Status an (z.B. Icon oder Banner)
- [ ] Alle CRUD-Operationen funktionieren ohne Netzwerk
- [ ] Lokale Änderungen sind als "pending sync" markiert

### Story 13 - Auto-Sync
- [ ] Bei Netzwerkverbindung werden pending changes automatisch gesendet
- [ ] Server-Änderungen werden automatisch abgerufen
- [ ] UI zeigt Sync-Status an (syncing/synced/error)
- [ ] Last-Write-Wins mit Zeitstempel-Vergleich als Basis-Strategie

### Story 14 - Konfliktbehandlung
- [ ] Bei Konflikten (gleiches Produkt, ähnlicher Zeitstempel) wird User informiert
- [ ] Neueste Änderung gewinnt, aber alte Version ist nachvollziehbar
- [ ] Soft-deleted Produkte werden bei Sync korrekt behandelt
- [ ] Konflikt-Benachrichtigung ist verständlich formuliert

### Story 15 - Liste ausblenden
- [ ] Liste kann ausgeblendet werden (soft delete)
- [ ] Ausgeblendete Liste ist nicht mehr in der Übersicht sichtbar
- [ ] Alle Daten bleiben erhalten

### Story 16 - Liste wiederherstellen
- [ ] Benutzer kann ausgeblendete Listen anzeigen lassen
- [ ] Ausgeblendete Listen können wiederhergestellt werden
- [ ] Alle Produkte der Liste werden mit wiederhergestellt

### Story 17 - Deployment
- [ ] App ist über öffentliche URL erreichbar
- [ ] HTTPS ist aktiviert
- [ ] PWA kann auf Homescreen installiert werden
- [ ] Service Worker cached statische Assets

### Story 18 - Darkmode
- [ ] Toggle für Darkmode in Einstellungen
- [ ] Darkmode wird gespeichert (localStorage)
- [ ] Alle UI-Elemente sind im Darkmode lesbar
- [ ] System-Präferenz wird initial berücksichtigt

### Story 19 - P2P-Sync (BitChat)
- [ ] Synchronisation funktioniert ohne zentralen Server
- [ ] Peers können sich direkt verbinden
- [ ] Konfliktlösung funktioniert auch bei P2P
- [ ] Fallback auf zentralen Server wenn P2P nicht verfügbar

### Story 20 - Tags verwalten
- [ ] Benutzer kann neue Tags erstellen
- [ ] Benutzer kann Tags umbenennen
- [ ] Benutzer kann Tags löschen
- [ ] Beim Löschen eines Tags wird er von allen Produkten entfernt

### Story 21 - Nach Tags filtern
- [ ] Filterleiste zeigt alle verfügbaren Tags
- [ ] Ein oder mehrere Tags können ausgewählt werden
- [ ] Nur Produkte mit ausgewählten Tags werden angezeigt
- [ ] Filter kann zurückgesetzt werden

### Story 22 - Gesamtkosten anzeigen
- [ ] Summe aller Produktpreise wird angezeigt
- [ ] Summe aktualisiert sich bei Änderungen
- [ ] Nur Produkte mit eingetragenem Preis werden berücksichtigt
- [ ] Optional: Unterscheidung gekauft/nicht gekauft

### Story 23 - Produkte sortieren
- [ ] Produkte können per Drag & Drop verschoben werden
- [ ] Neue Reihenfolge wird gespeichert
- [ ] Sortierung wird mit anderen Benutzern synchronisiert
- [ ] Touch-Support für mobile Geräte

### Story 24 - Liste duplizieren
- [ ] Benutzer kann eine bestehende Liste duplizieren
- [ ] Alle Produkte werden in die neue Liste kopiert
- [ ] Neuer Name wird automatisch generiert (z.B. "Listenname (Kopie)")
- [ ] Markierungen (gekauft) werden nicht übernommen
- [ ] Tags werden übernommen
