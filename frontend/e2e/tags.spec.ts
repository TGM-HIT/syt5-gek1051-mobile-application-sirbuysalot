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
    await expect(milchCard.locator('text=Kuehlregal')).toBeVisible()
  })

  test('zeigt Tag-Filterleiste', async ({ page }) => {
    await expect(page.locator('.v-chip').filter({ hasText: 'Kuehlregal' }).first()).toBeVisible()
    await expect(page.locator('.v-chip').filter({ hasText: 'Gemuese' }).first()).toBeVisible()
  })

  test('filtert Produkte nach Tag', async ({ page }) => {
    // Click on Kuehlregal filter chip (the one in the filter bar, not on a product)
    const filterChips = page.locator('.d-flex.flex-wrap .v-chip')
    await filterChips.filter({ hasText: 'Kuehlregal' }).first().click()

    // Should show Milch and Butter (tagged Kuehlregal), hide Brot
    await expect(page.locator('.product-card').filter({ hasText: 'Milch' })).toBeVisible()
    await expect(page.locator('.product-card').filter({ hasText: 'Butter' })).toBeVisible()
  })

  test('setzt Tag-Filter zurueck', async ({ page }) => {
    // Apply filter
    const filterChips = page.locator('.d-flex.flex-wrap .v-chip')
    await filterChips.filter({ hasText: 'Kuehlregal' }).first().click()

    // Reset
    await page.locator('text=Filter zurücksetzen').click()

    // All products visible again
    await expect(page.locator('.product-card').filter({ hasText: 'Brot' })).toBeVisible()
  })

  test('oeffnet Tag-Management Dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Tags' }).click()
    await expect(page.locator('.v-dialog')).toBeVisible()
  })
})
