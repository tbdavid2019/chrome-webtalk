import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseRgbColor,
  parseThemeToken,
  calculatePerceivedLuminance,
  checkDarkMode,
  subscribeDarkModeChange
} from './checkDarkMode.ts'

test('parseThemeToken matches word boundaries and ignores false positives or dual tokens', () => {
  assert.equal(parseThemeToken('dark'), 'dark')
  assert.equal(parseThemeToken('github-dark'), 'dark')
  assert.equal(parseThemeToken('only dark'), 'dark')
  assert.equal(parseThemeToken('light'), 'light')
  assert.equal(parseThemeToken('catppuccin-light'), 'light')
  assert.equal(parseThemeToken('only light'), 'light')
  assert.equal(parseThemeToken('highlight'), null)
  assert.equal(parseThemeToken('twilight'), null)
  assert.equal(parseThemeToken('starlight'), null)
  assert.equal(parseThemeToken('light dark'), null)
  assert.equal(parseThemeToken('dark light'), null)
})

test('parseRgbColor parses valid rgb and rgba strings correctly', () => {
  assert.deepEqual(parseRgbColor('rgb(0, 0, 0)'), { r: 0, g: 0, b: 0, a: 1 })
  assert.deepEqual(parseRgbColor('rgba(255, 255, 255, 0.8)'), { r: 255, g: 255, b: 255, a: 0.8 })
  assert.deepEqual(parseRgbColor('rgba(12, 25, 39, 1)'), { r: 12, g: 25, b: 39, a: 1 })
  assert.deepEqual(parseRgbColor('rgba(100, 150, 200, 50%)'), { r: 100, g: 150, b: 200, a: 0.5 })
})

test('parseRgbColor returns null for invalid or transparent inputs', () => {
  assert.equal(parseRgbColor(''), null)
  assert.equal(parseRgbColor('transparent'), null)
  assert.equal(parseRgbColor('inherit'), null)
  assert.equal(parseRgbColor('invalid-color'), null)
  assert.equal(parseRgbColor(null), null)
  assert.equal(parseRgbColor(undefined), null)
})

test('calculatePerceivedLuminance correctly computes ITU-R BT.601 luminance', () => {
  const blackLuminance = calculatePerceivedLuminance(0, 0, 0)
  assert.equal(blackLuminance, 0)

  const whiteLuminance = calculatePerceivedLuminance(255, 255, 255)
  assert.equal(whiteLuminance, 1)

  // Brand canvas background in dark mode: rgb(12, 25, 39)
  const darkLuminance = calculatePerceivedLuminance(12, 25, 39)
  assert.ok(darkLuminance < 0.5, 'dark canvas should have luminance < 0.5')

  // Brand warm cream in light mode: rgb(255, 249, 232)
  const lightLuminance = calculatePerceivedLuminance(255, 249, 232)
  assert.ok(lightLuminance > 0.5, 'light canvas should have luminance > 0.5')
})

test('checkDarkMode detects dark mode from Tier 1 explicit DOM classes', () => {
  const previousDocument = (globalThis as { document?: unknown }).document
  const previousWindow = (globalThis as { window?: unknown }).window

  const mockDocument = {
    documentElement: {
      classList: {
        contains(cls: string) {
          return cls === 'dark'
        }
      },
      getAttribute: () => null,
      style: { getPropertyValue: () => '' }
    },
    body: {
      classList: { contains: () => false },
      getAttribute: () => null
    }
  }

  Object.defineProperty(globalThis, 'document', { configurable: true, value: mockDocument })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({ matches: false }),
      getComputedStyle: () => ({ colorScheme: 'normal', backgroundColor: 'transparent' })
    }
  })

  try {
    assert.equal(checkDarkMode(), true)
  } finally {
    if (previousDocument === undefined) {
      Reflect.deleteProperty(globalThis, 'document')
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow })
    }
  }
})

test('checkDarkMode detects light mode from Tier 1 explicit DOM classes', () => {
  const previousDocument = (globalThis as { document?: unknown }).document
  const previousWindow = (globalThis as { window?: unknown }).window

  const mockDocument = {
    documentElement: {
      classList: {
        contains(cls: string) {
          return cls === 'light'
        }
      },
      getAttribute: () => null,
      style: { getPropertyValue: () => '' }
    },
    body: {
      classList: { contains: () => false },
      getAttribute: () => null
    }
  }

  Object.defineProperty(globalThis, 'document', { configurable: true, value: mockDocument })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({ matches: true }),
      getComputedStyle: () => ({ colorScheme: 'normal', backgroundColor: 'transparent' })
    }
  })

  try {
    assert.equal(checkDarkMode(), false)
  } finally {
    if (previousDocument === undefined) {
      Reflect.deleteProperty(globalThis, 'document')
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow })
    }
  }
})

test('checkDarkMode detects dark mode from Tier 3 optical background luminance', () => {
  const previousDocument = (globalThis as { document?: unknown }).document
  const previousWindow = (globalThis as { window?: unknown }).window

  const mockDocument = {
    documentElement: {
      classList: { contains: () => false },
      getAttribute: () => null,
      style: { getPropertyValue: () => '' }
    },
    body: {
      classList: { contains: () => false },
      getAttribute: () => null
    }
  }

  Object.defineProperty(globalThis, 'document', { configurable: true, value: mockDocument })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({ matches: false }),
      getComputedStyle: () => ({ colorScheme: 'normal', backgroundColor: 'rgb(12, 25, 39)' })
    }
  })

  try {
    assert.equal(checkDarkMode(), true)
  } finally {
    if (previousDocument === undefined) {
      Reflect.deleteProperty(globalThis, 'document')
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow })
    }
  }
})

test('checkDarkMode blends semi-transparent background over white and supports subscribeDarkModeChange cleanup', () => {
  const previousDocument = (globalThis as { document?: unknown }).document
  const previousWindow = (globalThis as { window?: unknown }).window

  const listeners: Array<() => void> = []
  let isDarkMedia = false
  let bgColor = 'rgba(0, 0, 0, 0.2)'

  const mockDocument = {
    documentElement: {
      classList: { contains: () => false },
      getAttribute: () => null,
      style: { getPropertyValue: () => '' }
    },
    body: {
      classList: { contains: () => false },
      getAttribute: () => null
    }
  }

  Object.defineProperty(globalThis, 'document', { configurable: true, value: mockDocument })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({
        matches: isDarkMedia,
        addEventListener: (_evt: string, fn: () => void) => {
          listeners.push(fn)
        },
        removeEventListener: (_evt: string, fn: () => void) => {
          const idx = listeners.indexOf(fn)
          if (idx !== -1) listeners.splice(idx, 1)
        }
      }),
      getComputedStyle: () => ({ colorScheme: 'normal', backgroundColor: bgColor })
    }
  })

  try {
    // rgba(0, 0, 0, 0.2) blended over white is light (rgb(204, 204, 204))
    assert.equal(checkDarkMode(), false)

    const received: boolean[] = []
    const unsubscribe = subscribeDarkModeChange((val) => received.push(val))
    bgColor = 'rgb(12, 25, 39)'
    isDarkMedia = true
    for (const fn of listeners) fn()
    assert.deepEqual(received, [true])
    unsubscribe()
    assert.equal(listeners.length, 0)
  } finally {
    if (previousDocument === undefined) {
      Reflect.deleteProperty(globalThis, 'document')
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow })
    }
  }
})
