# US-17: Deployment & PWA

## Beschreibung

Als Benutzer moechte ich die App als Progressive Web App installieren und auf einem Server nutzen koennen.

## Akzeptanzkriterien

- [x] Backend als Docker-Image baubar (multi-stage build)
- [x] Frontend als Docker-Image mit Nginx
- [x] Nginx-Konfiguration mit SPA-Routing, API-Proxy und WebSocket-Proxy
- [x] PWA-Manifest mit Icons und standalone-Modus
- [x] Service Worker fuer Offline-Caching (via Vite PWA Plugin)
- [x] GitHub Actions Deploy-Workflow

## Technische Umsetzung

### Backend Dockerfile

Multi-stage Build: Baut zuerst mit JDK 21 Alpine, kopiert das fertige JAR in ein schlankes JRE-Image. Port 8080 wird exponiert.

### Frontend Dockerfile

Multi-stage Build: Installiert Dependencies mit `npm ci`, baut mit `npm run build`, kopiert das `dist`-Verzeichnis in ein Nginx Alpine-Image. Die `nginx.conf` wird ebenfalls kopiert.

### Nginx-Konfiguration

- SPA-Routing: Alle Nicht-Datei-Anfragen werden an `index.html` weitergeleitet
- API-Proxy: `/api/` wird an `backend:8080` weitergeleitet (Docker-internes Netzwerk)
- WebSocket-Proxy: `/ws` wird mit Upgrade-Header an das Backend weitergeleitet
- Static Assets: 1 Jahr Cache mit `immutable` Header
- Service Worker: `sw.js` wird ohne Cache ausgeliefert

### PWA-Konfiguration (bestehend)

- `vite-plugin-pwa` mit `registerType: 'autoUpdate'`
- Manifest: Name "SirBuysALot", Theme-Farbe #1976D2, Display standalone
- Icons in 192x192 und 512x512

### Deploy Workflow

- Trigger: Push auf `main` oder manuell
- Zwei parallele Jobs: `build-backend` und `build-frontend`
- Jeder Job baut das Docker-Image zur Validierung
