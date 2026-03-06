# Techstack - SirBuysALot

*dies ist noch die Planung von der Technologie mit der SirBuysALot umgesetzt werden soll, d.h. es ist nicht finalisiert und neue oder veränderte Inhalte können vorkommen*

## Architektur Big-Picture & Systemlandschaft

Das folgende Diagramm veranschaulicht das Zusammenspiel der Komponenten, die Kommunikation und die Datenhaltung in der *SirBuysALot*-Architektur:

```text
      [ MOBILE / BROWSER CLIENT ]                                 [ BACKEND SERVER ]
+-------------------------------------+                  +-----------------------------------+
|             Vue 3 PWA               |                  |       Spring Boot (Java 21)       |
|                                     |                  |                                   |
|  +-------------------------------+  |   1. REST API    |  +-----------------------------+  |
|  |       State Management        |  |  (Alle Schreib-  |  |      REST Controllers       |  |
|  |      (Vue Refs / Stores)      |  |-- Operationen) ->|  |  (Auth, Listen, Konflikte)  |  |
|  +-------------------------------+  |                  |  +-----------------------------+  |
|          ^               |          |<-----------------|                 |                 |
|          | (Reactivity)  | (Write)  |                  |                 |                 |
|          v               v          |                  |                 v                 |
|  +-------------------------------+  |  2. WebSockets   |  +-----------------------------+  |
|  |     Lokaler Datenspeicher     |  |<- (Echtzeit   ---|  |     WebSocket / STOMP       |  |
|  |  IndexedDB (via Dexie.js)     |  |    Updates)      |  |  (Push-Events an Clients)   |  |
|  +-------------------------------+  |                  |  +-----------------------------+  |
|          ^               ^          |                  |                 |                 |
|          |               |          |                  |                 |                 |
+----------|---------------|----------+                  +-----------------|-----------------+
           |               |                                               |
      (Offline)        (Online)                                            v
           |               |                             +-----------------------------------+
      +---------+     +---------+                        |          PostgreSQL 16 DB         |
      | UX Fall |     | UX Fall |                        |  +-----------------------------+  |
      | (Lokal) |     | (Sync)  |                        |  | Relational : Users, Lists   |  |
      +---------+     +---------+                        |  | JSONB      : Item-Metadata  |  |
                                                         |  +-----------------------------+  |
                                                         +-----------------------------------+
```

---

## Aussehen eines Einkaufslisten-Items

Damit die Synchronisation sinnvoll und funktionsfähig ist, soll ein Item der Einkaufsliste folgendermaßen aussehen: 

| **Attribut**       | **Typ**     | **Speicherort**     | **Beschreibung**                                                             |
| ------------------ | ----------- | ------------------- | ---------------------------------------------------------------------------- |
| `id`               | UUID        | Lokal & Server      | Eindeutiger Identifikator (vom Client generiert, um Duplikate zu vermeiden). |
| `listId`           | UUID        | Lokal & Server      | Fremdschlüssel zur zugehörigen Liste.                                        |
| `name`             | String      | Lokal & Server      | Name des Produkts (z.B. "Milch").                                            |
| `amount`           | String      | Lokal & Server      | Menge/Einheit (z.B. "2 Packungen").                                          |
| `isDone`           | Boolean     | Lokal & Server      | Status (abgehakt oder nicht).                                                |
| **`version`**      | **Integer** | **Server (Master)** | **Zentraler Zähler für Konflikterkennung.**                                  |
| **`lastModified`** | Timestamp   | Lokal & Server      | Zeitstempel der letzten Änderung.                                            |
| `synced`           | Boolean     | Nur Lokal           | Flag: `true` = identisch mit Server, `false` = muss noch gepusht werden.     |

Für Tags (Kategorien/Gruppen eines Produkts) wird eine M2M Tabelle benötigt welche die UUID der Kategorie, mit der UUID des Produktes veknüpft wird.

| Attribut    | Typ  | Speicherort    | Beschreibung              |
| ----------- | ---- | -------------- | ------------------------- |
| `produktId` | UUID | Lokal & Server | UUID des Produktes        |
| `tagId`     | UUID | Lokal & Server | UUID der Kategorie/Gruppe |

Dafür wird folgendes Tag gebraucht:

| Attribut | Typ    | Speicherort    | Beschreibung                                 |
| -------- | ------ | -------------- | -------------------------------------------- |
| `id`     | UUID   | Lokal & Server | Eindeutiger Identifikator des Tags           |
| `tag`    | String | Lokal & Server | Der Name der Kategorie (z.B. "Milchprodukt") |



---

## Systemkommunikation: Wie die Geräte miteinander sprechen

Um eine nahtlose User-Experience zu garantieren, läuft die Kommunikation zweigleisig:

1. **REST API (Axios):** Wird für **alle schreibenden und verbindlichen Anfragen** genutzt (Login, initiale Listen laden, Senden von Änderungen, Sync-Batch). Dies ermöglicht eine direkte Rückmeldung (z.B. HTTP 409 bei Versionskonflikten).
2. **WebSockets (STOMP):** Wird für den **reaktiven Live-Empfang** genutzt. Wenn ein Client eine Änderung via REST erfolgreich durchgeführt hat, pusht der Server dieses Event an alle anderen betroffenen Clients, um deren UI in Echtzeit zu aktualisieren.

---

## Konsistenzwahrung & Offline-Szenarien (Sync-Logik)

### Die Lösung: Lokaler Cache & Versioning

1. **Datensatz-Versionierung:** Jede Einkaufsliste und jedes Item erhält in der PostgreSQL-Datenbank ein Feld `version` (Integer).
2. **Lokaler Fallback (Dexie.js):** Geht das Gerät offline (Erkennung via `navigator.onLine` oder API-Timeouts), speichert das Frontend alle Aktionen nur in der IndexedDB ab. Jede Änderung bekommt lokal das Flag `synced: false`.
3. **Wiederverbindung (Back Online):** Sobald das Netz wieder da ist, schickt das Frontend alle Einträge mit `synced: false` per REST-Request an den Server (inklusive der alten Versionsnummer).

### Konflikterkennung & Auflösung (Conflict Resolution)

* **Der Server prüft die Version:** Der Server vergleicht die Version aus dem Request mit der aktuellen Version in der Datenbank.
* **Kein Konflikt:** Stimmen die Versionen überein, übernimmt der Server die Änderung, erhöht die Versionsnummer und pusht das Update an alle WebSockets.
* **Konfliktfall (Version Mismatch):** Stimmen die Versionen nicht überein, erkennt das Backend den Konflikt.
* **Lösungsstrategie (Server Wins):** Für *SirBuysALot* nutzen wir einen automatischen **Server-Wins-Ansatz**, um den User im Supermarkt nicht durch Dialoge zu blockieren. Der Server lehnt das veraltete Update ab (HTTP 409) und sendet den aktuellen Server-State zurück. Das Frontend überschreibt daraufhin den lokalen Cache mit der "Server-Wahrheit".

---

## Frontend:

Für das Implementieren des Frontendes soll **Vue 3 + Vuetify** genutzt werden, da es dem Team am meisten bekannt ist und es dadurch den kleinsten lernaufwand hat. Als Build tool soll **Vite** genutzt werden. D.h. das **Vite PWA Plugin** wird genutzt, womit die App installierbar wird.

**Versionen & Dokumentation:**

- **Vue 3** – Version: **3.4.0**
  
  - Hauptdokumentation: [Vue 3 Docs](https://vuejs.org)
  
  - Einstieg/Guide: [Vue 3 Guide](https://vuejs.org/guide/introduction.html)
  
  - API Referenz: [Vue 3 API Reference](https://vuejs.org/api/)
  
  - Composition API: [Composition API Guide](https://vuejs.org/guide/extras/composition-api-faq.html)

- **Vuetify 3** – Version: **3.7.4**
  
  - Hauptdokumentation: [Vuetify Docs](https://vuetifyjs.com)
  
  - Installation & Setup: [Vuetify Getting Started](https://vuetifyjs.com/en/getting-started/installation/)
  
  - Komponenten-Übersicht: [Vuetify Components](https://vuetifyjs.com/en/components/all/)
  
  - API-Referenz: [Vuetify API](https://vuetifyjs.com/en/api/v-app/)

- **Vite** – Version: **5.4.0**
  
  - Hauptdokumentation: [Vite Guide](https://vitejs.dev/guide/)
  
  - Konfiguration: [Vite Config Reference](https://vitejs.dev/config/)
  
  - Build-Themen: [Vite Build Guide](https://vitejs.dev/guide/build.html)

- **Vite PWA Plugin** – Version: **0.20.5**
  
  - Hauptdokumentation: [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
  
  - Einstieg: [Vite PWA Getting Started](https://vite-pwa-org.netlify.app/guide/)
  
  - PWA-Anforderungen: [PWA Minimal Requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html)

- **Axios** (für REST-Requests im Frontend) – Version: **1.7.9**
  
  - Dokumentation: [Axios Docs](https://axios-http.com/docs/intro)

- **WebSocket im Frontend** (native API / optional VueUse)
  
  - Native WebSocket API: [WebSocket MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
  
  - Composable (optional): [VueUse useWebSocket](https://vueuse.org/core/useWebSocket/)

---

## Backend:

Für die Implementation des Backendes soll **Spring Boot** genutzt werden. Für die Kommunikation zwischen frontend und backend soll für Standard-Aktionen wie z.B. "Liste erstellen" **REST-API** verwendet werden. Für das erhalten von Updates sollen **Websockets** verwendet werden, um sofortige Updates zu erhalten.

**Versionen & Dokumentation:**

- **Java** – Version: **21 LTS**
  
  - Dokumentation: [Java 21 Docs](https://docs.oracle.com/en/java/javase/21/)

- **Spring Boot** – Version: **3.2.12**
  
  - Hauptdokumentation: [Spring Boot Docs](https://docs.spring.io/spring-boot/index.html)
  
  - Referenz-Handbuch: [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/)
  
  - REST mit Spring MVC: [Spring Boot Web (Servlet)](https://docs.spring.io/spring-boot/reference/web/servlet.html)
  
  - WebSockets mit Spring Boot: [Spring Boot WebSockets](https://docs.spring.io/spring-boot/reference/messaging/websockets.html)
  
  - WebSocket-Details: [Spring WebSocket Guide](https://docs.spring.io/spring-framework/reference/web/websocket.html)
  
  - STOMP-over-WebSocket: [Spring STOMP over WebSocket](https://docs.spring.io/spring-framework/reference/web/websocket/stomp.html)

- **Spring Data JPA** (für DB-Zugriff)
  
  - Dokumentation: [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/)
  
  - Query-Methoden: [Spring Data JPA Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

---

## Datenbank:

Als Datenbank soll **Postgres** genutzt werden.

Zum Offline Speichern soll **IndexedDB(Library : Dexie.js) oder localStorage(localForage) wenn IndexedDB aus unbekannte Gründe ausfällt** verwendet werden.

**Versionen & Dokumentation:**

- **PostgreSQL** – Version: **16.8**
  
  - Hauptdokumentation: [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
  
  - Tutorial: [PostgreSQL Tutorial](https://www.postgresql.org/docs/16/tutorial.html)
  
  - SQL-Befehle: [PostgreSQL SQL Commands](https://www.postgresql.org/docs/16/sql-commands.html)
  
  - Performance-Tipps: [PostgreSQL Performance Tips](https://www.postgresql.org/docs/16/performance-tips.html)

- **Dexie.js** (IndexedDB Wrapper) – Version: **4.0.11**
  
  - Hauptseite: [Dexie.js](https://dexie.org/)
  
  - Getting Started: [Dexie Getting Started](https://dexie.org/docs/Tutorial/Getting-started)
  
  - Vue-Integration: [Dexie mit Vue](https://dexie.org/docs/Tutorial/Vue)
  
  - Tabellen & Schema: [Dexie Version.stores](https://dexie.org/docs/Version/Version.stores())
  
  - Tabellen-API: [Dexie Table](https://dexie.org/docs/Table/Table)
  
  - Abfragen & Filter: [Dexie Collection](https://dexie.org/docs/Collection/Collection)

- **localForage** (Fallback für localStorage) – Version: **1.10.0**
  
  - Dokumentation: [localForage Docs](https://localforage.github.io/localForage/)
  
  - API-Referenz: [localForage API](https://localforage.github.io/localForage/#api)
  
  - Konfiguration: [localForage Config](https://localforage.github.io/localForage/#settings-api-config)

- **IndexedDB API** (native Referenz)
  
  - Überblick: [IndexedDB MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
  
  - Nutzung: [Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

- **localStorage API** (native Referenz)
  
  - Dokumentation: [localStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## Programmierumgebung:

Zum Programmieren soll **IntelliJ** verwendet werden und für das Containerisieren der Applikation soll Docker Compose genutzt werden.

**Versionen & Dokumentation:**

- **IntelliJ IDEA** – Version: **2024.3**
  
  - Hauptdokumentation: [IntelliJ IDEA Help](https://www.jetbrains.com/help/idea/)
  
  - Vue-Unterstützung: [IntelliJ Vue.js Support](https://www.jetbrains.com/help/idea/vue-js.html)
  
  - Spring Boot-Unterstützung: [IntelliJ Spring Boot Support](https://www.jetbrains.com/help/idea/spring-boot.html)

- **Docker Compose** – Version: **2.32.0**
  
  - Hauptdokumentation: [Docker Compose Docs](https://docs.docker.com/compose/)
  
  - Compose File Referenz: [Compose File Reference](https://docs.docker.com/compose/compose-file/)
  
  - CLI Referenz: [Compose CLI Reference](https://docs.docker.com/compose/reference/)
  
  - Networking: [Compose Networking](https://docs.docker.com/compose/networking/)
  
  - Multi-Container Beispiel: [Compose Getting Started](https://docs.docker.com/compose/gettingstarted/)

---

## CI/CD

Für die CI/CD soll das Actions System von Github genutzt werden.

**Versionen & Dokumentation:**

- **GitHub Actions**
  
  - Hauptdokumentation: [GitHub Actions Docs](https://docs.github.com/en/actions)
  
  - Quickstart: [Actions Quickstart](https://docs.github.com/en/actions/quickstart)
  
  - Workflow-Syntax: [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
  
  - Build & Tests: [Automating Builds and Tests](https://docs.github.com/en/actions/automating-builds-and-tests)
  
  - Docker-Images: [Publishing Docker Images](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
  
  - Deployment: [Actions Deployment](https://docs.github.com/en/actions/deployment/about-deployments)

- **Node.js** (für Frontend-Build in CI/CD) – Version: **22.0.0 LTS**
  
  - Dokumentation: [Node.js 22 Docs](https://nodejs.org/docs/latest-v22.x/api/)

---

### Testing Tools

Um die Stabilität und die Offline-Funktionalität (Must-Have Stories) zu gewährleisten, werden folgende Test-Frameworks eingesetzt:

**Frontend (Unit & Component Tests):**

* **Vitest** – Version: **2.1.0** [Vitest Docs](https://vitest.dev/)

* **Vue Test Utils** – Version: **2.4.0** [Vue Test Utils](https://test-utils.vuejs.org/)

**Backend (Unit Tests):**

* **JUnit 5** (in Spring Boot Starter Test enthalten) [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)

**End-to-End (E2E) & UI-Testing:**

* **Playwright**  [Playwright Docs](https://playwright.dev/)

---

## Synchronisationsdesign

### Datenhaltung (Data Persistence)

Die App nutzt 2 Storages ( Lokal und Auf dem Server):

1. **Server-Side:** PostgreSQL als "Source of Truth".
2. **Client-Side:** **Dexie.js (IndexedDB)** als lokaler Cache. Alle Nutzeraktionen werden primär in die lokale Datenbank geschrieben, um Latenzfreiheit und Offline-Betrieb zu garantieren.

### Synchronisationsansatz (Sync-Logik)

Wir nutzen einen **Hybrid-Ansatz** aus REST (für Aktionen) und WebSockets (für Updates).

**Ablauf der Synchronisation:**

* **Online-Modus:** Änderungen werden per REST an den Server gesendet. Bei Erfolg verteilt der Server die Updates über WebSockets an alle anderen Clients.
* **Offline-Modus:** Die PWA erkennt Verbindungsverluste (auch Timeouts). Änderungen werden lokal in Dexie.js mit `synced: false` markiert.
* **Re-Synchronisation (Back Online):** Die App pusht alle lokalen Änderungen per REST-Batch an das Backend.
* **Konfliktlösung:** Alle konkurrierenden Änderungen werden serverseitig erkannt. Im Konfliktfall wird die Server-Version bevorzugt (**Server Wins**), und der Client aktualisiert seinen lokalen Zustand automatisch auf den Stand des Servers, um Konsistenz zu gewährleisten.