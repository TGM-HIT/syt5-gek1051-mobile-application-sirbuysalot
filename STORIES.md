# User Stories - Einkaufslisten PWA

## Projektübersicht

Eine Progressive Web App (PWA) für gemeinsame Einkaufslisten mit Offline-First-Architektur und Echtzeit-Synchronisation.

## Legende

- **SP (Story Points):** 1 SP = 40 Minuten Arbeitszeit
- **Prio:** MH = Must Have, SH = Should Have, N2H = Nice to Have
- **HEAD:** Verantwortlicher Entwickler
- **Status:** Verlinkung zum GitHub Issue

## Abhängigkeiten

```
[1] Einkaufsliste erstellen
 └── [2] Einladungscode generieren
      └── [3] Per Code beitreten
           └── [4] Produkt hinzufügen
                ├── [5] Preis bearbeiten
                ├── [6] Als gekauft markieren
                │    ├── [7] Wer/Wann anzeigen
                │    └── [8] Rückgängig machen
                └── [9] Produkt entfernen

[11] Offline-Speicherung (lokal)
 └── [12] Auto-Sync bei Reconnect
      └── [13] Konfliktbehandlung
           └── [16] P2P-Sync (BitChat) [optional]

[10] Liste löschen ── abhängig von [1]
[14] Darkmode ── unabhängig
[15] Deployment (global erreichbar) ── abhängig von [1-13]
```

## Auflistung

| ID  | Description                                                                                                                                                         | SP  | HEAD | Prio | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |:---:|:----:|:----:|:------:|
| 1   | Als Benutzer möchte ich eine neue Einkaufsliste mit einem Namen erstellen können, damit ich meine Einkäufe organisieren kann.                                       | 2   |      | MH   |        |
| 2   | Als Benutzer möchte ich einen Einladungscode für meine Einkaufsliste generieren können, damit ich andere Personen einladen kann.                                    | 2   |      | MH   |        |
| 3   | Als Benutzer möchte ich einer Einkaufsliste per Einladungscode beitreten und einen Anzeigenamen wählen, damit ich in der Liste identifizierbar bin.                 | 3   |      | MH   |        |
| 4   | Als Benutzer möchte ich ein Produkt (Name erforderlich, Preis optional) zu einer Einkaufsliste hinzufügen können, damit ich weiß, was gekauft werden muss.          | 2   |      | MH   |        |
| 5   | Als Benutzer möchte ich den Preis eines Produkts nachträglich eintragen oder ändern können, damit die tatsächlichen Kosten erfasst werden.                          | 2   |      | MH   |        |
| 6   | Als Benutzer möchte ich ein Produkt als "gekauft" markieren können (durchgestrichen + ausgegraut), damit andere sehen, was bereits erledigt ist.                    | 2   |      | MH   |        |
| 7   | Als Benutzer möchte ich bei abgehakten Produkten sehen, wer es wann markiert hat (Name + Uhrzeit), damit keine Doppelkäufe entstehen.                               | 2   |      | MH   |        |
| 8   | Als Benutzer möchte ich ein versehentlich abgehaktes Produkt wieder als "offen" markieren können, damit Fehler korrigiert werden können.                            | 1   |      | MH   |        |
| 9   | Als Benutzer möchte ich ein Produkt aus der Liste entfernen können (soft delete), damit die Liste übersichtlich bleibt.                                             | 2   |      | MH   |        |
| 10  | Als Benutzer möchte ich eine Einkaufsliste löschen können (soft delete), wenn ich sie nicht mehr benötige.                                                          | 2   |      | SH   |        |
| 11  | Als Benutzer möchte ich alle Änderungen offline vornehmen können, wobei diese lokal mit Zeitstempel gespeichert werden, damit ich auch ohne Internet arbeiten kann. | 5   |      | MH   |        |
| 12  | Als Benutzer möchte ich, dass meine offline gemachten Änderungen automatisch mit dem Server synchronisiert werden, sobald ich wieder online bin.                    | 5   |      | MH   |        |
| 13  | Als Benutzer möchte ich bei Sync-Konflikten (z.B. gleichzeitige Änderungen) informiert werden und die aktuellste Version sehen, damit keine Daten verloren gehen.   | 3   |      | MH   |        |
| 14  | Als Benutzer möchte ich einen Darkmode aktivieren können, um meine Augen zu schonen.                                                                                | 2   |      | N2H  |        |
| 15  | Als Benutzer möchte ich über eine öffentliche URL auf die App zugreifen können (Deployment), damit ich sie von überall nutzen kann.                                 | 3   |      | SH   |        |
| 16  | Als Benutzer möchte ich, dass die Synchronisation auch über P2P funktioniert (z.B. BitChat), damit die App dezentral nutzbar ist.                                   | 5   |      | N2H  |        |

## Definition of Done

- [ ] Feature ist implementiert und funktioniert offline
- [ ] Unit/Integration/CICD Tests bestanden
- [ ] Code Review und Merge durchgeführt
- [ ] Feature/Production-Branch in Main gemerged und gelöscht
- [ ] Dokumentation aktualisiert (falls nötig)
