import { expect, test, type Page } from '@playwright/test'

const handle = (page: Page) => page.locator('[title*="按住拖曳"]')
const dock = (page: Page) => handle(page).locator('..')

const startDrag = async (page: Page) => {
  await handle(page).hover()
  await expect(dock(page)).toHaveCSS('opacity', '1')
  // Wait for the hover slide-out before choosing the grab point.
  await page.waitForTimeout(350)
  const box = (await handle(page).boundingBox())!
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  return point
}

const moveDrag = async (page: Page, from: { x: number; y: number }, to: { x: number; y: number }) => {
  // Separate rendered frames catch the old layout effect resetting x to zero.
  for (let step = 1; step <= 12; step++) {
    await page.mouse.move(from.x + (to.x - from.x) * step / 12, from.y + (to.y - from.y) * step / 12)
    await page.waitForTimeout(25)
  }
}

const expectSide = async (page: Page, side: 'left' | 'right') => {
  await expect(dock(page)).toHaveClass(new RegExp(`${side}-0`))
  await expect.poll(() => page.evaluate(() => localStorage.getItem('webtalk-floating-placement'))).toBe(side)
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.route('**/dock-test', route => route.fulfill({
    contentType: 'text/html; charset=utf-8',
    body: `<html><head><meta charset="utf-8"></head><body><h1>Dock interaction test</h1><script src="/${testInfo.project.name}.js" data-webtalk-scope="origin"></script></body></html>`
  }))
  await page.goto('/dock-test')
  await handle(page).waitFor()
})

test('follows the pointer across rendered frames and snaps in both directions', async ({ page }) => {
  let from = await startDrag(page)
  await moveDrag(page, from, { x: 150, y: from.y + 60 })
  await expect.poll(async () => (await handle(page).boundingBox())!.x).toBeLessThan(200)
  await page.mouse.up()
  await expectSide(page, 'left')
  await expect.poll(() => page.evaluate(() => Number(localStorage.getItem('webtalk-floating-offset')))).toBe(60)

  from = await startDrag(page)
  await moveDrag(page, from, { x: 1050, y: from.y })
  await expect.poll(async () => (await handle(page).boundingBox())!.x).toBeGreaterThan(1000)
  await page.mouse.up()
  await expectSide(page, 'right')
})

test('returns to the original edge when released before the midpoint', async ({ page }) => {
  const from = await startDrag(page)
  await moveDrag(page, from, { x: 700, y: from.y })
  await page.mouse.up()
  await expect(dock(page)).toHaveClass(/right-0/)
  await expect.poll(async () => (await handle(page).boundingBox())!.x).toBeGreaterThan(1100)
})

test('double-click switches sides and preserves the side after reload', async ({ page }) => {
  await handle(page).dblclick()
  await expectSide(page, 'left')
  await page.reload()
  await expectSide(page, 'left')
  await handle(page).dblclick()
  await expectSide(page, 'right')
})

test('vertical drag preserves its offset without switching sides', async ({ page }) => {
  const from = await startDrag(page)
  await moveDrag(page, from, { x: from.x, y: from.y + 100 })
  await page.mouse.up()
  await expect(dock(page)).toHaveClass(/right-0/)
  await expect.poll(() => page.evaluate(() => Number(localStorage.getItem('webtalk-floating-offset')))).toBe(100)
  await page.reload()
  await expect.poll(async () => (await handle(page).boundingBox())!.y).toBeGreaterThan(from.y + 80)
})
