import type { UserInfo } from './UserInfo.ts'

export type UserInfoSyncStorage = Omit<UserInfo, 'avatar' | 'globalAvatar' | 'roomAvatars'>

export interface UserInfoLocalStorage {
  avatar?: string
  globalAvatar?: string
  roomAvatars?: Record<string, string>
}

export const splitUserInfoStorage = (
  userInfo: UserInfo
): {
  sync: UserInfoSyncStorage
  local: UserInfoLocalStorage
} => {
  const { avatar, globalAvatar, roomAvatars, ...sync } = userInfo

  return {
    sync,
    local: { avatar, globalAvatar, roomAvatars }
  }
}

export const mergeUserInfoStorage = (
  sync: UserInfoSyncStorage | UserInfo | null,
  local: UserInfoLocalStorage | null
): UserInfo | null => {
  if (!sync) return null

  const legacy = sync as UserInfo
  const { avatar: legacyAvatar, globalAvatar: legacyGlobalAvatar, roomAvatars: legacyRoomAvatars, ...settings } = legacy
  const avatar = local?.avatar ?? legacyAvatar ?? ''
  const globalAvatar = local?.globalAvatar ?? legacyGlobalAvatar
  const roomAvatars = local?.roomAvatars ?? legacyRoomAvatars

  return {
    ...settings,
    avatar,
    ...(globalAvatar === undefined ? {} : { globalAvatar }),
    ...(roomAvatars === undefined ? {} : { roomAvatars })
  } as UserInfo
}
