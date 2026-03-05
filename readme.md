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

## Einstiegspunkt

**IDE:** [IntelliJ IDEA 2024.3](https://www.jetbrains.com/idea/) (mit Vue.js und Spring Boot Support)

**Voraussetzungen:**
- Java 21 LTS
- Node.js 22 LTS
- Docker Compose 2.32+

**Projekt starten:**
```bash
# Repository klonen
git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot.git

# Backend + Datenbank starten (Docker Compose)
docker compose up -d

# Frontend starten
cd frontend
npm install
npm run dev
```

**Prompts:** Nützliche KI-Prompts für die Entwicklung sind im [Promptverzeichnis](promptverzeichnis/prompt.md) zu finden.

---

## User Stories

Alle User Stories, Akzeptanzkriterien und Abhängigkeiten sind in der [STORIES.md](STORIES.md) dokumentiert.

---
