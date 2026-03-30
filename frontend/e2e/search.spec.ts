import { test, expect } from '@playwright/test'
import { setUserName, mockApi } from './helpers'

test.describe('Produktsuche', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
    await page.goto('/list/list-1')
    await setUserName(page, 'TestUser')
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
    await searchInput.fill('Kuehlregal')

    // Milch and Butter have tag Kuehlregal
    await expect(page.locator('.product-card').filter({ hasText: 'Milch' })).toBeVisible()
    await expect(page.locator('.product-card').filter({ hasText: 'Butter' })).toBeVisible()
  })

  test('leere Suche zeigt alle Produkte', async ({ page }) => {
    const searchInput = page.locator('.v-text-field').filter({ hasText: /durchsuchen/i }).locator('input')
    await searchInput.fill('Milch')
    await searchInput.clear()

    await expect(page.locator('.product-card')).toHaveCount(3)
  })
})
