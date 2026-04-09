# US-08: Wer hat wann markiert

## Beschreibung

Als Benutzer moechte ich bei markierten Produkten sehen, wer es wann markiert hat (Name + Uhrzeit), damit keine Doppelkaeufe entstehen.

## Akzeptanzkriterien

- [x] Bei markierten Produkten wird Anzeigename angezeigt
- [x] Uhrzeit der Markierung wird angezeigt
- [x] Information aktualisiert sich bei Statusaenderung

## Technische Umsetzung

### Backend

- Das `Product`-Entity speichert `purchasedBy` (String mit Anzeigename) und `purchasedAt` (LocalDateTime). Diese werden beim Toggle in `ProductService.markPurchased()` gesetzt.

### Frontend

- `ListView.vue`: Unter jedem markierten Produkt wird eine Zeile mit gruenem Haekchen-Icon, dem Namen und der Uhrzeit angezeigt. Die Formatierung der Uhrzeit erfolgt mit `Intl.DateTimeFormat` im Format "HH:mm" (Stunde:Minute).
- Die Information verschwindet, sobald die Markierung aufgehoben wird.

### Ablauf

1. Benutzer markiert ein Produkt als gekauft
2. Sein Anzeigename und die aktuelle Uhrzeit werden gespeichert
3. Alle Teilnehmer sehen unter dem Produkt: "Max · 14:32"
4. Bei Aufhebung der Markierung verschwindet die Info

---

## Testabdeckung

| Akzeptanzkriterium | Testdatei | Testname |
|---|---|---|
| Bei markierten Produkten wird Anzeigename angezeigt | ProductServiceTest.java | markPurchased_togglesFromUnpurchasedToPurchased |
| Uhrzeit der Markierung wird angezeigt | ProductServiceTest.java | markPurchased_togglesFromUnpurchasedToPurchased |
| Information aktualisiert sich bei Statusaenderung | ProductServiceTest.java | markPurchased_togglesFromPurchasedToUnpurchased |
