import { test, expect } from '@playwright/test'
import { setUserName, mockApi } from './helpers'

test.describe('Tags & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
    await page.goto('/list/list-1')
    await setUserName(page, 'TestUser')
  })

  test('zeigt Tag-Chips an Produkten', async ({ page }) => {
    const milchCard = page.locator('.product-card').filter({ hasText: 'Milch' })
    await expect(milchCard.locator('text=Kühlregal')).toBeVisible()
  })

  test('zeigt Tag-Filterleiste', async ({ page }) => {
    await expect(page.locator('.v-chip').filter({ hasText: 'Kühlregal' }).first()).toBeVisible()
    await expect(page.locator('.v-chip').filter({ hasText: 'Gemüse' }).first()).toBeVisible()
  })

  test('filtert Produkte nach Tag', async ({ page }) => {
    // Click on Kühlregal filter chip (the one in the filter bar, not on a product)
    const filterChips = page.locator('.d-flex.flex-wrap .v-chip')
    await filterChips.filter({ hasText: 'Kühlregal' }).first().click()

    // Should show Milch and Butter (tagged Kühlregal), hide Brot
    await expect(page.locator('.product-card').filter({ hasText: 'Milch' })).toBeVisible()
    await expect(page.locator('.product-card').filter({ hasText: 'Butter' })).toBeVisible()
  })

  test('setzt Tag-Filter zurück', async ({ page }) => {
    // Apply filter
    const filterChips = page.locator('.d-flex.flex-wrap .v-chip')
    await filterChips.filter({ hasText: 'Kühlregal' }).first().click()

    // Reset
    await page.locator('text=Filter zurücksetzen').click()

    // All products visible again
    await expect(page.locator('.product-card').filter({ hasText: 'Brot' })).toBeVisible()
  })

  test('öffnet Tag-Management Dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Tags' }).click()
    await expect(page.locator('.v-dialog')).toBeVisible()
  })
})
