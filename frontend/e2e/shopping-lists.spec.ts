import { test, expect } from '@playwright/test'
import { setUserName, mockApi } from './helpers'

test.describe('Einkaufslisten (Home)', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
    await page.goto('/')
    await setUserName(page, 'TestUser')
  })

  test('zeigt die Startseite mit Titel und Listen', async ({ page }) => {
    await expect(page.locator('text=Deine Listen')).toBeVisible()
    await expect(page.locator('text=Wocheneinkauf')).toBeVisible()
    await expect(page.locator('text=Party Einkauf')).toBeVisible()
  })

  test('zeigt Produktanzahl und Teilnehmer pro Liste', async ({ page }) => {
    await expect(page.locator('text=2 Produkte')).toBeVisible()
    await expect(page.locator('text=1 Teilnehmer')).toBeVisible()
  })

  test('erstellt eine neue Einkaufsliste', async ({ page }) => {
    // Click FAB button
    await page.locator('.fab-btn').click()

    // Fill in the name
    await page.locator('.v-dialog input').fill('Neue Testliste')
    await page.locator('.v-dialog').getByRole('button', { name: 'Erstellen' }).click()

    // Should navigate to the new list
    await expect(page).toHaveURL(/\/list\/list-new/)
  })

  test('erstellt Liste per Enter-Taste', async ({ page }) => {
    await page.locator('.fab-btn').click()
    await page.locator('.v-dialog input').fill('Enter-Liste')
    await page.locator('.v-dialog input').press('Enter')
    await expect(page).toHaveURL(/\/list\/list-new/)
  })

  test('navigiert zur Listenansicht per Klick', async ({ page }) => {
    await page.locator('text=Wocheneinkauf').click()
    await expect(page).toHaveURL(/\/list\/list-1/)
  })

  test('öffnet und schließt den Erstellungsdialog', async ({ page }) => {
    await page.locator('.fab-btn').click()
    await expect(page.locator('.v-dialog')).toBeVisible()
    await page.locator('.v-dialog').getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.locator('.v-dialog')).not.toBeVisible()
  })

  test('Erstellen-Button ist deaktiviert bei leerem Namen', async ({ page }) => {
    await page.locator('.fab-btn').click()
    const createBtn = page.locator('.v-dialog').getByRole('button', { name: 'Erstellen' })
    await expect(createBtn).toBeDisabled()
  })

  test('löscht eine Liste mit Bestätigung', async ({ page }) => {
    // Click delete on first list
    const deleteBtn = page.locator('.v-card').filter({ hasText: 'Wocheneinkauf' }).locator('[aria-label="delete-outline"]').or(
      page.locator('.v-card').filter({ hasText: 'Wocheneinkauf' }).locator('button').filter({ has: page.locator('.mdi-delete-outline') })
    )
    await deleteBtn.first().click()

    // Confirmation dialog
    await expect(page.locator('text=Liste löschen?')).toBeVisible()
    await page.getByRole('button', { name: 'Löschen' }).click()
  })

  test('benennt eine Liste um', async ({ page }) => {
    // Click edit on first list
    const editBtn = page.locator('.v-card').filter({ hasText: 'Wocheneinkauf' }).locator('button').filter({ has: page.locator('.mdi-pencil') })
    await editBtn.first().click()

    await expect(page.locator('text=Liste umbenennen')).toBeVisible()
    await page.locator('.v-dialog input').clear()
    await page.locator('.v-dialog input').fill('Neuer Name')
    await page.locator('.v-dialog').getByRole('button', { name: 'Speichern' }).click()
  })

  test('zeigt gelöschte Listen an und stellt wieder her', async ({ page }) => {
    // Toggle deleted lists
    await page.locator('text=Gelöschte Listen anzeigen').click()
    await expect(page.locator('text=Alte Liste')).toBeVisible()

    // Restore
    await page.getByRole('button', { name: 'Wiederherstellen' }).click()
  })

  test('dupliziert eine Liste', async ({ page }) => {
    const copyBtn = page.locator('.v-card').filter({ hasText: 'Wocheneinkauf' }).locator('button').filter({ has: page.locator('.mdi-content-copy') })
    await copyBtn.first().click()
    // Snackbar should confirm duplication
    await expect(page.locator('.v-snackbar')).toBeVisible()
  })
})
