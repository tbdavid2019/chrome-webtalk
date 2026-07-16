import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveEmbedMobileOverlayStyle, resolveEmbedPanelStyle } from './panelStyle.ts'

test('uses the same half-screen overlay geometry for every embed panel', () => {
  assert.deepEqual(resolveEmbedMobileOverlayStyle('bottom'), {
    top: '50dvh',
    height: '50dvh',
    width: '100vw'
  })
  assert.deepEqual(resolveEmbedMobileOverlayStyle('top'), { top: '0', height: '50dvh', width: '100vw' })
})

test('uses the lower viewport half for default embed mobile placement', () => {
  assert.deepEqual(resolveEmbedPanelStyle(true, 'bottom'), { top: '50dvh', height: '50dvh', width: '100vw' })
})

test('uses the upper viewport half when requested', () => {
  assert.deepEqual(resolveEmbedPanelStyle(true, 'top'), { top: '0', height: '50dvh', width: '100vw' })
})

test('leaves desktop panel dimensions to the resizable sidebar', () => {
  assert.equal(resolveEmbedPanelStyle(false, 'bottom'), undefined)
})
