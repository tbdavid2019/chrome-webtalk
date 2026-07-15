export const DEFAULT_WEBTALK_DOMAIN = 'https://webtalk-nine.vercel.app'

export const resolveWebTalkDomain = (domain = process.env.WEBTALK_DOMAIN): string => {
  const normalized = domain?.trim().replace(/\/+$/, '')
  return normalized || DEFAULT_WEBTALK_DOMAIN
}
