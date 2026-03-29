# Mobile Application SirBuysALot

[![CI](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/actions/workflows/ci.yml/badge.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot/releases/tag/v1.0.0)
[![Tests](https://img.shields.io/badge/Tests-200%20passed-brightgreen)](https://tgm-hit.github.io/syt5-gek1051-mobile-application-sirbuysalot/)
[![Backend](https://img.shields.io/badge/Backend-100%20tests-blue)](https://tgm-hit.github.io/syt5-gek1051-mobile-application-sirbuysalot/backend/index.html)
[![Frontend](https://img.shields.io/badge/Frontend-100%20tests-blue)](https://tgm-hit.github.io/syt5-gek1051-mobile-application-sirbuysalot/frontend/index.html)

## Projektübersicht

Das Projekt ist eine Progressive Web App (PWA) für gemeinsame Einkaufslisten. Mehrere Personen können gleichzeitig dieselbe Liste bearbeiten, Produkte hinzufügen, abhaken und mit Tags organisieren. Über einen generierten Einladungslink können andere einfach der Liste beitreten und einen Anzeigenamen wählen, ohne sich registrieren zu müssen. So sieht jeder, wer was wann markiert hat, und Doppelkäufe können vermieden werden. Produkte können außerdem per Soft Delete ausgeblendet und bei Bedarf wiederhergestellt werden, sodass keine Daten verloren gehen.

Die App setzt auf eine **Offline-First-Architektur**: Änderungen werden primär lokal in IndexedDB (via Dexie.js) gespeichert und bei Verbindung automatisch per Batch-Request mit dem Backend synchronisiert. Versionskonflikte werden serverseitig erkannt und aufgelöst. Für Echtzeit-Updates zwischen Clients sorgen WebSockets, Statusänderungen wie das Abhaken eines Produkts landen so sofort bei allen anderen Teilnehmern.

**Tech-Stack:** Vue 3 + Vuetify 3 + Vite (Frontend), Spring Boot 3.2 + Java 21 (Backend), PostgreSQL 16 (DB), WebSockets/STOMP (Echtzeit), Dexie.js/IndexedDB (Offline), vite-plugin-pwa (PWA). Details: [Techstack](./techstack.md)

---

## Datenmodell

### ShoppingList

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `UUID` | Primaerschluessel (auto-generiert) |
| `name` | `String` | Listenname (Pflichtfeld, nicht leer) |
| `accessCode` | `String` | 8-stelliger Einladungscode (unique) |
| `version` | `Integer` | Optimistic Locking Version (default: 1) |
| `createdAt` | `LocalDateTime` | Erstellungszeitpunkt |
| `updatedAt` | `LocalDateTime` | Letzte Aenderung |
| `deletedAt` | `LocalDateTime` | Soft-Delete Zeitstempel (null = aktiv) |
| `products` | `List<Product>` | 1:n Beziehung (Cascade ALL) |
| `users` | `List<AppUser>` | 1:n Beziehung (Cascade ALL) |

### Product

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `UUID` | Primaerschluessel |
| `name` | `String` | Produktname (Pflichtfeld) |
| `price` | `BigDecimal` | Preis (optional) |
| `purchased` | `Boolean` | Gekauft-Status (default: false) |
| `purchasedBy` | `String` | Wer hat gekauft |
| `purchasedAt` | `LocalDateTime` | Wann gekauft |
| `position` | `Integer` | Sortierposition (Drag & Drop) |
| `version` | `Integer` | Optimistic Locking Version |
| `deletedAt` | `LocalDateTime` | Soft-Delete Zeitstempel |
| `shoppingList` | `ShoppingList` | n:1 Beziehung (Fremdschluessel) |
| `tags` | `Set<Tag>` | n:m Beziehung (Join-Table `product_tags`) |

### Tag

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `UUID` | Primaerschluessel |
| `name` | `String` | Tag-Name (Pflichtfeld) |
| `shoppingList` | `ShoppingList` | n:1 Beziehung |
| `products` | `Set<Product>` | n:m Beziehung (Inverse-Seite) |

### AppUser

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `UUID` | Primaerschluessel |
| `displayName` | `String` | Anzeigename (Pflichtfeld) |
| `shoppingList` | `ShoppingList` | n:1 Beziehung |

### ER-Beziehungen

```
ShoppingList 1──n Product
ShoppingList 1──n AppUser
ShoppingList 1──n Tag
Product      n──m Tag  (via product_tags)
```

---

## API-Dokumentation

- **Swagger UI (interaktiv):** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/api-docs`
- **Schnittstellen-Dokumentation:** [API-Schnittstellen.md](Documentation/API-Schnittstellen.md)

Alle REST-Endpunkte (Listen, Produkte, Tags, Benutzer, Sync) sowie die WebSocket-Schnittstelle sind dokumentiert.

### Weitere Dokumentation

- **Technical Documentation:** [Technical-Documentation.md](Documentation/Technical-Documentation.md) - Architektur, umgesetzte Funktionen, Offline-Sync, Testabdeckung
- **Fallbeispiel (4 User):** [Fallbeispiel-4-User.md](Documentation/Fallbeispiel-4-User.md) - Szenario mit 2 Online- und 2 Offline-Benutzern, Synchronisation und Konfliktbehandlung

---

## Tests

```bash
# Backend-Tests (100 Tests)
cd backend
./mvnw test -Dspring.profiles.active=test

# Frontend-Tests (100 Tests)
cd frontend
npm run test

# Frontend-Lint
cd frontend
npm run lint

# Frontend-Build
cd frontend
npm run build
```

**Testabdeckung:** 200 Tests gesamt (100 Backend + 100 Frontend), inkl. Unit-Tests fuer alle Services, Controller und Composables. Grenzfaelle, Fehlerfaelle und Edge-Cases sind abgedeckt.

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
| GA | Ganner | Entwickler (Ameise 1) |
| GL | Glatzel | Entwickler (Ameise 2) |
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
- Docker Desktop (inkl. Docker Compose)

### Setup (einmalig)

```bash
# 1. Repository klonen
git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot.git
cd syt5-gek1051-mobile-application-sirbuysalot

# 2. Environment-Datei anlegen
cp .env.example .env

# 3. PostgreSQL Datenbank starten
docker compose up -d

# 4. Frontend Dependencies installieren
cd frontend
npm install
```

### Projekt starten

```bash
# Terminal 1: Backend starten (aus Projektroot)
cd backend
./mvnw spring-boot:run        # Linux/Mac
mvnw.cmd spring-boot:run      # Windows

# Terminal 2: Frontend starten (aus Projektroot)
cd frontend
npm run dev                    # -> http://localhost:5173
```

**Oder in IntelliJ:**
1. `backend/` Ordner als Maven-Projekt oeffnen
2. `SirBuysALotApplication.java` ausfuehren (Run)
3. Frontend separat im Terminal starten

### Was passiert beim ersten Start?

1. **Docker Compose** startet PostgreSQL 16 auf Port `5432`
2. **Spring Boot** verbindet sich zur DB und erstellt automatisch alle Tabellen (via Hibernate `ddl-auto=update`)
3. **Seed-Daten** (`data.sql`) werden geladen: 3 Einkaufslisten, Produkte, Tags, Benutzer
4. **Frontend** laeuft auf `http://localhost:5173` und verbindet sich zum Backend auf `http://localhost:8080`

### Projektstruktur

```
├── docker-compose.yml          # PostgreSQL 16 Container
├── .env / .env.example         # DB-Credentials (nicht committen!)
├── frontend/                   # Vue 3 + Vuetify 3 + Vite PWA
│   ├── src/
│   │   ├── views/              # Seiten (Home, Liste)
│   │   ├── components/         # Wiederverwendbare Komponenten
│   │   ├── db/index.ts         # Dexie.js (IndexedDB) Setup
│   │   ├── services/api.ts     # Axios REST Client
│   │   ├── router/             # Vue Router
│   │   └── plugins/vuetify.ts  # Vuetify Theme + Config
│   └── package.json
├── backend/                    # Spring Boot 3.2 + Java 21
│   ├── src/main/java/at/tgm/sirbuysalot/
│   │   ├── model/              # JPA Entities (ShoppingList, Product, Tag, AppUser)
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── service/            # Business Logic
│   │   ├── controller/         # REST Endpoints (/api/lists, /api/lists/{id}/products)
│   │   └── config/             # CORS + WebSocket/STOMP
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── data.sql            # Seed-Daten (Testdaten)
│   └── pom.xml
```

### Feature entwickeln

```bash
# Neuen Branch erstellen
git checkout -b feature/US-XX-beschreibung

# ... entwickeln, testen ...

# Pushen und PR erstellen
git push -u origin feature/US-XX-beschreibung
```

**Prompts:** Nuetzliche KI-Prompts fuer die Entwicklung sind im [Promptverzeichnis](promptverzeichnis/prompt.md) zu finden.

---

## User Stories

Alle User Stories, Akzeptanzkriterien und Abhängigkeiten sind in der [STORIES.md](STORIES.md) dokumentiert.

---
