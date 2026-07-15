import assert from 'node:assert/strict'
import test from 'node:test'

import { readEmbedOptions } from './options.ts'

test('reads a valid mobile placement from embed data attributes', () => {
  assert.equal(readEmbedOptions({ webtalkMobilePlacement: 'top' }).mobilePlacement, 'top')
})

test('defaults invalid mobile placement to bottom', () => {
  assert.equal(readEmbedOptions({ webtalkMobilePlacement: 'side' }).mobilePlacement, 'bottom')
})
