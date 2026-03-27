# Changelog

Alle relevanten Aenderungen am Projekt werden hier dokumentiert.

## [1.0.0] - 2026-03-24

### Hinzugefuegt

#### Must Have (US-01 bis US-14)
- **US-01:** Einkaufsliste erstellen mit Validierung (SA)
- **US-02:** Listennamen bearbeiten ueber Edit-Dialog (SA)
- **US-03:** Zugangscode generieren, teilen und beitreten mit Anzeigename (DR)
- **US-04:** Produkt hinzufuegen mit Name (Pflicht) und Preis (optional) (SA)
- **US-05:** Tags/Kategorien an Produkte zuweisen mit Chip-Anzeige (GL)
- **US-06:** Preis nachtraeglich bearbeiten ueber ProductEditDialog (SA)
- **US-07:** Produkt als gekauft markieren/entmarkieren mit visueller Hervorhebung (GU)
- **US-08:** Anzeige wer wann ein Produkt markiert hat (GU)
- **US-09:** Echtzeit-Suche ueber Produktnamen und Tags (KU)
- **US-10:** Produkt ausblenden (soft delete mit deletedAt) (SA)
- **US-11:** Ausgeblendete Produkte wiederherstellen (SA)
- **US-12:** Offline-Speicherung mit IndexedDB/Dexie, pendingChanges-Tabelle (DR)
- **US-13:** Auto-Sync bei Reconnect ueber Batch-Endpoint und WebSocket (DR)
- **US-14:** Konfliktbehandlung mit Versionspruefung (409) und Benachrichtigung (DR)

#### Should Have (US-15 bis US-18)
- **US-15:** Einkaufsliste ausblenden mit Bestaetigung-Dialog (SA)
- **US-16:** Geloeschte Listen anzeigen und wiederherstellen (SA)
- **US-17:** Docker-Deployment mit nginx, SPA-Routing und GitHub Actions (KU)
- **US-18:** Dark Mode mit System-Praeferenz und localStorage-Persistenz (KU)

#### Nice to Have (US-19 bis US-24)
- **US-19:** P2P-Synchronisation ueber PeerJS/WebRTC (GU)
- **US-20:** Tag-Verwaltung (erstellen, bearbeiten, loeschen) (GL)
- **US-21:** Produktfilter nach Tags mit Chip-Auswahl (GU)
- **US-22:** Gesamtkosten-Anzeige (gekauft/offen/gesamt) (KU)
- **US-23:** Drag & Drop Sortierung mit vuedraggable und Touch-Support (GL)
- **US-24:** Liste duplizieren mit allen Produkten (GL)

### Technische Details
- **Frontend:** Vue 3 + Vuetify 3 + Vite + TypeScript
- **Backend:** Spring Boot 3.2.12 + Java 21 + JPA/Hibernate
- **Datenbank:** PostgreSQL 16 via Docker Compose
- **Offline:** IndexedDB via Dexie.js mit pendingChanges-Queue
- **Echtzeit:** WebSocket/STOMP + PeerJS fuer P2P
- **PWA:** vite-plugin-pwa mit Service Worker und Manifest
- **Deployment:** Multi-Stage Docker Builds + nginx Reverse Proxy
