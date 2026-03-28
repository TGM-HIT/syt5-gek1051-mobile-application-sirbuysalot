# User Stories - Einkaufslisten PWA

## Projektuebersicht

Eine Progressive Web App (PWA) fuer gemeinsame Einkaufslisten mit Offline-First-Architektur und Echtzeit-Synchronisation.

## Legende

- **SP** Ein Storypoint entspricht einer Pomodoro Einheit von 40 Minuten.
- **HEAD** Die Verantwortung einer Userstory wird von dieser Person uebernommen. Die Tests sollten von einem anderen Teammitglied ueberprueft werden.
- **Prio** Es muss jeweils mindestens eine *Must Have (MH)*, *Should Have (SH)* und *Nice to have (N2H)* Userstory geben.
- **Status** Der Status wird durch die Abarbeitung der Tasks in z.B. GitHub Issues abgebildet. Hier ist nur die Verlinkung dorthin.

## Team & Rollen

| Kuerzel | Name | Rolle |
|---------|------|-------|
| KU | Kural | Product Owner (PO) |
| DR | Dragne | Technical Architect (TA) |
| GA | Ganner | Entwickler |
| GL | Glatzel | Entwickler |
| SA | Sarana | Entwickler |

## Auflistung

| ID | Description | SP | HEAD | Prio | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Als Benutzer moechte ich eine neue Einkaufsliste mit einem Namen erstellen koennen, damit ich meine Einkaeufe organisieren kann. | 3 | SA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/10) |
| **2** | Als Benutzer moechte ich den Namen einer Einkaufsliste bearbeiten koennen, damit ich sie bei Bedarf umbenennen kann. | 3 | SA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/9) |
| **3** | Als Benutzer moechte ich einen Zugangscode (URL) fuer meine Einkaufsliste generieren und teilen koennen, damit andere Personen der Liste beitreten und einen Anzeigenamen waehlen koennen. | 5 | DR | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/13) |
| **4** | Als Benutzer moechte ich ein Produkt (Name erforderlich, Preis optional) zu einer Einkaufsliste hinzufuegen koennen, damit ich weiss, was gekauft werden muss. | 3 | SA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/11) |
| **5** | Als Benutzer moechte ich einem Produkt Tags (Kategorien/Gruppen) zuweisen koennen, damit ich meine Einkaeufe strukturiert organisieren kann. | 5 | GL | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/17) |
| **6** | Als Benutzer moechte ich den Preis eines Produkts nachtraeglich eintragen oder aendern koennen, damit die tatsaechlichen Kosten erfasst werden. | 3 | SA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/12) |
| **7** | Als Benutzer moechte ich ein Produkt als "gekauft" markieren oder diese Markierung wieder aufheben koennen (durchgestrichen + ausgegraut), damit der aktuelle Status sichtbar ist. | 5 | GA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/19) |
| **8** | Als Benutzer moechte ich bei markierten Produkten sehen, wer es wann markiert hat (Name + Uhrzeit), damit keine Doppelkaeufe entstehen. | 3 | GA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/14) |
| **9** | Als Benutzer moechte ich Produkte in der Einkaufsliste durchsuchen koennen (auch mit einzelnen Buchstaben), damit ich schnell finde, was ich suche. | 5 | KU | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/20) |
| **10** | Als Benutzer moechte ich ein Produkt aus der Liste ausblenden koennen (soft delete), damit die Liste uebersichtlich bleibt. | 3 | SA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/15) |
| **11** | Als Benutzer moechte ich ausgeblendete Produkte wiederherstellen koennen, damit versehentlich entfernte Eintraege nicht verloren gehen. | 3 | SA | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/21) |
| **12** | Als Benutzer moechte ich alle Aenderungen offline vornehmen koennen, wobei diese lokal mit Zeitstempel gespeichert werden, damit ich auch ohne Internet arbeiten kann. | 8 | DR | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/16) |
| **13** | Als Benutzer moechte ich, dass meine offline gemachten Aenderungen automatisch mit dem Server synchronisiert werden, sobald ich wieder online bin. | 8 | DR | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/22) |
| **14** | Als Benutzer moechte ich bei Sync-Konflikten (z.B. gleichzeitige Aenderungen) informiert werden und die aktuellste Version sehen, damit keine Daten verloren gehen. | 5 | DR | MH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/18) |
| **15** | Als Benutzer moechte ich eine Einkaufsliste ausblenden koennen (soft delete), wenn ich sie nicht mehr benoetige. | 3 | SA | SH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/23) |
| **16** | Als Benutzer moechte ich ausgeblendete Einkaufslisten wiederherstellen koennen, damit versehentlich entfernte Listen nicht verloren gehen. | 3 | SA | SH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/24) |
| **17** | Als Benutzer moechte ich ueber eine oeffentliche URL auf die App zugreifen koennen (Deployment), damit ich sie von ueberall nutzen kann. | 8 | KU | SH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/25) |
| **18** | Als Benutzer moechte ich einen Darkmode aktivieren koennen, um meine Augen zu schonen. | 5 | KU | SH | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/26) |
| **19** | Als Benutzer moechte ich, dass die Synchronisation auch ueber P2P funktioniert (z.B. PeerJS), damit die App dezentral nutzbar ist. | 13 | GA | N2H | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/27) |
| **20** | Als Benutzer moechte ich Tags verwalten koennen (erstellen, bearbeiten, loeschen), damit ich meine Kategorien anpassen kann. | 5 | GL | N2H | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/28) |
| **21** | Als Benutzer moechte ich Produkte nach Tags filtern koennen, damit ich nur bestimmte Kategorien sehe. | 5 | GA | N2H | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/29) |
| **22** | Als Benutzer moechte ich die Gesamtkosten aller Produkte in einer Liste sehen koennen, damit ich mein Budget im Blick habe. | 3 | KU | N2H | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/30) |
| **23** | Als Benutzer moechte ich Produkte innerhalb der Liste per Drag & Drop sortieren koennen, damit ich die Reihenfolge anpassen kann. | 5 | GL | N2H | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/31) |
| **24** | Als Benutzer moechte ich eine Einkaufsliste duplizieren koennen, damit ich wiederkehrende Einkaeufe schnell neu anlegen kann. | 8 | GL | N2H | [![Erledigt](https://img.shields.io/badge/Status-Erledigt-brightgreen)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/issues/32) |

---

## Zusammenfassung

*Gesamtbelastung: 120 SP*

| Prio | Stories | SP |
|------|---------|---:|
| Must Have | 1-14 | 62 |
| Should Have | 15-18 | 19 |
| Nice to Have | 19-24 | 39 |
| **Gesamt** | **24 Stories** | **120** |

**Zeitaufwand:** 120 SP x 40 Min = 80 Stunden

### Verteilung pro Mitglied

* **KU (Kural):** US-09, US-17, US-18, US-22 — 21 SP
* **DR (Dragne):** US-03, US-12, US-13, US-14 — 26 SP
* **GA (Ganner):** US-07, US-08, US-19, US-21 — 26 SP
* **GL (Glatzel):** US-05, US-20, US-23, US-24 — 23 SP
* **SA (Sarana):** US-01, US-02, US-04, US-06, US-10, US-11, US-15, US-16 — 24 SP
