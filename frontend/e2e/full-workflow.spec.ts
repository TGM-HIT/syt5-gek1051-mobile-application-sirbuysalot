import { test, expect } from '@playwright/test'
import { mockApi } from './helpers'

test.describe('Vollständiger Workflow A-Z', () => {
  test('kompletter Einkaufsworkflow: Name setzen, Liste erstellen, Produkte verwalten, teilen', async ({ page }) => {
    await mockApi(page)

    // 1. Startseite besuchen
    await page.goto('/')
    await expect(page.locator('text=SirBuysALot')).toBeVisible()

    // 2. Name setzen (Dialog erscheint automatisch)
    await page.locator('.v-dialog input').fill('Deniz')
    await page.locator('.v-dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.locator('.v-snackbar')).toContainText('Willkommen')

    // 3. Listen werden angezeigt
    await expect(page.locator('text=Deine Listen')).toBeVisible()
    await expect(page.locator('text=Wocheneinkauf')).toBeVisible()

    // 4. Neue Liste erstellen
    await page.locator('.fab-btn').click()
    await page.locator('.v-dialog input').fill('Abendessen')
    await page.locator('.v-dialog').getByRole('button', { name: 'Erstellen' }).click()
    await expect(page).toHaveURL(/\/list\//)

    // 5. Zurück zur Startseite navigieren
    await page.locator('a').filter({ hasText: 'SirBuysALot' }).click()
    await expect(page).toHaveURL('/')

    // 6. Existierende Liste öffnen
    await page.locator('text=Wocheneinkauf').click()
    await expect(page).toHaveURL(/\/list\/list-1/)

    // 7. Produkte sind sichtbar
    await expect(page.locator('text=Milch')).toBeVisible()
    await expect(page.locator('text=Brot')).toBeVisible()
    await expect(page.locator('text=Butter')).toBeVisible()

    // 8. Fortschrittsbalken prüfen
    await expect(page.locator('text=33%')).toBeVisible()

    // 9. Neues Produkt hinzufügen
    await page.locator('.fab-btn').click()
    await page.locator('.v-dialog input').first().fill('Käse')
    await page.locator('.v-dialog input[type="number"]').fill('5.99')
    await page.locator('.v-dialog').getByRole('button', { name: 'Hinzufügen' }).click()
    await expect(page.locator('.v-snackbar')).toBeVisible()

    // 10. Produkt als gekauft markieren
    await page.locator('.product-card').filter({ hasText: 'Milch' }).click()

    // 11. Share-Dialog öffnen
    await page.locator('button').filter({ has: page.locator('.mdi-share-variant') }).click()
    await expect(page.locator('text=Liste teilen')).toBeVisible()
    await expect(page.locator('text=ABC123')).toBeVisible()
    await page.locator('.v-dialog').getByRole('button', { name: 'Schließen' }).click()

    // 12. Suche nutzen
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Milch')
    await expect(page.locator('.product-card').filter({ hasText: 'Milch' })).toBeVisible()
    await searchInput.clear()

    // 13. Tag-Filter nutzen
    const filterChip = page.locator('.d-flex.flex-wrap .v-chip').filter({ hasText: 'Kühlregal' }).first()
    if (await filterChip.isVisible().catch(() => false)) {
      await filterChip.click()
      // Reset filter
      const resetBtn = page.locator('text=Filter zurücksetzen')
      if (await resetBtn.isVisible().catch(() => false)) {
        await resetBtn.click()
      }
    }

    // 14. Dark Mode toggle
    const darkToggle = page.locator('button').filter({
      has: page.locator('.mdi-weather-sunny, .mdi-weather-night'),
    })
    await darkToggle.click()
    await darkToggle.click() // Toggle back

    // 15. Zurück zur Startseite
    await page.locator('a').filter({ hasText: 'SirBuysALot' }).click()
    await expect(page).toHaveURL('/')

    // Workflow complete
    await expect(page.locator('text=Deine Listen')).toBeVisible()
  })

  test('Beitritts-Workflow: über Link beitreten, zur Liste navigieren', async ({ page }) => {
    await mockApi(page)

    // 1. Join-Seite öffnen
    await page.goto('/join/ABC123')
    // Dismiss name dialog first
    const nameDialog = page.locator('.v-dialog')
    if (await nameDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('.v-dialog input').fill('GastUser')
      await page.locator('.v-dialog').getByRole('button', { name: 'Speichern' }).click()
      await nameDialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
    }
    await expect(page.locator('text=Liste beitreten')).toBeVisible()
    await expect(page.locator('text=Wocheneinkauf')).toBeVisible()

    // 2. Name eingeben und beitreten
    await page.getByLabel('Dein Anzeigename').fill('GastUser')
    await page.getByRole('button', { name: 'Beitreten' }).click()

    // 3. Erfolgsmeldung
    await expect(page.locator('text=Erfolgreich beigetreten!')).toBeVisible()

    // 4. Zur Liste navigieren
    await page.locator('text=Zur Liste').click()
    await expect(page).toHaveURL(/\/list\/list-1/)
    await expect(page.locator('text=Wocheneinkauf')).toBeVisible()
  })

  test('Löschen-und-Wiederherstellen-Workflow', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    // Set name
    await page.locator('.v-dialog input').fill('Admin')
    await page.locator('.v-dialog').getByRole('button', { name: 'Speichern' }).click()

    // Show deleted lists
    await page.locator('text=Gelöschte Listen anzeigen').click()
    await expect(page.locator('text=Alte Liste')).toBeVisible()

    // Restore the deleted list
    await page.getByRole('button', { name: 'Wiederherstellen' }).click()
    await expect(page.locator('.v-snackbar')).toBeVisible()
  })
})
