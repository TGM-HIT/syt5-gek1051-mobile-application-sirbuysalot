import { test, expect } from '@playwright/test'
import { setupLocalStorage, mockApi } from './helpers'

test.describe('Produktsuche', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
    await page.goto('/list/list-1')
    await setupLocalStorage(page, 'TestUser')
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('zeigt Suchfeld an', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Produkte durchsuchen...' })).toBeVisible()
  })

  test('filtert Produkte nach Suchbegriff', async ({ page }) => {
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Milch')

    await expect(page.locator('.product-card').filter({ hasText: 'Milch' })).toBeVisible()
    // Brot and Butter should be hidden
    await expect(page.locator('.product-card').filter({ hasText: 'Brot' })).not.toBeVisible()
    await expect(page.locator('.product-card').filter({ hasText: 'Butter' })).not.toBeVisible()
  })

  test('suche nach Tag-Name findet Produkte', async ({ page }) => {
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Kühlregal')

    // Milch and Butter have tag Kühlregal
    await expect(page.locator('.product-card').filter({ hasText: 'Milch' })).toBeVisible()
    await expect(page.locator('.product-card').filter({ hasText: 'Butter' })).toBeVisible()
  })

  test('zeigt Hinzufügen-Button wenn Suche keine Treffer hat', async ({ page }) => {
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Avocado')

    // No product cards visible
    await expect(page.locator('.product-card')).toHaveCount(0)

    // "Avocado" add button appears
    const addBtn = page.getByRole('button', { name: /Avocado.*hinzufügen/i })
    await expect(addBtn).toBeVisible()
  })

  test('öffnet Produkt-Dialog mit Suchbegriff vorausgefüllt', async ({ page }) => {
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Avocado')

    // Click the add button
    await page.getByRole('button', { name: /Avocado.*hinzufügen/i }).click()

    // Dialog opens with "Avocado" pre-filled in the name field
    const dialog = page.locator('.v-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Neues Produkt')).toBeVisible()
    const nameInput = dialog.locator('input').first()
    await expect(nameInput).toHaveValue('Avocado')
  })

  test('leere Suche zeigt alle Produkte', async ({ page }) => {
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Milch')
    await searchInput.clear()

    await expect(page.locator('.product-card')).toHaveCount(3)
  })
})
