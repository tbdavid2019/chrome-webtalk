export type MobilePlacement = 'bottom' | 'top'

export interface EmbedScriptDataset {
  webtalkMobilePlacement?: string
}

export const readEmbedOptions = (dataset: EmbedScriptDataset): { mobilePlacement: MobilePlacement } => ({
  mobilePlacement: dataset.webtalkMobilePlacement === 'top' ? 'top' : 'bottom'
})
