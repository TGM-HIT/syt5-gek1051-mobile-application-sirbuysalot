import { test, expect } from '@playwright/test'
import { setupLocalStorage, mockApi } from './helpers'

test.describe('Listen teilen & beitreten', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
  })

  async function setupPage(page: any, path: string, name = 'TestUser') {
    await page.goto(path)
    await setupLocalStorage(page, name)
    await page.reload()
    await page.waitForLoadState('networkidle')
  }

  test('öffnet Share-Dialog und zeigt Zugangscode', async ({ page }) => {
    await setupPage(page, '/list/list-1')

    // Click share button
    await page.locator('button').filter({ has: page.locator('.mdi-share-variant') }).click()

    await expect(page.locator('text=Liste teilen')).toBeVisible()
    await expect(page.locator('text=ABC123')).toBeVisible()
  })

  test('zeigt Join-URL im Share-Dialog', async ({ page }) => {
    await setupPage(page, '/list/list-1')

    await page.locator('button').filter({ has: page.locator('.mdi-share-variant') }).click()

    // URL should contain /join/ABC123
    const urlInput = page.locator('.v-dialog input[readonly]')
    await expect(urlInput).toHaveValue(/\/join\/ABC123/)
  })

  test('schließt Share-Dialog', async ({ page }) => {
    await setupPage(page, '/list/list-1')

    await page.locator('button').filter({ has: page.locator('.mdi-share-variant') }).click()
    await page.locator('.v-dialog').getByRole('button', { name: 'Schließen' }).click()
    await expect(page.locator('text=Liste teilen')).not.toBeVisible()
  })

  test('Join-Seite zeigt Liste und Beitrittsformular', async ({ page }) => {
    await setupPage(page, '/join/ABC123', 'Test')

    await expect(page.locator('text=Liste beitreten')).toBeVisible()
    await expect(page.locator('text=Wocheneinkauf')).toBeVisible()
    await expect(page.locator('text=ABC123')).toBeVisible()
  })

  test('tritt einer Liste bei', async ({ page }) => {
    await setupPage(page, '/join/ABC123', 'Gast')

    // Fill the JoinView's display name input
    await page.getByLabel('Dein Anzeigename').fill('Gast')
    await page.getByRole('button', { name: 'Beitreten' }).click()

    await expect(page.locator('text=Erfolgreich beigetreten!')).toBeVisible()
    await expect(page.locator('text=Zur Liste')).toBeVisible()
  })

  test('Beitreten-Button deaktiviert ohne Name', async ({ page }) => {
    await setupPage(page, '/join/ABC123', 'Test')

    // Clear the JoinView input (may be pre-filled)
    await page.getByLabel('Dein Anzeigename').clear()
    const joinBtn = page.getByRole('button', { name: 'Beitreten' })
    await expect(joinBtn).toBeDisabled()
  })

  test('zeigt Fehlermeldung bei ungueltigem Code', async ({ page }) => {
    // Mock 404 for invalid code
    await page.route('**/api/lists/join/INVALID', async (route) => {
      await route.fulfill({ status: 404, body: '{}' })
    })

    await setupPage(page, '/join/INVALID', 'Test')
    await expect(page.locator('text=Keine Liste mit dem Code')).toBeVisible()
  })

  test('navigiert nach Beitritt zur Liste', async ({ page }) => {
    await setupPage(page, '/join/ABC123', 'Gast')

    await page.getByLabel('Dein Anzeigename').fill('Gast')
    await page.getByRole('button', { name: 'Beitreten' }).click()

    await page.locator('text=Zur Liste').click()
    await expect(page).toHaveURL(/\/list\/list-1/)
  })
})
