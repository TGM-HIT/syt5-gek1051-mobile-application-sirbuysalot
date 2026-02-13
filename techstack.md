# Techstack - SirBuysALot

*dies ist die erste Planung von der Technologie mit der SirBuysALot umgesetzt werden soll, d.h es ist nicht finalisiert und neue oder veränderte Inhalte können vorkommen*

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

Für die Implementation des Backendes soll **Spring Boot** genutzt werden. Für die Kommunikation zwischen frontend und backend soll für Standard-Aktionen wie z.B. "Liste erstellen" **REST-API** verwendet werden. für Sachen die für Echtzeit Synchronisation wichtig ist (Produkt hinzufügen, Produkt Markieren) sollen **WebSockets** genutzt werden.

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
