# Prompt: REST API Design - Warum PATCH fuer Teil-Updates

## When
Early March 2026, during initial API planning

## Context
We were debating whether to use PUT or PATCH for updating individual fields like price or purchase status. PUT replaces the whole resource, PATCH applies a partial update. We went with PATCH for most things but PUT for full product updates.

## Prompt (paraphrased)
"I'm designing a REST API for a shopping list app. When a user marks a product as purchased, should I use PUT or PATCH? What about when they edit just the price? And how do I handle the case where two people try to buy the same item at the same time?"

## Ergebnis
- `PATCH /api/lists/{listId}/products/{id}/purchase` - nur purchased + purchasedBy + purchasedAt
- `PUT /api/lists/{listId}/products/{id}` - vollstaendiger Product-Body, ersetzt alles
- `PATCH` ist idempotent aber nicht safe - perfectas fuer toggle-Operationen

PATCH Request fuer Kaufen:
```json
// Request
PATCH /api/lists/abc/products/123/purchase
{ "purchasedBy": "Alice" }

// Response
{
  "id": "123",
  "name": "Milch",
  "purchased": true,
  "purchasedBy": "Alice",
  "purchasedAt": "2026-03-15T14:30:00Z",
  "version": 2
}
```

Optimistic Locking via `version` Header:
```
// Request
If-Match: "1"
// Response: 200 OK + version 2
// oder 409 Conflict wenn Version mismatch
```

## Was wir daraus mitgenommen haben
Die Unterscheidung PUT vs PATCH ist wichtig:
- PUT = replace (vollstaendig)
- PATCH = apply (teilweise)

Bei `markPurchased` ist PATCH richtig weil nur ein Feld geaendert wird. Bei `updateProduct` wo alle Felder kommen koennen, ist PUT ok weil der Client die Verantwortung hat alle Felder zu senden.

`If-Match` Header fuer Optimistic Locking ist der Standard-Weg in HTTP. Im Frontend speichern wir die aktuelle Version und senden sie als `If-Match` Header mit. Wenn der Server 409 zurueckgibt, zeigt die UI den Konflikt.

## Key Takeaways
- PATCH fuer Teil-Updates, PUT fuer Replace
- `If-Match` Header fuer Optimistic Locking
- Version-Feld im Response immer mitsenden
- 409 Conflict bei Version-Mismatch
