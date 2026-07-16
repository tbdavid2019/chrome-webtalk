# Embed 與 Extension 即時文字同步交接規格

狀態：v2.1.0 已實作。這份文件是目前原始碼的交接規格，不是待施工的舊方案。

## 目標

- Embed A 傳送文字後，Embed B 不 reload 即收到訊息並觸發 danmaku。
- 文字、讚、倒讚、撤回、使用者同步與歷史同步使用同一個傳輸核心。
- Chrome extension 的現有行為維持不變。
- Embed 只負責平台、掛載、Shadow DOM 與 UI；不得再建立另一套聊天傳輸層。

## 正確架構

```text
Embed UI ───────┐
                ├─ ChatRoomDomain ─ ChatRoomExtern ─ BaseRoom
Extension UI ───┘                                      │
                                                       ▼
                                  Peer extends @rtco/client Artico
                                                       │
                                  peer.join(roomId) → Room
                                                       │
                                  Room.send / Room.on('message')
                                                       │
                                  WebRTC DataChannel（訊息內容）
                                                       │
                                  Artico signaling（只建立連線）
```

核心檔案：

- `src/domain/impls/Peer.ts`：只建立單例 `Peer extends Artico`，使用 Artico 內建 signaling。
- `src/domain/impls/BaseRoom.ts`：使用 `peer.join(roomId)`，公開訊息使用 `room.send(serializedMessage)` 廣播，指定 peer 才傳第二個參數。
- `src/domain/impls/ChatRoom.ts`：extension 的 `ChatRoomImpl` 與 Embed 的 `createChatRoomImpl` 只差 room identity，底層都是同一個 `BaseRoom`。
- `src/domain/ChatRoom.ts`：負責文字／反應 payload、訊息列表、`OnTextMessageEvent` 與 danmaku 事件；不可在這裡新增第二條傳輸路徑。
- `src/app/embed/main.tsx`：只建立 web platform、store、Shadow DOM 與 `App` UI。

## 文字收發流程

1. `SendTextMessageCommand` 建立 legacy 或 upstream text payload。
2. 公開文字呼叫 `chatRoomExtern.sendMessage(payload)`，不先查應用層 `UserList`。
3. `BaseRoom.sendMessage()` 使用 `JSONR.stringify()`，再呼叫 Artico `Room.send()` 廣播。
4. 對端 `Room.on('message')` 收到字串後由 `BaseRoom.onMessage()` parse。
5. `ChatRoomDomain.OnMessageEffect` 發出 `OnTextMessageEvent` 並建立 `MessageList` item。
6. `DanmakuDomain` 訂閱 `OnTextMessageEvent`，立即顯示彈幕。

## 明確禁止的做法

- 不要新增 Vercel WebSocket relay、Redis、Durable Object 或其他聊天 relay。
- 不要新增 `SocketSignaling`、`DeterministicRoom`、自訂 call map、ready peer map 或訊息 queue。
- 不要用 `UserListQuery` 或 signaling member 清單決定公開文字是否要送出；DataChannel 的 Room 才是傳輸真實來源。
- 不要在 Embed 另外複製 `ChatRoomDomain`、`BaseRoom` 或 message parser。
- 不要把 reload 後的 IndexedDB history 當作即時同步；history 只是新 peer 加入後的補同步。

## 房間識別

Embed 可使用 `data-webtalk-scope="origin"`、`meta`、`path` 或明確 `data-webtalk-room-id`。只要 A、B resolve 出相同的 room ID，Artico 才會把兩個 browser context 放入同一個 Room。extension 仍使用既有 host room identity。

## 驗證清單

```bash
pnpm test
pnpm check
pnpm build:embed
pnpm build:chrome
pnpm pack:chrome
```

建置後確認：

- `output/webtalk/webtalk.js` 與 `output/webtalk/webtalk-chat.js` 可以載入。
- `output/chrome-mv3/manifest.json` 版本與 `package.json` 相同。
- 原始碼不應出現 `DeterministicRoom`、`SocketSignaling`、`WebSocketRelay` 或 `/api/webtalk/ws`。

## 限制

WebRTC DataChannel 是 P2P 即時傳輸，不是永久訊息資料庫。若房間內沒有任何在線 peer，離線期間的文字不可能由另一個瀏覽器收到；若產品需要離線訊息與跨 instance fan-out，才應另外設計集中式持久化 relay。
