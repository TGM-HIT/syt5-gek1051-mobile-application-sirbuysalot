# Prompt: Soft Delete Pattern - Warum deletedAt statt Loeschen

## Wann
Maerz 2026, waehrend US-10/15 Implementierung

## Kontext
Wir mussten Produkte und Listen "loeschen" koennen aber die Daten sollten nicht wirklich weg sein. SA fragte sich: Loeschen wir einfach mit DELETE oder machen wir was anderes?

## Prompt (sinngemaess)
"Was ist der beste Weg um Daten in einer App zu loeschen wenn der User das will, aber wir sie trotzdem wiederherstellen koennen muessen? Sollen wir DELETE requests machen oder eher ein soft delete mit einem deletedAt timestamp? Wie gehen wir damit im Backend und Frontend um?"

## Ergebnis
Soft Delete Pattern mit `deletedAt` Timestamp:

Backend:
```java
// statt repository.delete(product);
// setzen wir:
product.setDeletedAt(LocalDateTime.now());
repository.save(product);
```

Repository Queries filtern automatisch:
```java
// Nur aktive Produkte:
@Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL")
List<Product> findActiveProducts();

// Nur deleted:
@Query("SELECT p FROM Product p WHERE p.deletedAt IS NOT NULL")
List<Product> findDeletedProducts();
```

Frontend:
- Produkte mit `deletedAt` werden in der normalen Liste gefiltert
- Restore-Button zeigt nur gelöschte Items an
- Restore setzt `deletedAt = null` zurueck

## Was wir daraus mitgenommen haben
Soft Delete ist ein klassisches Pattern das sich bei fast jeder App lohnt. Es hat fast keine Nachteile und spart Support-Aufwand weil man Daten wiederherstellen kann wenn ein User sich vertan hat.

Die Faustregel: `deletedAt` statt `DELETE`. Nur in sehr seltenen Faellen wo Daten aus Datenschutzgruenden wirklich weg müssen, sollte man physisch loeschen.

`isDeleted()` oder `isActive()` als abgeleitete Methode statt das Feld direkt abzufragen macht den Code lesbarer:
```java
public boolean isDeleted() { return deletedAt != null; }
```

## Key Takeaways
- `deletedAt: LocalDateTime` Feld auf jedem "loeschbaren" Entity
- `IS NULL` im Query fuer aktive, `IS NOT NULL` fuer gelöschte
- Restore = `setDeletedAt(null)`
- Soft Delete ist fast immer die richtige Wahl ausser bei Datenschutz-Pflicht
