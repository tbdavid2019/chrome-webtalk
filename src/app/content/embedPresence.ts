const WEBTALK_EMBED_HOST = 'webtalk-widget'

type EmbedDocument = Pick<Document, 'documentElement' | 'querySelector'>
type EmbedObserver = Pick<MutationObserver, 'disconnect' | 'observe'>
type CreateEmbedObserver = (callback: MutationCallback) => EmbedObserver

export const hasWebTalkEmbed = (document: Pick<Document, 'querySelector'>): boolean =>
  document.querySelector(WEBTALK_EMBED_HOST) !== null

export const observeWebTalkEmbed = (
  document: EmbedDocument,
  onEmbedPresent: () => void,
  createObserver: CreateEmbedObserver = (callback) => new MutationObserver(callback)
): (() => void) => {
  let reported = false
  const reportEmbed = () => {
    if (reported || !hasWebTalkEmbed(document)) return
    reported = true
    observer.disconnect()
    onEmbedPresent()
  }

  const observer = createObserver(reportEmbed)
  reportEmbed()
  if (!reported) {
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  return () => observer.disconnect()
}
