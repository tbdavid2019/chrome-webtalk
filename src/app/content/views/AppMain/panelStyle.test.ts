import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveEmbedMobileOverlayStyle, resolveEmbedPanelStyle, resolvePanelSizeStyle } from './panelStyle.ts'

test('keeps desktop embed panels inside the viewport', () => {
  assert.deepEqual(resolvePanelSizeStyle(440, true, false, 'bottom'), {
    width: '440px',
    maxWidth: '100vw',
    pointerEvents: 'auto'
  })
})

test('keeps extension panels inside the viewport after resizing the browser', () => {
  assert.deepEqual(resolvePanelSizeStyle(860, false, false, 'bottom'), {
    width: '860px',
    maxWidth: '100vw',
    pointerEvents: 'auto'
  })
})

test('mobile embeds fill the viewport without retaining the resizable width', () => {
  assert.deepEqual(resolvePanelSizeStyle(440, true, true, 'bottom'), {
    width: 'auto',
    maxWidth: '100vw',
    pointerEvents: 'auto',
    top: '50dvh',
    height: '50dvh',
    left: '0',
    right: '0'
  })
})

test('uses the same half-screen overlay geometry for every embed panel', () => {
  assert.deepEqual(resolveEmbedMobileOverlayStyle('bottom'), {
    top: '50dvh',
    height: '50dvh',
    left: '0',
    right: '0',
    width: 'auto'
  })
  assert.deepEqual(resolveEmbedMobileOverlayStyle('top'), {
    top: '0',
    height: '50dvh',
    left: '0',
    right: '0',
    width: 'auto'
  })
})

test('uses the lower viewport half for default embed mobile placement', () => {
  assert.deepEqual(resolveEmbedPanelStyle(true, 'bottom'), {
    top: '50dvh',
    height: '50dvh',
    left: '0',
    right: '0',
    width: 'auto'
  })
})

test('uses the upper viewport half when requested', () => {
  assert.deepEqual(resolveEmbedPanelStyle(true, 'top'), {
    top: '0',
    height: '50dvh',
    left: '0',
    right: '0',
    width: 'auto'
  })
})

test('leaves desktop panel dimensions to the resizable sidebar', () => {
  assert.equal(resolveEmbedPanelStyle(false, 'bottom'), undefined)
})
