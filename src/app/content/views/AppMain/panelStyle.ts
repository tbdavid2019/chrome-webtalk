import type { MobilePlacement } from '@/app/embed/options'

export const resolveEmbedMobileOverlayStyle = (placement: MobilePlacement) => ({
  top: placement === 'top' ? '0' : '50dvh',
  height: '50dvh',
  left: '0',
  right: '0',
  width: 'auto'
})

export const resolveEmbedPanelStyle = (isMobile: boolean, placement: MobilePlacement) => {
  if (!isMobile) return undefined

  return resolveEmbedMobileOverlayStyle(placement)
}

export const resolvePanelSizeStyle = (
  size: number,
  isEmbed: boolean,
  isMobile: boolean,
  placement: MobilePlacement
) => ({
  width: `${size}px`,
  maxWidth: '100vw',
  pointerEvents: 'auto' as const,
  ...(isEmbed ? resolveEmbedPanelStyle(isMobile, placement) : undefined)
})
