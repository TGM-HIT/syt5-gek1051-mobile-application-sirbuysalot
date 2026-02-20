# Mobile Application SirBuysALot

## Projektübersicht

Das Projekt ist eine Progressive Web App (PWA) für gemeinsame Einkaufslisten. Mehrere Personen können gleichzeitig dieselbe Liste bearbeiten, Produkte hinzufügen, abhaken und mit Tags organisieren. Über einen generierten Einladungslink können andere einfach der Liste beitreten und einen Anzeigenamen wählen, ohne sich registrieren zu müssen. So sieht jeder, wer was wann markiert hat, und Doppelkäufe können vermieden werden. Produkte können außerdem per Soft Delete ausgeblendet und bei Bedarf wiederhergestellt werden, sodass keine Daten verloren gehen.

Die App setzt auf eine **Offline-First-Architektur**: Änderungen werden primär lokal in IndexedDB (via Dexie.js) gespeichert und bei Verbindung automatisch per Batch-Request mit dem Backend synchronisiert. Versionskonflikte werden serverseitig erkannt und aufgelöst. Für Echtzeit-Updates zwischen Clients sorgen WebSockets, Statusänderungen wie das Abhaken eines Produkts landen so sofort bei allen anderen Teilnehmern.

**Tech-Stack:** [Techstack](./techstack.md)

---

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
| 1   | Als Benutzer möchte ich eine neue Einkaufsliste mit einem Namen erstellen können, damit ich meine Einkäufe organisieren kann. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/10 |
| 2   | Als Benutzer möchte ich den Namen einer Einkaufsliste bearbeiten können, damit ich sie bei Bedarf umbenennen kann. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/9 |
| 3   | Als Benutzer möchte ich einen Zugangscode (URL) für meine Einkaufsliste generieren und teilen können, damit andere Personen der Liste beitreten und einen Anzeigenamen wählen können. | 5 | | MH | https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/13|
| 4   | Als Benutzer möchte ich ein Produkt (Name erforderlich, Preis optional) zu einer Einkaufsliste hinzufügen können, damit ich weiß, was gekauft werden muss. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/11 |
| 5   | Als Benutzer möchte ich einem Produkt Tags (Kategorien/Gruppen) zuweisen können, damit ich meine Einkäufe strukturiert organisieren kann. | 5 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/17 |
| 6   | Als Benutzer möchte ich den Preis eines Produkts nachträglich eintragen oder ändern können, damit die tatsächlichen Kosten erfasst werden. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/12|
| 7   | Als Benutzer möchte ich ein Produkt als "gekauft" markieren oder diese Markierung wieder aufheben können (durchgestrichen + ausgegraut), damit der aktuelle Status sichtbar ist. | 5 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/19 |
| 8   | Als Benutzer möchte ich bei markierten Produkten sehen, wer es wann markiert hat (Name + Uhrzeit), damit keine Doppelkäufe entstehen. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/14 |
| 9   | Als Benutzer möchte ich Produkte in der Einkaufsliste durchsuchen können (auch mit einzelnen Buchstaben), damit ich schnell finde, was ich suche. | 5 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/20 |
| 10  | Als Benutzer möchte ich ein Produkt aus der Liste ausblenden können (soft delete), damit die Liste übersichtlich bleibt. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/15 |
| 11  | Als Benutzer möchte ich ausgeblendete Produkte wiederherstellen können, damit versehentlich entfernte Einträge nicht verloren gehen. | 3 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/21 |
| 12  | Als Benutzer möchte ich alle Änderungen offline vornehmen können, wobei diese lokal mit Zeitstempel gespeichert werden, damit ich auch ohne Internet arbeiten kann. | 8 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/16 |
| 13  | Als Benutzer möchte ich, dass meine offline gemachten Änderungen automatisch mit dem Server synchronisiert werden, sobald ich wieder online bin. | 8 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/22 |
| 14  | Als Benutzer möchte ich bei Sync-Konflikten (z.B. gleichzeitige Änderungen) informiert werden und die aktuellste Version sehen, damit keine Daten verloren gehen. | 5 | | MH |https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/18 |
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
