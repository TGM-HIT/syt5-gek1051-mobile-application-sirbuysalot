# Prompt: PWA Service Worker Config - Cache Strategie

## When
March 2026, during US-17 deployment planning

## Context
We wanted the app to work offline after first load. The Vite PWA plugin generates a service worker but the default caching strategy was caching too much or too little. We needed to understand the difference between precache, runtime cache, and network-first strategies.

## Prompt (exact wording)
"Using vite-plugin-pwa with Vue 3. The default service worker is caching everything which means our API responses are also cached. How do I configure it so that API calls always go to the network but static assets are cached? And how do I make sure the app works offline for returning users?"

## Ergebnis
vite.config.ts PWA Config mit richtiger Cache-Strategie:
```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\..*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5,
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\..*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'font-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
    navigateFallback: null,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
})
```

Frontend Assets (JS/CSS/HTML) werden automatisch ge-precached by vite-plugin-pwa. Die API Calls nutzen NetworkFirst - wenn das Netzwerk nicht erreichbar ist, faellt es auf den Cache zurueck.

Fuer IndexedDB als primary data store ist das perfekt: Unsere App-Daten kommen aus Dexie.js, nicht aus dem Service Worker Cache. Der Service Worker cached nur die Shell der App.

## Was wir daraus mitgenommen haben
Die Default-Config von vite-plugin-pwa ist ein guter Start aber man muss die API-Calls explizit als NetworkFirst konfigurieren damit sie nicht gecached werden. Ohne das wuerden alte Produkte angezeigt werden obwohl der User schon andere Sachen gekauft hat.

`navigateFallback: null` ist wichtig weil wir Vue Router nutzen und alle Routes SPA-intern geroutet werden. Mit navigateFallback wuerde der Service Worker /list/xyz auf die index.html mappen aber das bringt nichts wenn Vue Router das schon macht.

## Key Takeaways
- `NetworkFirst` fuer API Calls (fresh data wenn moeglich)
- `CacheFirst` fuer statische Assets (Fonts, Bilder)
- API-Cache braucht kurzes Timeout damit Offline-Fallback greift
- `registerType: 'autoUpdate'` fuer automatisches SW-Update ohne Reload-Prompt
- Precache fuer App-Shell (HTML/JS/CSS)
