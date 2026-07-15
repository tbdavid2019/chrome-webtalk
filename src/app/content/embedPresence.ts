const WEBTALK_EMBED_HOST = 'webtalk-widget'

type EmbedDocument = Pick<Document, 'documentElement' | 'querySelector'>

export const hasWebTalkEmbed = (document: Pick<Document, 'querySelector'>): boolean =>
  document.querySelector(WEBTALK_EMBED_HOST) !== null

export const observeWebTalkEmbed = (document: EmbedDocument, onEmbedPresent: () => void): (() => void) => {
  let reported = false
  const reportEmbed = () => {
    if (reported || !hasWebTalkEmbed(document)) return
    reported = true
    observer.disconnect()
    onEmbedPresent()
  }

  const observer = new MutationObserver(reportEmbed)
  reportEmbed()
  if (!reported) {
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  return () => observer.disconnect()
}
