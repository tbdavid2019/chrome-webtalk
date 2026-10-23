export interface RgbColor {
  r: number
  g: number
  b: number
  a: number
}

const THEME_ATTRS = ['data-theme', 'data-color-mode', 'data-bs-theme', 'data-mode', 'data-color-scheme'] as const
const OBSERVED_ATTRIBUTES = ['class', 'style', ...THEME_ATTRS]
const DARK_TOKEN_RE = /(?:^|[-_\s])dark(?:$|[-_\s])/i
const LIGHT_TOKEN_RE = /(?:^|[-_\s])light(?:$|[-_\s])/i

/**
 * 解析主題字串中的 dark / light 語義 token，避免誤判 highlight / twilight 或雙向宣告 "light dark"
 */
export function parseThemeToken(value: string | null | undefined): 'dark' | 'light' | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const hasDark = DARK_TOKEN_RE.test(trimmed)
  const hasLight = LIGHT_TOKEN_RE.test(trimmed)

  if (hasDark && hasLight) return null
  if (hasDark) return 'dark'
  if (hasLight) return 'light'
  return null
}

/**
 * 解析 rgb(...) 或 rgba(...) 色彩字串
 */
export function parseRgbColor(colorString: string | null | undefined): RgbColor | null {
  if (!colorString) return null
  const trimmed = colorString.trim().toLowerCase()
  if (!trimmed || trimmed === 'transparent' || trimmed === 'inherit' || trimmed === 'initial') {
    return null
  }

  const match = trimmed.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+%?))?\s*\)$/i)
  if (!match) return null

  const r = parseFloat(match[1])
  const g = parseFloat(match[2])
  const b = parseFloat(match[3])
  let a = 1

  if (match[4] !== undefined) {
    if (match[4].endsWith('%')) {
      a = parseFloat(match[4]) / 100
    } else {
      a = parseFloat(match[4])
    }
  }

  return { r, g, b, a }
}

/**
 * 計算感知亮度 (Perceived Luminance, ITU-R BT.601)
 * L = (0.299 * r + 0.587 * g + 0.114 * b) / 255
 */
export function calculatePerceivedLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * 第 1 層（顯式 DOM 標記）：檢查 documentElement 與 body 的 classList 與自訂主題屬性
 */
function checkExplicitDomMarks(): boolean | null {
  if (typeof document === 'undefined') return null

  const elements = [document.documentElement, document.body].filter(Boolean) as HTMLElement[]

  for (const el of elements) {
    const classList = el.classList
    if (classList?.contains('dark') || classList?.contains('theme-dark')) return true
    if (classList?.contains('light') || classList?.contains('theme-light')) return false

    for (const attr of THEME_ATTRS) {
      const token = parseThemeToken(el.getAttribute?.(attr))
      if (token === 'dark') return true
      if (token === 'light') return false
    }
  }

  return null
}

/**
 * 第 3 層（真實背景色光學亮度演算）：依序讀取 body、documentElement 與常見 SPA 根容器的 backgroundColor
 * 半透明色彩會與預設白底進行合成，避免將淡黑遮罩 rgba(0,0,0,0.2) 誤判為深色背景
 */
function checkBackgroundLuminance(): boolean | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null

  const rootContainer =
    typeof document.querySelector === 'function'
      ? (document.querySelector('#app, #root, #__next, main') as HTMLElement | null)
      : null
  const elements = [document.body, document.documentElement, rootContainer].filter(Boolean) as HTMLElement[]

  for (const el of elements) {
    try {
      const bg = window.getComputedStyle?.(el)?.backgroundColor
      const parsed = parseRgbColor(bg)
      if (parsed && parsed.a >= 0.2) {
        const alpha = Math.min(1, Math.max(0, parsed.a))
        const compositeR = parsed.r * alpha + 255 * (1 - alpha)
        const compositeG = parsed.g * alpha + 255 * (1 - alpha)
        const compositeB = parsed.b * alpha + 255 * (1 - alpha)
        const luminance = calculatePerceivedLuminance(compositeR, compositeG, compositeB)
        return luminance < 0.5
      }
    } catch {
      // 忽略計算樣式錯誤
    }
  }

  return null
}

/**
 * 宿主網頁環境與背景智慧感知（Host-Aware Adaptive Theme）
 * 四層環境感知瀑布流：
 * 1. 顯式 DOM 標記 (class / data-theme 等)
 * 2. 行內與 Computed color-scheme (支援 only dark / only light，排除雙向宣告 light dark)
 * 3. 真實背景色光學亮度演算 (Perceived Luminance)
 * 4. 作業系統偏好兜底 (prefers-color-scheme)
 */
export const checkDarkMode = (): boolean => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false
  }

  // 第 1 層：顯式 DOM 標記
  const domMark = checkExplicitDomMarks()
  if (domMark !== null) return domMark

  // 第 2 層：行內與 Computed color-scheme
  const inlineToken = parseThemeToken(document.documentElement.style?.getPropertyValue('color-scheme'))
  if (inlineToken === 'dark') return true
  if (inlineToken === 'light') {
    const bgResult = checkBackgroundLuminance()
    if (bgResult !== null) return bgResult
    return false
  }

  try {
    const computedToken = parseThemeToken(window.getComputedStyle?.(document.documentElement)?.colorScheme)
    if (computedToken === 'dark') return true
    if (computedToken === 'light') {
      const bgResult = checkBackgroundLuminance()
      if (bgResult !== null) return bgResult
      return false
    }
  } catch {
    // 忽略 computedStyle 例外
  }

  // 第 3 層：真實背景色光學亮度演算
  const bgLuminance = checkBackgroundLuminance()
  if (bgLuminance !== null) return bgLuminance

  // 第 4 層：作業系統偏好兜底
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

/**
 * 即時動態監聽連動（MutationObserver + matchMedia）
 * 具備變更去重與延遲掛載 body 自動補綁機制，避免重複強制重排
 */
export function subscribeDarkModeChange(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let lastNotified: boolean | null = checkDarkMode()
  let rafId: number | null = null

  const evaluateAndNotify = () => {
    rafId = null
    const nextIsDark = checkDarkMode()
    if (nextIsDark !== lastNotified) {
      lastNotified = nextIsDark
      callback(nextIsDark)
    }
  }

  const scheduleUpdate = () => {
    if (typeof window.requestAnimationFrame === 'function') {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(evaluateAndNotify)
    } else {
      evaluateAndNotify()
    }
  }

  // 1. matchMedia 監聽
  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (mediaQuery) {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', evaluateAndNotify)
    } else if (typeof (mediaQuery as any).addListener === 'function') {
      ;(mediaQuery as any).addListener(evaluateAndNotify)
    }
  }

  // 2. MutationObserver 監聽 documentElement 與 body（含 body 延遲掛載或替換）
  let attrObserver: MutationObserver | null = null
  let bodyMountObserver: MutationObserver | null = null
  let observedBody: HTMLElement | null = null

  const observeBodyIfPresent = () => {
    if (!attrObserver || typeof document === 'undefined' || !document.body) return
    if (observedBody === document.body) return
    observedBody = document.body
    try {
      attrObserver.observe(document.body, {
        attributes: true,
        attributeFilter: OBSERVED_ATTRIBUTES
      })
    } catch {
      // Safe guard
    }
  }

  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    attrObserver = new MutationObserver(() => {
      scheduleUpdate()
    })

    if (document.documentElement) {
      try {
        attrObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: OBSERVED_ATTRIBUTES
        })
      } catch {
        // Safe guard
      }
    }

    observeBodyIfPresent()

    if (document.documentElement) {
      bodyMountObserver = new MutationObserver(() => {
        if (document.body && document.body !== observedBody) {
          observeBodyIfPresent()
          scheduleUpdate()
        }
      })
      try {
        bodyMountObserver.observe(document.documentElement, { childList: true })
      } catch {
        // Safe guard
      }
    }
  }

  return () => {
    if (rafId !== null && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(rafId)
      rafId = null
    }
    if (mediaQuery) {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', evaluateAndNotify)
      } else if (typeof (mediaQuery as any).removeListener === 'function') {
        ;(mediaQuery as any).removeListener(evaluateAndNotify)
      }
    }
    attrObserver?.disconnect()
    bodyMountObserver?.disconnect()
  }
}

export default checkDarkMode
