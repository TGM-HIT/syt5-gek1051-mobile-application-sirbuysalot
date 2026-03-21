# US-18: Dark Mode

## Beschreibung

Als Benutzer moechte ich zwischen hellem und dunklem Design wechseln koennen, damit ich die App an meine Vorlieben anpassen kann.

## Akzeptanzkriterien

- [x] Toggle-Button in der App-Bar zum Wechseln zwischen Hell und Dunkel
- [x] Praeferenz wird in localStorage gespeichert
- [x] Beim ersten Besuch wird die System-Praeferenz (prefers-color-scheme) verwendet
- [x] Aenderung der System-Praeferenz wird live uebernommen (wenn kein manueller Override)
- [x] Vuetify Theme wechselt korrekt zwischen 'light' und 'dark'

## Technische Umsetzung

### Frontend

- `useDarkMode.ts` (neu): Composable mit `isDark` Ref und `toggle()` Funktion. Liest beim Mount zuerst localStorage (`sirbuysalot-darkmode`). Wenn nichts gespeichert, wird `window.matchMedia('(prefers-color-scheme: dark)')` abgefragt. Setzt `theme.global.name.value` auf 'light' oder 'dark'. Listener fuer System-Praeferenz-Aenderungen, der nur greift wenn kein manueller Override vorliegt.
- `App.vue` (geaendert): Neuer Button in der App-Bar (links neben dem User-Chip/Name-Button). Zeigt Sonnen-Icon im hellen Modus, Mond-Icon im dunklen Modus. Klick ruft `toggleDarkMode()` auf.

### Vuetify-Integration

Die Vuetify-Instanz stellt bereits ein `light` und `dark` Theme bereit. Das Composable nutzt `useTheme()` von Vuetify, um `theme.global.name.value` dynamisch zu setzen. Alle Vuetify-Komponenten passen sich automatisch an.
