import type { MobilePlacement } from '@/app/embed/options'

export const resolveEmbedPanelStyle = (isMobile: boolean, placement: MobilePlacement) => {
  if (!isMobile) return undefined

  return {
    top: placement === 'top' ? '0' : '50dvh',
    height: '50dvh',
    width: '100vw'
  }
}
