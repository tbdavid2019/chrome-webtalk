import assert from 'node:assert/strict'
import test from 'node:test'

import { hasWebTalkEmbed, observeWebTalkEmbed } from './embedPresence.ts'

test('recognizes the official WebTalk embed host element', () => {
  assert.equal(hasWebTalkEmbed({ querySelector: () => ({}) }), true)
})

test('does not report an embed when its host element is absent', () => {
  assert.equal(hasWebTalkEmbed({ querySelector: () => null }), false)
})

test('removes extension UI when an official embed is mounted after the extension', () => {
  let embedMounted = false
  let onMutation: MutationCallback | undefined
  let observeCalls = 0
  let disconnectCalls = 0
  let removalCalls = 0

  const document = {
    documentElement: {} as HTMLElement,
    querySelector: () => (embedMounted ? {} : null)
  }
  const stop = observeWebTalkEmbed(
    document,
    () => {
      removalCalls += 1
    },
    (callback) => {
      onMutation = callback
      return {
        observe: () => {
          observeCalls += 1
        },
        disconnect: () => {
          disconnectCalls += 1
        }
      }
    }
  )

  assert.equal(observeCalls, 1)
  embedMounted = true
  onMutation?.([], {} as MutationObserver)

  assert.equal(removalCalls, 1)
  assert.equal(disconnectCalls, 1)
  stop()
  assert.equal(disconnectCalls, 2)
})
