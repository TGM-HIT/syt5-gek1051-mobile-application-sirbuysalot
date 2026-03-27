# Prompt: List Duplication Feature - Backend Logic

## When
Mid April 2026, during US-24 implementation

## Context
We needed a "duplicate list" feature. The user should be able to click a button on any list and get a copy with "(Kopie)" appended to the name. All products should be copied but reset (not purchased, no timestamps).

## Prompt (exact wording)
"Hey, I need to implement a 'duplicate list' feature for my Spring Boot shopping list app. The user clicks a button, gets a copy of the list with all products. The copy should have a new name like 'Originalname (Kopie)' and a new access code. Products should be copied but reset - so purchased=false, no timestamps, etc. How do I structure the service method?"

## Ergebnis
- `ShoppingListService.duplicate()` Methode:
  ```java
  public ShoppingList duplicate(UUID listId) {
    ShoppingList original = findById(listId)
        .orElseThrow(() -> new RuntimeException("List not found"));
    
    // Create new list
    ShoppingList copy = ShoppingList.builder()
        .name(original.getName() + " (Kopie)")
        .accessCode(generateAccessCode())
        .version(1)
        .build();
    copy = repository.save(copy);
    
    // Copy products (reset state)
    List<Product> originalProducts = productRepository
        .findByShoppingListIdAndDeletedAtIsNull(listId);
    
    for (Product originalProduct : originalProducts) {
      Product copyProduct = Product.builder()
          .name(originalProduct.getName())
          .price(originalProduct.getPrice())
          .position(originalProduct.getPosition())
          .purchased(false)
          .shoppingList(copy)
          .version(1)
          .build();
      productRepository.save(copyProduct);
    }
    
    return copy;
  }
  ```

- Copy-Endpoint im Controller:
  ```java
  @PostMapping("/{id}/duplicate")
  public ResponseEntity<ShoppingList> duplicate(@PathVariable UUID id) {
    return ResponseEntity.ok(service.duplicate(id));
  }
  ```

## Was wir daraus mitgenommen haben
Beim Duplizieren sollte man bewusst nicht alles kopieren:
- Gekauft-Status zurücksetzen (false)
- Timestamps (purchasedAt, etc.) löschen
- Version auf 1 zurücksetzen
- Neuen Access Code generieren

Das ist logisch weil eine Kopie einer Einkaufsliste ja wieder "frisch" sein sollte. Wer ein Produkt als "gekauft" markiert hat, will das in der Kopie nicht sofort sehen.

Die Produkt-Kopien sollten alle in einer Transaction passieren damit nichts halb-fertiges in der DB landet.

## Key Takeaways
- `@Transactional` auf Service-Methode
- Builder-Pattern für das Erstellen der Kopie
- Products in Schleife kopieren, nicht alles auf einmal
- Reset-Felder explizit setzen (purchased=false, version=1)
