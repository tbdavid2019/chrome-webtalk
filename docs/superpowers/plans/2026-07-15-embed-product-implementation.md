# WebTalk Embed Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship P2P-only and AI-hybrid website embeds with mobile half-screen layout, extension collision avoidance, and site-owner documentation.

**Architecture:** Extract an embed bootstrap that supplies immutable feature flags to the existing content UI. The Vite embed build emits two IIFE entries using that bootstrap. Embed mode hides extension-only settings; mobile layout is controlled inside the widget, leaving the host page untouched. The extension watches for the official embed host element and relinquishes its own mounted UI.

**Tech Stack:** TypeScript, React 18, Remesh, WXT content scripts, Vite library builds, Node built-in test runner.

---

### Task 1: Define and test embed feature options

**Files:**

- Create: `src/app/embed/options.ts`
- Create: `src/app/embed/options.test.ts`
- Modify: `src/app/embed/main.tsx`

- [ ] **Step 1: Write failing option parsing tests**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readEmbedOptions } from './options'

test('reads a valid mobile placement from embed data attributes', () => {
  assert.equal(readEmbedOptions({ webtalkMobilePlacement: 'top' }).mobilePlacement, 'top')
})

test('defaults invalid mobile placement to bottom', () => {
  assert.equal(readEmbedOptions({ webtalkMobilePlacement: 'side' }).mobilePlacement, 'bottom')
})
```

- [ ] **Step 2: Run the test and confirm it fails because `options.ts` does not exist**

Run: `node --experimental-strip-types --test src/app/embed/options.test.ts`

- [ ] **Step 3: Implement the minimal parser and add its fields to `WebTalkEmbedOptions`**

```ts
export type MobilePlacement = 'bottom' | 'top'

export const readEmbedOptions = (dataset: DOMStringMap) => ({
  mobilePlacement: dataset.webtalkMobilePlacement === 'top' ? 'top' : 'bottom'
})
```

Use this function from `readScriptOptions`; retain all existing room and AI endpoint parsing.

- [ ] **Step 4: Run the option tests and confirm they pass**

Run: `node --experimental-strip-types --test src/app/embed/options.test.ts`

### Task 2: Add feature-gated embed UI and mobile overlay

**Files:**

- Modify: `src/app/content/App.tsx`
- Modify: `src/app/content/views/AppMain/index.tsx`
- Modify: `src/app/content/views/AppButton/index.tsx`
- Modify: `src/app/content/views/Footer/index.tsx`

- [ ] **Step 1: Write a failing pure helper test for mobile panel style resolution**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEmbedPanelStyle } from './panelStyle'

test('uses the lower viewport half for default embed mobile placement', () => {
  assert.deepEqual(resolveEmbedPanelStyle(true, 'bottom'), { top: '50dvh', height: '50dvh', width: '100vw' })
})
```

- [ ] **Step 2: Run the test and confirm it fails because `panelStyle.ts` does not exist**

Run: `node --experimental-strip-types --test src/app/content/views/AppMain/panelStyle.test.ts`

- [ ] **Step 3: Implement the pure style helper and use it in `AppMain`**

```ts
export const resolveEmbedPanelStyle = (isMobile: boolean, placement: 'bottom' | 'top') =>
  isMobile ? { top: placement === 'top' ? '0' : '50dvh', height: '50dvh', width: '100vw' } : undefined
```

Track `window.matchMedia('(max-width: 639px)')` in `AppMain`; on mobile set fixed full-width half-height styles and do not render the resize handle. On desktop preserve the current 380–860px resizable side panel.

- [ ] **Step 4: Thread immutable capabilities from `App` to child views**

Add `enableAi`, `isEmbed`, and `mobilePlacement` props to `App`. When `enableAi` is false, do not register AI panel events, render `SummaryPanel`, AI dock controls, `PanelModeSwitch`, `@ai` autocomplete, AI topic suggestions, or AI request paths. Pass `isEmbed` to `AppButton`; hide the settings button and change the hidden-dock message to instruct embed users to refresh the page.

- [ ] **Step 5: Run the helper test and TypeScript check**

Run: `node --experimental-strip-types --test src/app/content/views/AppMain/panelStyle.test.ts && pnpm check`

### Task 3: Emit two official embed bundles

**Files:**

- Create: `src/app/embed/chat.tsx`
- Create: `src/app/embed/hybrid.tsx`
- Create: `scripts/verify-embed-output.test.mjs`
- Modify: `src/app/embed/main.tsx`
- Modify: `vite.embed.config.ts`

- [ ] **Step 1: Write a failing bundle assertion script**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'

test('embed build emits chat and hybrid bundles', () => {
  assert.equal(existsSync('output/webtalk/webtalk-chat.js'), true)
  assert.equal(existsSync('output/webtalk/webtalk.js'), true)
})
```

- [ ] **Step 2: Run the assertion before changing the build and confirm it fails**

Run: `pnpm build:embed && node --test scripts/verify-embed-output.test.mjs`

- [ ] **Step 3: Extract shared `bootstrapWebTalkEmbed(config)` from `main.tsx`**

Use separate thin entry points:

```ts
bootstrapWebTalkEmbed({ enableAi: false })
bootstrapWebTalkEmbed({ enableAi: true })
```

Configure Vite library entries so `webtalk-chat.js` comes from `chat.tsx` and `webtalk.js` from `hybrid.tsx`, with no hash names.

- [ ] **Step 4: Re-run the build assertion**

Run: `pnpm build:embed && node --test scripts/verify-embed-output.test.mjs`

### Task 4: Make the extension yield to an active website embed

**Files:**

- Create: `src/app/content/embedPresence.ts`
- Create: `src/app/content/embedPresence.test.ts`
- Modify: `src/app/content/index.tsx`

- [ ] **Step 1: Write a failing pure DOM predicate test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { hasWebTalkEmbed } from './embedPresence'

test('recognizes the official WebTalk embed host element', () => {
  assert.equal(hasWebTalkEmbed({ querySelector: () => ({}) } as Document), true)
})
```

- [ ] **Step 2: Run the test and confirm it fails because `embedPresence.ts` does not exist**

Run: `node --experimental-strip-types --test src/app/content/embedPresence.test.ts`

- [ ] **Step 3: Implement a document-lifetime embed observer**

```ts
export const hasWebTalkEmbed = (document: Pick<Document, 'querySelector'>) =>
  document.querySelector('webtalk-widget') !== null
```

Create an observer helper that calls `onEmbedPresent` immediately when the host exists or when it is added. In `index.tsx`, create the observer before `ui.mount()`, skip `ui.mount()` if present, and call `ui.remove()` once if it appears later. Disconnect the observer only when WXT disposes the content script.

- [ ] **Step 4: Run the observer test and full unit suite**

Run: `node --experimental-strip-types --test src/app/content/embedPresence.test.ts src/utils/messageRecall.test.ts src/protocol/Message.test.ts src/utils/roomId.test.ts src/utils/roomStorageKey.test.ts`

### Task 5: Create the generated site-owner guide and update project documentation

**Files:**

- Create: `public/index.html`
- Modify: `docs/web-embed.md`
- Modify: `docs/deploy-vercel.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write a failing generated-guide assertion**

```ts
test('embed build emits the Chinese integration guide', () => {
  assert.equal(existsSync('output/webtalk/index.html'), true)
})
```

- [ ] **Step 2: Run the build assertion and confirm `index.html` is absent**

Run: `pnpm build:embed && node --test scripts/verify-embed-output.test.mjs`

- [ ] **Step 3: Add `public/index.html` as a Vite public static asset and document both choices**

The guide must include exact snippets for `webtalk-chat.js`, `webtalk.js`, `meta/origin/path` room identity, `data-webtalk-mobile-placement`, manual mount, and Vercel AI endpoint. Include the three precise privacy distinctions from the design spec. Update README to make `webtalk-chat.js` its primary embed example; add a dated CHANGELOG entry listing dual bundles, mobile overlay, extension precedence, and docs.

- [ ] **Step 4: Rebuild and inspect generated guide references**

Run: `pnpm build:embed && node --test scripts/verify-embed-output.test.mjs && rg -n "webtalk-chat\.js|webtalk\.js|WebRTC|signaling|AI" output/webtalk/index.html`

### Task 6: Final verification and documentation review

**Files:**

- Modify: `docs/superpowers/plans/2026-07-15-embed-product-implementation.md`

- [ ] **Step 1: Run all project checks**

Run: `pnpm test && pnpm check && pnpm build:embed`

- [ ] **Step 2: Review emitted files and source changes**

Run: `find output/webtalk -maxdepth 1 -type f -print | sort && git diff --check && git diff --stat`

- [ ] **Step 3: Confirm each spec requirement against source and generated documentation**

Verify: both bundle names, no embed settings button, chat-only AI suppression, `50dvh` mobile overlay, extension observer, guide, README, CHANGELOG, and privacy wording are present.

- [ ] **Step 4: Commit the implementation**

```bash
git add public src vite.embed.config.ts docs README.md CHANGELOG.md scripts
git commit -m "feat: split WebTalk embeds for P2P chat and AI"
```
