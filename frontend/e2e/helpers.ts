import { Page } from '@playwright/test'

/**
 * Sets up localStorage with user data and list IDs before the page loads.
 * This must be called AFTER page.goto() since localStorage is domain-specific.
 */
export async function setupLocalStorage(page: Page, userName: string = 'TestUser') {
  await page.evaluate((name) => {
    localStorage.setItem('sirbuysalot_user', JSON.stringify({ displayName: name }))
    localStorage.setItem('sirbuysalot_my_lists', JSON.stringify(['list-1', 'list-2']))
  }, userName)
}

/**
 * Sets the user display name via the dialog that appears on first visit.
 */
export async function setUserName(page: Page, name: string) {
  // The name dialog appears automatically if no name is set
  const dialog = page.locator('.v-dialog')
  if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.locator('.v-dialog input').fill(name)
    await page.locator('.v-dialog').getByRole('button', { name: 'Speichern' }).click()
    // Wait for dialog to close
    await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  }
}

/**
 * Mocks the backend API with predefined responses.
 */
export async function mockApi(page: Page) {
  // Mock GET /api/lists - return sample lists
  await page.route('**/api/lists', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'list-1',
            name: 'Wocheneinkauf',
            accessCode: 'ABC123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            version: 1,
            products: [
              { id: 'p1', name: 'Milch', price: 1.49, purchased: false, purchasedBy: null, purchasedAt: null, position: 0, tags: [], version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null },
              { id: 'p2', name: 'Brot', price: 2.99, purchased: true, purchasedBy: 'Deniz', purchasedAt: new Date().toISOString(), position: 1, tags: [], version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null },
            ],
            users: [{ id: 'u1', displayName: 'Deniz' }],
          },
          {
            id: 'list-2',
            name: 'Party Einkauf',
            accessCode: 'XYZ789',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            version: 1,
            products: [],
            users: [],
          },
        ]),
      })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'list-new',
          name: body.name,
          accessCode: 'NEW456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          version: 1,
          products: [],
          users: [],
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock GET /api/lists/deleted
  await page.route('**/api/lists/deleted', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'list-del',
          name: 'Alte Liste',
          accessCode: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: new Date().toISOString(),
          version: 1,
          products: [],
          users: [],
        },
      ]),
    })
  })

  // Mock newly created list (for navigation after create)
  await page.route('**/api/lists/list-new', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'list-new',
          name: 'Neue Testliste',
          accessCode: 'NEW456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          version: 1,
          products: [],
          users: [],
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock newly created list products
  await page.route('**/api/lists/list-new/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Mock newly created list tags
  await page.route('**/api/lists/list-new/tags', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Mock individual list
  await page.route('**/api/lists/list-1', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'list-1',
          name: 'Wocheneinkauf',
          accessCode: 'ABC123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          version: 1,
          products: [],
          users: [{ id: 'u1', displayName: 'Deniz' }],
        }),
      })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'list-1', name: body.name ?? 'Wocheneinkauf', accessCode: 'ABC123', version: 2, products: [], users: [] }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock list products
  await page.route('**/api/lists/list-1/products', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'p1', name: 'Milch', price: 1.49, purchased: false, purchasedBy: null, purchasedAt: null, position: 0, tags: [{ id: 't1', name: 'Kühlregal' }], version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null },
          { id: 'p2', name: 'Brot', price: 2.99, purchased: true, purchasedBy: 'Deniz', purchasedAt: new Date().toISOString(), position: 1, tags: [], version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null },
          { id: 'p3', name: 'Butter', price: 1.99, purchased: false, purchasedBy: null, purchasedAt: null, position: 2, tags: [{ id: 't1', name: 'Kühlregal' }], version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null },
        ]),
      })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'p-new',
          name: body.name,
          price: body.price ?? null,
          purchased: false,
          purchasedBy: null,
          purchasedAt: null,
          position: 3,
          tags: [],
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock product toggle purchase
  await page.route('**/api/lists/list-1/products/p1/purchase', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'p1', name: 'Milch', price: 1.49, purchased: true, purchasedBy: 'TestUser', purchasedAt: new Date().toISOString(), position: 0, tags: [{ id: 't1', name: 'Kühlregal' }], version: 2,
      }),
    })
  })

  // Mock product delete
  await page.route('**/api/lists/list-1/products/p1', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'p1', name: body.name ?? 'Milch', price: body.price ?? 1.49, purchased: false, tags: [], version: 2 }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock deleted products
  await page.route('**/api/lists/list-1/products/deleted', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'p-del', name: 'Eier', price: 3.49, purchased: false, purchasedBy: null, purchasedAt: null, position: 99, tags: [], version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: new Date().toISOString() },
      ]),
    })
  })

  // Mock product restore
  await page.route('**/api/lists/list-1/products/p-del/restore', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'p-del', name: 'Eier', price: 3.49, purchased: false, tags: [], version: 2, deletedAt: null }),
    })
  })

  // Mock tags
  await page.route('**/api/lists/list-1/tags', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 't1', name: 'Kühlregal' },
          { id: 't2', name: 'Gemüse' },
        ]),
      })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 't-new', name: body.name }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock tag delete
  await page.route('**/api/lists/list-1/tags/t1', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else {
      await route.continue()
    }
  })

  // Mock join
  await page.route('**/api/lists/join/ABC123', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'list-1', name: 'Wocheneinkauf' }),
    })
  })

  // Mock join user
  await page.route('**/api/lists/list-1/users', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u-new', displayName: 'Gast' }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock list duplicate
  await page.route('**/api/lists/list-1/duplicate', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'list-dup',
        name: 'Wocheneinkauf (Kopie)',
        accessCode: 'DUP111',
        products: [],
        users: [],
        version: 1,
      }),
    })
  })

  // Mock list restore
  await page.route('**/api/lists/list-del/restore', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'list-del', name: 'Alte Liste', deletedAt: null, version: 2 }),
    })
  })

  // Mock reorder
  await page.route('**/api/lists/list-1/products/reorder', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
}
