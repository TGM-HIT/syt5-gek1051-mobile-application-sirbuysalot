# Prompt: Projektsetup und Architektur

## Zeitpunkt
Anfang Maerz 2026, Sprint Planning

## Kontext
Wir mussten fuer das TGM-Fach "Dezentrale Systeme" eine mobile Anwendung als PWA bauen. Die Kernfrage war: Wie strukturieren wir das Projekt so, dass fuenf Leute gleichzeitig daran arbeiten koennen ohne sich staendig in die Quere zu kommen?

## Prompt (sinngemaess)
"Wir haben ein Schulprojekt: Einkaufslisten-App als PWA mit Vue 3 und Spring Boot. 5 Teammitglieder, 24 User Stories, 3 Wochen Zeit. Wie wuerden wir das am besten aufteilen? Was fuer eine Projektstruktur macht Sinn? Brauchen wir eine Datenbank oder reicht IndexedDB?"

## Ergebnis
- Monorepo mit `/frontend` und `/backend` Ordnern
- PostgreSQL fuer den Server (weil JPA das am besten unterstuetzt)
- IndexedDB im Frontend fuer Offline mit Dexie.js als Wrapper
- Feature-Branch Workflow: `feature/US-XX-beschreibung`
- User Stories aufgeteilt nach Staerken: DR macht Backend-heavy Stories, SA die Frontend CRUD Stories, etc.

## Was wir daraus mitgenommen haben
Die Aufteilung hat gut funktioniert. Merge-Konflikte waren minimal weil jeder an anderen Dateien gearbeitet hat. Die einzige Datei die oefters kollidiert ist war `ListView.vue` weil da fast jede Story was aendern musste.
