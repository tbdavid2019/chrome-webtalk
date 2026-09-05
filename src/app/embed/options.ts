export type MobilePlacement = 'bottom' | 'top'
export type DockPlacement = 'right' | 'left'

export interface EmbedScriptDataset {
  webtalkMobilePlacement?: string
  webtalkPlacement?: string
}

export const readEmbedOptions = (
  dataset: EmbedScriptDataset
): {
  mobilePlacement: MobilePlacement
  placement: DockPlacement
} => ({
  mobilePlacement: dataset.webtalkMobilePlacement === 'top' ? 'top' : 'bottom',
  placement: dataset.webtalkPlacement === 'left' ? 'left' : 'right'
})
