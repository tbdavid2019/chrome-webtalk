# WebTalk Embed Product Design

## Goal

Make WebTalk practical for any website owner to embed, while keeping the browser extension and embedded widget from appearing together. Provide a clear P2P-first product and a separately chosen AI-enhanced product.

## Deliverables

- `output/webtalk/webtalk-chat.js`: P2P chat embed with no AI UI or server-side AI requests.
- `output/webtalk/webtalk.js`: hybrid embed with chat plus existing AI workspace.
- `output/webtalk/index.html`: a self-contained, static Chinese integration guide for site owners.
- Updated README, embed documentation, Vercel deployment documentation, and CHANGELOG.

## Embed UI

Both embed variants use the website platform adapter and Shadow DOM, and never show extension-only controls. The floating dock has chat, theme, and close controls; it has no settings button. The chat-only build additionally omits the AI workspace entry point.

On desktop, the chat remains a right-side resizable panel. On mobile, it becomes a fixed half-screen overlay. The overlay does not change the host website DOM, layout, scroll position, or styles; the remaining half of the browser viewport continues to reveal and scroll the host page. The initial mobile placement is the lower half so page content remains visible above it. It must respect dynamic mobile browser chrome via `dvh`, fit narrow widths, and disable desktop resize affordances.

## Extension precedence

The extension is solely responsible for avoiding collisions. It observes the host page DOM for WebTalk's fixed `webtalk-widget` host element, which is created by the distributed embed bundle before React renders.

- If that element already exists, the extension content script does not mount its UI.
- If it appears after the extension mounted, the extension unmounts its UI and releases its room connections.
- The observer remains active for the document lifetime so delayed and manually mounted embeds are covered.

No page-owner convention beyond loading an official WebTalk embed bundle is required. The extension does not attempt to block the external script; it yields its own UI to the active website embed.

## Build architecture

Use two Vite library entry points sharing an embed bootstrap and the existing domain/UI code. The bootstrap receives explicit feature flags:

- `enableAi`: controls the AI dock button, workspace, and AI-related chat controls.
- `mobilePlacement`: defaults to `bottom` and is configurable via `data-webtalk-mobile-placement` / `mount` options.

The chat-only entry hardcodes `enableAi: false`; the hybrid entry hardcodes `enableAi: true`. Common room identity, auto-mount behavior, storage behavior, and controller API remain consistent.

## Integration guide and privacy wording

The generated `index.html` starts with a minimal `webtalk-chat.js` snippet, followed by room parameters, mobile placement, manual mount, hybrid AI embed, and troubleshooting.

It must make these separate claims:

- Chat messages use WebRTC DataChannel P2P and are stored in the users' browsers, not written to the Vercel AI proxy.
- Connection setup uses an Artico signaling service to exchange WebRTC connection information; it is not a chat-message store.
- The hybrid build's AI requests send page content and prompts to the configured Vercel AI proxy and its configured LLM provider. The chat-only build makes no such AI requests.

The guide must not claim that no data of any kind reaches a server.

## Verification

- Unit/type validation: `pnpm test`, `pnpm check`.
- Build validation: `pnpm build:embed`, confirming both JavaScript files and `index.html` are emitted.
- Manual inspection: ensure the guide refers only to emitted filenames and its generated HTML loads without a build-time-only dependency.

## Out of scope

- Reflowing or embedding the host site into an iframe for a true two-pane mobile layout.
- Blocking third-party web scripts from the extension.
- Changing signaling, STUN/TURN, or P2P protocol infrastructure.
