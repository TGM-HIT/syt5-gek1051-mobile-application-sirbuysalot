import { test, expect } from '@playwright/test'
import { setupLocalStorage, mockApi } from './helpers'

test.describe('Navigation & App-Shell', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page)
  })

  async function setupPage(page: any, name = 'TestUser') {
    await page.goto('/')
    await setupLocalStorage(page, name)
    await page.reload()
    await page.waitForLoadState('networkidle')
  }

  test('zeigt App-Bar mit SirBuysALot Titel', async ({ page }) => {
    await setupPage(page)
    await expect(page.locator('text=SirBuysALot')).toBeVisible()
  })

  test('Logo-Klick navigiert zur Startseite', async ({ page }) => {
    await page.goto('/list/list-1')
    await setupLocalStorage(page, 'TestUser')
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.locator('a').filter({ hasText: 'SirBuysALot' }).click()
    await expect(page).toHaveURL('/')
  })

  test('zeigt Dark-Mode Toggle', async ({ page }) => {
    await setupPage(page)

    const darkToggle = page.locator('button').filter({
      has: page.locator('.mdi-weather-sunny, .mdi-weather-night'),
    })
    await expect(darkToggle).toBeVisible()
  })

  test('wechselt Dark Mode', async ({ page }) => {
    await setupPage(page)

    const darkToggle = page.locator('button').filter({
      has: page.locator('.mdi-weather-sunny, .mdi-weather-night'),
    })
    // Check initial icon, click, verify icon changed
    const sunnyIcon = page.locator('.mdi-weather-sunny')
    const nightIcon = page.locator('.mdi-weather-night')
    const hadSunny = await sunnyIcon.count() > 0
    await darkToggle.click()
    if (hadSunny) {
      await expect(nightIcon.first()).toBeVisible()
    } else {
      await expect(sunnyIcon.first()).toBeVisible()
    }
  })

  test('zeigt Benutzername in der App-Bar', async ({ page }) => {
    await setupPage(page)
    await expect(page.locator('.v-app-bar').locator('text=TestUser')).toBeVisible()
  })

  test('öffnet Namensänderungs-Dialog bei Klick auf Benutzername', async ({ page }) => {
    await setupPage(page)
    // Click on user chip
    await page.locator('.user-chip').click()
    await expect(page.locator('text=Wer bist du?')).toBeVisible()
  })

  test('zeigt Name-Dialog beim ersten Besuch', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page.locator('text=Wer bist du?')).toBeVisible()
  })

  test('speichert Benutzername und zeigt Willkommens-Snackbar', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await page.locator('.v-dialog input').fill('NeuerUser')
    await page.locator('.v-dialog').getByRole('button', { name: 'Speichern' }).click()

    await expect(page.locator('.v-snackbar')).toContainText('Willkommen')
  })

  test('Seiten-Transition funktioniert', async ({ page }) => {
    await setupPage(page)

    // Navigate to list
    await page.locator('text=Wocheneinkauf').click()
    await expect(page).toHaveURL(/\/list\/list-1/)

    // Navigate back
    await page.locator('a[href="/"]').or(page.locator('button').filter({ has: page.locator('.mdi-arrow-left') })).first().click()
    await expect(page).toHaveURL('/')
  })
})
