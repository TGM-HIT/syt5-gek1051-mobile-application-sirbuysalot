# US-20: Tags verwalten

## Beschreibung

Als Benutzer moechte ich Tags verwalten koennen (erstellen, bearbeiten, loeschen), damit ich meine Kategorien anpassen kann.

## Akzeptanzkriterien

- [x] Benutzer kann neue Tags erstellen
- [x] Benutzer kann Tags umbenennen
- [x] Benutzer kann Tags loeschen
- [x] Beim Loeschen eines Tags wird er von allen Produkten entfernt

## Technische Umsetzung

### Frontend

- `TagManagementDialog.vue` (neu): Dialog zur Verwaltung aller Tags einer Liste. Zeigt vorhandene Tags als Chips mit Loeschen-Button. Eingabefeld fuer neue Tags.
- Verwendet das `useTags`-Composable fuer CRUD-Operationen.

### Backend

- `TagController`: PUT und DELETE-Endpunkte fuer Tag-Verwaltung (bereits in US-05 angelegt).
- Beim Loeschen eines Tags wird die ManyToMany-Relation automatisch aufgeloest (JPA Cascade).
