let mountedRoot: Element | DocumentFragment | null = null

export const setRootNode = (root: Element | DocumentFragment | null) => {
  mountedRoot = root
}

export const getRootNode = () => {
  return mountedRoot || document.querySelector(__NAME__)?.shadowRoot?.querySelector('#root') || document.body
}

export default getRootNode
