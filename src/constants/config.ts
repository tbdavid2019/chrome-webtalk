// https://www.webfx.com/tools/emoji-cheat-sheet/

export const EMOJI_LIST = [
  '😀',
  '😄',
  '😁',
  '😆',
  '😅',
  '🤣',
  '😂',
  '🙂',
  '🙃',
  '🫠',
  '😉',
  '😊',
  '😇',
  '🥰',
  '😍',
  '🤩',
  '😘',
  '😗',
  '😚',
  '😙',
  '🥲',
  '😋',
  '😛',
  '😜',
  '🤪',
  '😝',
  '🤑',
  '🤗',
  '🤭',
  '🫢',
  '🫣',
  '🤫',
  '🤔',
  '🫡',
  '🤐',
  '🤨',
  '😐',
  '😶',
  '🫥',
  '😶‍🌫️',
  '😏',
  '😒',
  '🙄',
  '😬',
  '😮‍💨',
  '🤥',
  '😌',
  '😔',
  '😪',
  '🤤',
  '😴',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤮',
  '🤧',
  '🥵',
  '🥶',
  '🥴',
  '😵',
  '😵‍💫',
  '🤯',
  '🤠',
  '🥳',
  '🥸',
  '😎',
  '🤓',
  '🧐',
  '😕',
  '🫤',
  '😟',
  '🙁',
  '😮',
  '😯',
  '😲',
  '😳',
  '🥺',
  '🥹',
  '😦',
  '😧',
  '😨',
  '😰',
  '😥',
  '😢',
  '😭',
  '😱',
  '😖',
  '😣',
  '😞',
  '😓',
  '😩',
  '😫',
  '🥱',
  '😤',
  '😡',
  '😠',
  '🤬',
  '😈',
  '👿',
  '💀',
  '☠',
  '💩',
  '🤡',
  '👹',
  '👺',
  '👻',
  '👽',
  '👾',
  '🤖',
  '👀',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '😽',
  '🙀',
  '😿',
  '😾',
  '🙈',
  '🙉',
  '🙊',
  '👋',
  '🤚',
  '🖐',
  '✋',
  '🖖',
  '🫱',
  '🫲',
  '🫳',
  '🫴',
  '👌',
  '🤏',
  '✌',
  '🤞',
  '🫰',
  '🤟',
  '🤘',
  '🤙',
  '👈',
  '👉',
  '👆',
  '🖕',
  '👇',
  '☝',
  '🫵',
  '👍',
  '👎',
  '✊',
  '👊',
  '🤛',
  '🤜',
  '👏',
  '🙌',
  '🫶',
  '👐',
  '🤲',
  '🤝',
  '🙏',
  '✍',
  '💅'
] as const

// https://night-tailwindcss.vercel.app/docs/breakpoints
export const BREAKPOINTS = {
  sm: 640,
  // => @media (min-width: 640px) { ... }

  md: 768,
  // => @media (min-width: 768px) { ... }

  lg: 1024,
  // => @media (min-width: 1024px) { ... }

  xl: 1280,
  // => @media (min-width: 1280px) { ... }

  '2xl': 1536
  // => @media (min-width: 1536px) { ... }
} as const

export const MESSAGE_MAX_LENGTH = 500 as const

// Keep the storage namespace stable across patch releases. The previous
// version already used WEB_TALK_2.0.2, so 2.0.3 must continue reading it.
// Change this only together with an explicit storage migration.
export const STORAGE_NAME = 'WEB_TALK_2.0.2' as const

export const USER_INFO_STORAGE_KEY = 'WEB_TALK_USER_INFO' as const

export const MESSAGE_LIST_STORAGE_KEY = 'WEB_TALK_MESSAGE_LIST' as const

export const APP_STATUS_STORAGE_KEY = 'WEB_TALK_APP_STATUS' as const
/**
 * In chrome storage.sync, each key-value pair supports a maximum storage of 8kb
 * Image is encoded as base64, and the size is increased by about 33%.
 * 8kb * (1 - 0.33) = 5488 bytes
 */
export const MAX_AVATAR_SIZE = 5120 as const

export const SYNC_HISTORY_MAX_DAYS = 3 as const

/**
 * 歷史消息同步的批次大小，每批發送的消息數量
 */
export const SYNC_MESSAGES_BATCH_SIZE = 50 as const

/**
 * 歷史消息同步的批次間隔（毫秒），每批之間的延遲
 */
export const SYNC_BATCH_DELAY_MS = 500 as const

/**
 * 歷史消息同步時單個消息的延遲間隔（毫秒）
 */
export const SYNC_MESSAGE_DELAY_MS = 50 as const

/**
 * https://lgrahl.de/articles/demystifying-webrtc-dc-size-limit.html
 * Message max size is 256KiB; if the message is too large, it will cause the connection to drop.
 */
export const WEB_RTC_MAX_MESSAGE_SIZE = 262144 as const

export const VIRTUAL_ROOM_ID = 'WEB_TALK_VIRTUAL_ROOM' as const
