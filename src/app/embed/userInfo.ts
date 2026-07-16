import { nanoid } from 'nanoid'

import { MAX_AVATAR_SIZE } from '../../constants/config.ts'
import type { UserInfo } from '../../domain/UserInfo.ts'
import generateRandomAvatar from '../../utils/generateRandomAvatar.ts'

const RANDOM_NAME_ADJECTIVES = ['Curious', 'Sunny', 'Quiet', 'Brave', 'Happy', 'Clever']
const RANDOM_NAME_NOUNS = ['Fox', 'Cat', 'Owl', 'Panda', 'Koala', 'Bear']

const pickRandom = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

export const shouldAutoCreateEmbedUserInfo = ({
  isEmbed,
  userInfoLoadFinished,
  userInfo
}: {
  isEmbed: boolean
  userInfoLoadFinished: boolean
  userInfo: Pick<UserInfo, 'id'> | null
}): boolean => isEmbed && userInfoLoadFinished && !userInfo

export const createRandomEmbedUserInfo = async (): Promise<UserInfo> => {
  const avatar = await generateRandomAvatar(MAX_AVATAR_SIZE)

  return {
    id: nanoid(),
    name: `${pickRandom(RANDOM_NAME_ADJECTIVES)} ${pickRandom(RANDOM_NAME_NOUNS)} ${nanoid(3)}`,
    avatar,
    createTime: Date.now(),
    language: 'auto',
    compatibilityMode: 'legacy',
    themeMode: 'system',
    developerMode: false,
    bannedUserIds: [],
    hideAllAiMessages: false,
    aiTopicSuggestionsEnabled: true,
    danmakuEnabled: true,
    danmakuOpacity: 0.8,
    danmakuSpeed: 'normal',
    notificationEnabled: true,
    notificationType: 'at',
    roomAvatarsEnabled: true,
    globalAvatar: avatar,
    roomAvatars: {}
  }
}
