# Prompt: Total Cost Calculation - Vue Computed Properties

## When
During US-22 implementation, April 2026

## Context
We wanted to show the total cost of all products, as well as costs for purchased vs remaining items. This seemed simple but needed to handle null/undefined prices and edge cases.

## Prompt (exact wording)
"I'm displaying cost information in my shopping list app. I need three values:
1. Total cost of all products with prices
2. Cost of purchased products
3. Cost of remaining (unpurchased) products

Each product has an optional price field. How do I calculate these efficiently in Vue 3? Should I use a computed property or a method?"

## Ergebnis
- Computed properties in ListView.vue:
  ```typescript
  const totalCost = computed(() => {
    return products.value
      .filter((p) => p.price != null)
      .reduce((sum, p) => sum + (p.price ?? 0), 0)
  })
  
  const purchasedCost = computed(() => {
    return products.value
      .filter((p) => p.purchased && p.price != null)
      .reduce((sum, p) => sum + (p.price ?? 0), 0)
  })
  
  const remainingCost = computed(() => totalCost.value - purchasedCost.value)
  ```

- Anzeige mit formatPrice():
  ```typescript
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('de-AT', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price)
  }
  ```

- Template mit bedingter Anzeige:
  ```vue
  <v-card v-if="totalCost > 0" class="mb-5 pa-4" border>
    <div class="d-flex justify-space-between align-center">
      <div>
        <div class="text-caption text-medium-emphasis">Gekauft</div>
        <div class="text-body-1 font-weight-bold text-success">
          {{ formatPrice(purchasedCost) }}
        </div>
      </div>
      <!-- Remaining and Total -->
    </div>
  </v-card>
  ```

## Was wir daraus mitgenommen haben
`Intl.NumberFormat` mit `de-AT` Locale ist perfect für österreichische Euros - das Format ist "1.234,56 €" statt "1,234.56$".

`computed()` statt `methods()` ist wichtig weil:
1. Computed properties werden gecached
2. Vue weiß wann es neu berechnen muss
3. Performance bei vielen Updates besser

Die `remainingCost` als Differenz zu berechnen statt separat istDRY - keineinkonsistente Daten wenn Produkte hinzugefügt werden.

`v-if="totalCost > 0"` versteckt die Karte wenn keinePreise vorhanden sind - sauberer als eine leere Kosten-Anzeige.

## Key Takeaways
- `Intl.NumberFormat('de-AT')` für österreichisches Währungsformat
- `computed()` für berechnete Werte
- `filter().reduce()` für Summen
- `v-if` für Conditional Display
- `??` oder `!= null` Check für optionale Werte
