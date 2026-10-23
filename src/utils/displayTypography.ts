import type { UserInfo } from '@/domain/UserInfo'

export type DisplayFontSize = NonNullable<UserInfo['displayFontSize']>
export type DisplayFontFamily = NonNullable<UserInfo['displayFontFamily']>

export const DISPLAY_FONT_SCALE_VALUES: Record<DisplayFontSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
  xlarge: 1.25
}

export const DISPLAY_FONT_FAMILY_VALUES: Record<DisplayFontFamily, string> = {
  webtalk:
    "'GenJyuuGothic', -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', 'Segoe UI', Roboto, ui-sans-serif, system-ui, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  cjk: "'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', 'Yu Gothic', sans-serif",
  serif: "ui-serif, Georgia, 'Times New Roman', serif",
  mono: "'JetBrainsMono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
}

export const DEFAULT_DISPLAY_FONT_SIZE: DisplayFontSize = 'medium'
export const DEFAULT_DISPLAY_FONT_FAMILY: DisplayFontFamily = 'webtalk'
