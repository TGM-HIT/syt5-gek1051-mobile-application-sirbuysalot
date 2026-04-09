import { test, expect } from '@playwright/test'
import { setUserName, mockApi } from './helpers'

test.describe('Produkte (Listenansicht)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
    await page.goto('/list/list-1')
    await setUserName(page, 'TestUser')
  })

  test('zeigt Listennamen und Produkte', async ({ page }) => {
    await expect(page.locator('text=Wocheneinkauf')).toBeVisible()
    await expect(page.locator('text=Milch')).toBeVisible()
    await expect(page.locator('text=Brot')).toBeVisible()
    await expect(page.locator('text=Butter')).toBeVisible()
  })

  test('zeigt Produktanzahl im Header', async ({ page }) => {
    // activeProducts = non-purchased products (2 of 3)
    await expect(page.locator('text=2 Produkte')).toBeVisible()
  })

  test('zeigt Fortschrittsbalken', async ({ page }) => {
    // 1 of 3 purchased = 33%
    await expect(page.locator('text=33%')).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
  })

  test('zeigt Kostenübersicht', async ({ page }) => {
    // Should show total cost section
    await expect(page.locator('text=Kosten')).toBeVisible()
    await expect(page.locator('text=Gesamt')).toBeVisible()
  })

  test('fügt neues Produkt hinzu', async ({ page }) => {
    await page.locator('.fab-btn').click()
    await expect(page.locator('text=Neues Produkt')).toBeVisible()

    await page.locator('.v-dialog input').first().fill('Käse')
    await page.locator('.v-dialog').getByRole('button', { name: 'Hinzufügen' }).click()

    // Snackbar confirmation
    await expect(page.locator('.v-snackbar')).toBeVisible()
  })

  test('fügt Produkt mit Preis hinzu', async ({ page }) => {
    await page.locator('.fab-btn').click()
    await page.locator('.v-dialog input').first().fill('Käse')
    // Fill price input (second input in dialog)
    await page.locator('.v-dialog input[type="number"]').fill('4.99')
    await page.locator('.v-dialog').getByRole('button', { name: 'Hinzufügen' }).click()
    await expect(page.locator('.v-snackbar')).toBeVisible()
  })

  test('Hinzufügen-Button ist deaktiviert bei leerem Namen', async ({ page }) => {
    await page.locator('.fab-btn').click()
    const addBtn = page.locator('.v-dialog').getByRole('button', { name: 'Hinzufügen' })
    await expect(addBtn).toBeDisabled()
  })

  test('markiert Produkt als gekauft', async ({ page }) => {
    // Click on the Milch product card
    await page.locator('.product-card').filter({ hasText: 'Milch' }).click()
  })

  test('zeigt gekaufte Produkte mit Durchstreichung und Info', async ({ page }) => {
    // Brot is purchased
    const brotCard = page.locator('.product-card').filter({ hasText: 'Brot' })
    await expect(brotCard).toHaveClass(/product-purchased/)
    await expect(brotCard.locator('text=Deniz')).toBeVisible()
  })

  test('zeigt Preis-Badge an Produkten', async ({ page }) => {
    // Milch has price 1.49 — price chip contains the formatted price
    const milchCard = page.locator('.product-card').filter({ hasText: 'Milch' })
    await expect(milchCard.locator('.v-chip').filter({ hasText: '1,49' })).toBeVisible()
  })

  test('blendet Produkt aus mit Bestätigung', async ({ page }) => {
    const deleteBtn = page.locator('.product-card').filter({ hasText: 'Milch' }).locator('button').filter({ has: page.locator('.mdi-delete-outline') })
    await deleteBtn.click()

    await expect(page.locator('text=Produkt ausblenden?')).toBeVisible()
    await page.getByRole('button', { name: 'Ausblenden' }).click()
  })

  test('zeigt ausgeblendete Produkte und stellt wieder her', async ({ page }) => {
    await page.locator('text=Ausgeblendete anzeigen').click()
    await expect(page.locator('text=Eier')).toBeVisible()

    await page.getByRole('button', { name: 'Wiederherstellen' }).click()
    await expect(page.locator('.v-snackbar')).toBeVisible()
  })

  test('öffnet Bearbeitungsdialog für Produkt', async ({ page }) => {
    const editBtn = page.locator('.product-card').filter({ hasText: 'Milch' }).locator('button').filter({ has: page.locator('.mdi-pencil') })
    await editBtn.click()

    // Edit dialog should be visible
    await expect(page.locator('.v-dialog')).toBeVisible()
  })

  test('zurück-Button navigiert zur Startseite', async ({ page }) => {
    await page.locator('a[href="/"]').or(page.locator('button').filter({ has: page.locator('.mdi-arrow-left') })).first().click()
    await expect(page).toHaveURL('/')
  })
})
