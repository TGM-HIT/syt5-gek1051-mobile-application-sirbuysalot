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

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Benutzer kann neue Tags erstellen | TagServiceTest.java | create_savesTag |
| Benutzer kann neue Tags erstellen | TagServiceTest.java | create_throwsWhenListNotFound |
| Benutzer kann neue Tags erstellen | TagControllerTest.java | create_returnsTag |
| Benutzer kann neue Tags erstellen | TagControllerTest.java | create_blankName_returns400 |
| Benutzer kann neue Tags erstellen | TagControllerTest.java | create_nullName_returns400 |
| Benutzer kann neue Tags erstellen | tagService.test.ts | createTag |
| Benutzer kann neue Tags erstellen | tagService.test.ts | createTag validation |
| Benutzer kann neue Tags erstellen | useTags.test.ts | creates tag |
| Benutzer kann neue Tags erstellen | useTags.test.ts | creates empty |
| Benutzer kann Tags umbenennen | TagServiceTest.java | update_updatesName |
| Benutzer kann Tags umbenennen | TagServiceTest.java | update_throwsWhenNotFound |
| Benutzer kann Tags umbenennen | TagControllerTest.java | update_returnsTag |
| Benutzer kann Tags umbenennen | tagService.test.ts | updateTag |
| Benutzer kann Tags umbenennen | tagService.test.ts | updateTag not found |
| Benutzer kann Tags umbenennen | useTags.test.ts | updates tag |
| Benutzer kann Tags loeschen | TagServiceTest.java | delete_deletesTag |
| Benutzer kann Tags loeschen | TagControllerTest.java | delete_returns204 |
| Benutzer kann Tags loeschen | tagService.test.ts | deleteTag |
| Benutzer kann Tags loeschen | tagService.test.ts | deleteTag not found |
| Benutzer kann Tags loeschen | useTags.test.ts | deletes tag |
| Beim Loeschen eines Tags wird er von allen Produkten entfernt | TagServiceTest.java | delete_deletesTag |
| Tags auflisten | TagServiceTest.java | findByListId_returnsTags |
| Tags auflisten | TagControllerTest.java | getAll_returnsTags |
| Tags auflisten | TagControllerTest.java | getAll_emptyList_returns200 |
| Tags auflisten | tagService.test.ts | fetchTags |
| Tags auflisten | tagService.test.ts | fetchTags empty |
| Tags auflisten | useTags.test.ts | loads tags |
| Tags auflisten | useTags.test.ts | loads empty |
| Tags Fehlerbehandlung | useTags.test.ts | error handling |
| Tags neu laden | useTags.test.ts | reloads tags |
